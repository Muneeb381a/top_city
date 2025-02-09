// Define UTM Zone 43N (EPSG:32643) projection manually
proj4.defs(
  "EPSG:32643",
  "+proj=utm +zone=43 +datum=WGS84 +units=m +no_defs"
);

const loader = document.getElementById("loader");
const loaderr = document.getElementById("loaderr");
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const tableBody = document.getElementById("table-body");
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");
const pageInfo = document.getElementById("pageInfo");

// Get card elements to update plot counts dynamically
const totalPlotsCard = document.querySelector(".card-1 h4");
const commercialPlotsCard = document.querySelector(".card-2 h4");
const residentialPlotsCard = document.querySelector(".card-3 h4");

let currentPage = 1;
const rowsPerPage = 10;
let allData = [];

// Initialize the map
const map = L.map("map").setView([31.4181, 72.9947], 5);

// Add tile layer
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

// Custom icons for different plot types
const commercialIcon = L.icon({
  iconUrl: "https://www.iconarchive.com/download/i57835/icons-land/vista-map-markers/Map-Marker-Marker-Outside-Pink.256.png", // Commercial marker
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const residentialIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1673/1673221.png", // Residential marker
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

// Create marker cluster group
const markers = L.markerClusterGroup();

// Function to handle markers, table, and updating the cards
function handleMarkersAndTable(data, searchQuery = "") {
  if (!data.features || !Array.isArray(data.features)) {
    console.error("Invalid data format");
    return;
  }

  markers.clearLayers();
  tableBody.innerHTML = "";

  let totalPlots = 0;
  let commercialPlots = 0;
  let residentialPlots = 0;

  const filteredData = [];

  data.features.forEach(feature => {
    let [lon, lat] = feature.geometry.coordinates;

    // Convert UTM to WGS84 if necessary
    if (Math.abs(lon) > 100000) {
      [lon, lat] = proj4("EPSG:32643", "EPSG:4326", [lon, lat]);
    }

    const { Buyer_Name, CNIC, CONTACT, Address, Plot_Size, Block, TYPE } = feature.properties;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!(
        Buyer_Name?.toLowerCase().includes(query) ||
        CNIC?.includes(searchQuery)
      )) return;
    }

    // Count plots based on type
    totalPlots++;
    let markerIcon = null;

    if (TYPE?.toLowerCase() === "commercial") {
      commercialPlots++;
      markerIcon = commercialIcon;
    } else if (TYPE?.toLowerCase() === "residential") {
      residentialPlots++;
      markerIcon = residentialIcon;
    }

    // Store filtered data for pagination
    filteredData.push({ Buyer_Name, CNIC, CONTACT, Address, Plot_Size, Block, TYPE, lat, lon });

    // Add marker with different icons
    const marker = L.marker([lat, lon], { icon: markerIcon });
    marker.bindPopup(`
      <div class="popup-content">
        <h4>${Buyer_Name || "No Name"}</h4>
        <p><strong>CNIC:</strong> ${CNIC || "N/A"}</p>
        <p><strong>CONTACT:</strong> ${CONTACT || "N/A"}</p>
        <p><strong>Address:</strong> ${Address || "N/A"}</p>
        <p><strong>Plot Size:</strong> ${Plot_Size || "N/A"}</p>
        <p><strong>Block:</strong> ${Block || "N/A"}</p>
        <p><strong>Type:</strong> ${TYPE || "N/A"}</p>
      </div>
    `);
    markers.addLayer(marker);
  });

  map.addLayer(markers);
  allData = filteredData;
  updateTable();

  // Update the plot counts in the cards
  totalPlotsCard.textContent = totalPlots;
  commercialPlotsCard.textContent = commercialPlots;
  residentialPlotsCard.textContent = residentialPlots;
}

// Function to update table with pagination
function updateTable() {
  tableBody.innerHTML = "";
  const start = (currentPage - 1) * rowsPerPage;
  const paginatedData = allData.slice(start, start + rowsPerPage);

  paginatedData.forEach(item => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.Buyer_Name || "N/A"}</td>
      <td>${item.CNIC || "N/A"}</td>
      <td>${item.CONTACT || "N/A"}</td>
      <td>${item.Address || "N/A"}</td>
      <td>${item.Plot_Size || "N/A"}</td>
      <td>${item.Block || "N/A"}</td>
      <td>${item.TYPE || "N/A"}</td>
    `;

    row.dataset.lat = item.lat;
    row.dataset.lon = item.lon;

    row.addEventListener("click", function () {
      const lat = parseFloat(this.dataset.lat);
      const lon = parseFloat(this.dataset.lon);
      if (!isNaN(lat) && !isNaN(lon)) {
        map.setView([lat, lon], 17);
      }
    });

    tableBody.appendChild(row);
  });

  pageInfo.textContent = `Page ${currentPage}`;
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = start + rowsPerPage >= allData.length;
}

prevPageBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    updateTable();
  }
});

nextPageBtn.addEventListener("click", () => {
  if ((currentPage * rowsPerPage) < allData.length) {
    currentPage++;
    updateTable();
  }
});

fetch("data.json")
  .then(response => response.json())
  .then(data => {
    setTimeout(() => {
      handleMarkersAndTable(data);
      loader.style.display = "none";
    }, 3000);

    function performSearch() {
      loaderr.style.display = "flex";
      loaderr.style.opacity = "1";
      markers.clearLayers();

      setTimeout(() => {
        handleMarkersAndTable(data, searchInput.value.trim());
        loaderr.style.display = "none";
      }, 500);
    }

    searchButton.addEventListener("click", performSearch);
    searchInput.addEventListener("keypress", e => e.key === "Enter" && performSearch());
    searchInput.addEventListener("input", () => {
      if (searchInput.value.trim() === "") performSearch();
    });
  })
  .catch(error => {
    console.error("Error loading data:", error);
    loaderr.style.display = "none";
  });


  document.addEventListener('DOMContentLoaded', () => {
    const particleContainer = document.createElement('div');
    particleContainer.className = 'particles';
    document.body.appendChild(particleContainer);
  
    const createParticle = () => {
      const particle = document.createElement('div');
      particle.className = 'particle';
      
      // Random direction variables
      const dx = Math.random() > 0.5 ? 1 : -1;
      const dy = Math.random() > 0.5 ? 1 : -1;
  
      // Calculate random starting and ending positions
      const startX = Math.random() * 100; // Start position in percentage
      const startY = Math.random() * 100; // Start position in percentage
      const endX = startX + (Math.random() * 50 * dx); // End position, random offset from start
      const endY = startY + (Math.random() * 50 * dy); // End position, random offset from start
      
      particle.style.cssText = `
        --start-x: ${startX}vw;
        --start-y: ${startY}vh;
        --end-x: ${endX}vw;
        --end-y: ${endY}vh;
        left: ${startX}vw;
        top: ${startY}vh;
        width: ${Math.random() * 20 + 5}px;
        height: ${Math.random() * 20 + 5}px;
        animation-duration: ${Math.random() * 15 + 10}s;
        animation-delay: ${Math.random() * 10}s;
      `;
      
      particleContainer.appendChild(particle);
    };
  
    // Create particles with staggered initialization
    for (let i = 0; i < 50; i++) {
      setTimeout(createParticle, i * 150);
    }
  });