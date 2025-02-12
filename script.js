// Define the UTM Zone 43N (EPSG:32643) projection manually
proj4.defs(
  "EPSG:32643",
  "+proj=utm +zone=43 +datum=WGS84 +units=m +no_defs"
);

const loader = document.getElementById("loader");
const loaderr = document.getElementById("loaderr");
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const controls = document.getElementById("controls");

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

const sidebar = document.getElementById("sidebar");
const sidebarTitle = document.getElementById("sidebar-title");
const sidebarInfo = document.getElementById("sidebar-info");
const closeSidebar = document.getElementById("close-sidebar");

function openSidebar(title, info) {
  sidebarTitle.innerText = title;
  sidebarInfo.innerHTML = info;
  sidebar.classList.add("active");
}

closeSidebar.addEventListener("click", function () {
  sidebar.classList.remove("active");
});

function handleMarkers(data, searchQuery = "") {
  const markerLayer = L.layerGroup();
  const bounds = [];

  data.features.forEach(feature => {
    let [lon, lat] = feature.geometry.coordinates;
    if (Math.abs(lon) > 100) {
      [lon, lat] = proj4("EPSG:32643", "EPSG:4326", [lon, lat]);
    }

    const { Buyer_Name, CNIC, CONTACT, Address, Status, Plot_Size, Block, TYPE, COM_STATUS, COLONY } = feature.properties;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!Buyer_Name?.toLowerCase().includes(query) && !CNIC?.includes(searchQuery)) return;
    }

    const marker = L.marker([lat, lon]);

    // Detect screen width
    marker.on("click", function () {
      const infoContent = `
        <p><strong>CNIC:</strong> ${CNIC || 'N/A'}</p>
        <p><strong>CONTACT:</strong> ${CONTACT || 'N/A'}</p>
        <p><strong>Address:</strong> ${Address || 'N/A'}</p>
        <p><strong>Status:</strong> ${Status || 'N/A'}</p>
        <p><strong>Plot Size:</strong> ${Plot_Size || 'N/A'}</p>
        <p><strong>Block:</strong> ${Block || 'N/A'}</p>
        <p><strong>Type:</strong> ${TYPE || 'N/A'}</p>
        <p><strong>COM_STATUS:</strong> ${COM_STATUS || 'N/A'}</p>
        <p><strong>COLONY:</strong> ${COLONY || 'N/A'}</p>
      `;

      if (window.innerWidth <= 468) {
        openSidebar(Buyer_Name || "No Name", infoContent);
      } else {
        marker.bindPopup(`<h4>${Buyer_Name || 'No Name'}</h4>${infoContent}`).openPopup();
      }
    });

    markerLayer.addLayer(marker);
    bounds.push([lat, lon]);
  });

  markerLayer.addTo(map);

  if (bounds.length > 0) {
    map.fitBounds(bounds);
  } else {
    map.setView([31.4181, 72.9947], 13);
  }
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

  map.on('popupopen', function (e) {
    let popup = e.popup._container;
    popup.style.zIndex = "10010"; 
  });
  

  marker.on("click", () => {
    map.setView([lat - 0.003, lon], 16, { animate: true });
  });
  
const popupOverlay = document.getElementById("full-screen-popup");
const popupTitle = document.getElementById("popup-title");
const popupInfo = document.getElementById("popup-info");
const closePopup = document.getElementById("close-popup");

function openPopup(title, info) {
  popupTitle.innerText = title;
  popupInfo.innerText = info;
  popupOverlay.classList.add("active");
}

closePopup.addEventListener("click", function () {
  popupOverlay.classList.remove("active");
});

const marker = L.marker([31.5204, 74.3587]).addTo(map); 

marker.on("click", function () {
  openPopup("Property Details", "More information about this location...");
});
const searchControls = document.querySelector(".controls");

function openPopup(title, info) {
  popupOverlay.classList.add("active");
  searchControls.style.display = "none"; // Hide search box
}

document.getElementById("close-popup").addEventListener("click", function () {
  popupOverlay.classList.remove("active");
  searchControls.style.display = "block"; 
});

document.addEventListener("DOMContentLoaded", () => {
  const popupOverlay = document.querySelector(".popup-overlay");
  const closePopupButton = document.querySelector("#close-popup");
  const triggerPopupButton = document.querySelector("#search-button"); 

  function openPopup() {
      popupOverlay.classList.add("active");
  }
  function closePopup() {
      popupOverlay.classList.remove("active");
  }

  if (triggerPopupButton) {
      triggerPopupButton.addEventListener("click", openPopup);
  }

  if (closePopupButton) {
      closePopupButton.addEventListener("click", closePopup);
  }

  popupOverlay.addEventListener("click", (event) => {
      if (event.target === popupOverlay) {
          closePopup();
      }
  });
});
