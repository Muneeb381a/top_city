// Define the UTM Zone 43N (EPSG:32643) projection manually
proj4.defs(
  "EPSG:32643",
  "+proj=utm +zone=43 +datum=WGS84 +units=m +no_defs"
);

const loader = document.getElementById("loader");
const loaderr = document.getElementById("loaderr");
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");

// Initialize map
const map = L.map("map").setView([31.4181, 72.9947], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// Boundary styles
const boundaryStyles = {
  district: {
    color: "red",
    weight: 3,
    fillColor: "yellow",
    fillOpacity: 0.3
  },
  city: {
    color: "blue",
    weight: 5,
    fillColor: "transparent",
    fillOpacity: 0
  }
};


Promise.all([
  fetch("faisalabad-boundary.geojson").then(r => r.json()),
  fetch("faisalabad-city-boundary.geojson").then(r => r.json())
])
  .then(([districtData, cityData]) => {
    L.geoJSON(districtData, { style: boundaryStyles.district }).addTo(map);
    L.geoJSON(cityData, { style: boundaryStyles.city }).addTo(map);
  })
  .catch(error => {
    console.error("Error loading boundary data:", error);
  });


function handleMarkers(data, searchQuery = "") {
  const markerLayer = L.layerGroup().addTo(map);
  const bounds = [];

  data.features.forEach(feature => {
    let [lon, lat] = feature.geometry.coordinates;

    
    if (Math.abs(lon) > 100) {
      [lon, lat] = proj4("EPSG:32643", "EPSG:4326", [lon, lat]);
    }

    const { Buyer_Name, CNIC, Address, Plot_Size, Block, TYPE } = feature.properties;

    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!(
        Buyer_Name?.toLowerCase().includes(query) ||
        CNIC?.includes(searchQuery)
      )) return;
    }

    
    const marker = L.marker([lat, lon]).addTo(markerLayer);
    marker.bindPopup(`
      <div class="popup-content">
        <h4>${Buyer_Name || 'No Name'}</h4>
        <p><strong>CNIC:</strong> ${CNIC || 'N/A'}</p>
        <p><strong>Address:</strong> ${Address || 'N/A'}</p>
        <p><strong>Plot Size:</strong> ${Plot_Size || 'N/A'}</p>
        <p><strong>Block:</strong> ${Block || 'N/A'}</p>
        <p><strong>Type:</strong> ${TYPE || 'N/A'}</p>
      </div>
    `);

    bounds.push([lat, lon]);
  });

  
  bounds.length > 0 ? map.fitBounds(bounds) : map.setView([31.4181, 72.9947], 13);
}


fetch("data.json")
  .then(response => response.json())
  .then(data => {
    
    setTimeout(() => {
      handleMarkers(data);
      loader.style.display = "none";
    }, 3000);

    
    function performSearch() {
      
      loaderr.style.display = "flex";
      loaderr.style.opacity = "1";

      
      map.eachLayer(layer => {
        if (layer instanceof L.LayerGroup) map.removeLayer(layer);
      });

      
      setTimeout(() => {
        handleMarkers(data, searchInput.value.trim());
        
        
        loader.style.opacity = "0";
        setTimeout(() => {
          loaderr.style.display = "none";
        }, 300);
      }, 500);
    }

    
    searchButton.addEventListener("click", performSearch);
    searchInput.addEventListener("keypress", e => e.key === "Enter" && performSearch());
    
    
    searchInput.addEventListener("input", () => {
      if (searchInput.value.trim() === "") {
        performSearch();
      }
    });
  })
  .catch(error => {
    console.error("Error loading data:", error);
    loaderr.style.display = "none";
  });