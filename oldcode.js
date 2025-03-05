// Sample user credentials (for demo purposes)
const validUsername = "admin";
const validPassword = "12345";

// Get login elements
const loginContainer = document.getElementById("login-container");
const loginButton = document.getElementById("login-button");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const errorMessage = document.getElementById("error-message");

const mapContainer = document.getElementById("map");


function checkLoginStatus() {
  if (localStorage.getItem("loggedIn") === "true") {
    loginContainer.style.display = "none"; 
    mapContainer.style.display = "block"; 
  } else {
    loginContainer.style.display = "block"; // Show login
    mapContainer.style.display = "none"; // Hide map
  }
}

// Login functionality
loginButton.addEventListener("click", function () {
  const enteredUsername = usernameInput.value.trim();
  const enteredPassword = passwordInput.value.trim();

  if (enteredUsername === validUsername && enteredPassword === validPassword) {
    localStorage.setItem("loggedIn", "true"); 
    checkLoginStatus();
  } else {
    errorMessage.style.display = "block";
  }
});


function logout() {
  localStorage.removeItem("loggedIn");
  checkLoginStatus();
}


checkLoginStatus();



// Define the UTM Zone 43N (EPSG:32643) projection manually
proj4.defs("EPSG:32643", "+proj=utm +zone=43 +datum=WGS84 +units=m +no_defs");

const loader = document.getElementById("loader");
const loaderr = document.getElementById("loaderr");
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const controls = document.getElementById("controls");

// Map Initialization
const map = L.map("map", {
  zoomControl: false,
}).setView([31.4181, 72.9947], 13);

L.control
  .zoom({
    position: "bottomleft",
  })
  .addTo(map);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// Boundary styles
const boundaryStyles = {
  district: {
    color: "red",
    weight: 3,
    fillColor: "yellow",
    fillOpacity: 0.3,
  },
  city: {
    color: "blue",
    weight: 5,
    fillColor: "transparent",
    fillOpacity: 0,
  },
};

// Load Boundaries
Promise.all([
  fetch("faisalabad-boundary.geojson").then((r) => r.json()),
  fetch("faisalabad-city-boundary.geojson").then((r) => r.json()),
])
  .then(([districtData, cityData]) => {
    L.geoJSON(districtData, { style: boundaryStyles.district }).addTo(map);
    L.geoJSON(cityData, { style: boundaryStyles.city }).addTo(map);
  })
  .catch((error) => {
    console.error("Error loading boundary data:", error);
  });

// Popup Elements
const popupOverlay = document.getElementById("full-screen-popup");
const popupTitle = document.getElementById("popup-title");
const popupInfo = document.getElementById("popup-info");
const closePopup = document.getElementById("close-popup");

// Function to Open Popup (Used for Both Desktop & Mobile)
function openPopup(title, info) {
  popupTitle.innerText = title;
  popupInfo.innerHTML = info;
  popupOverlay.classList.add("active");
  popupOverlay.style.display = "flex"; // Ensure the popup is visible
}

// Close Popup Function
closePopup.addEventListener("click", function () {
  popupOverlay.classList.remove("active");
  popupOverlay.style.display = "none"; // Ensure it's hidden

  // Show search bar again after closing popup
  controls.style.display = "block";
});

// Ensure Popup Works on Mobile
document.addEventListener("touchstart", function (event) {
  if (
    popupOverlay.classList.contains("active") &&
    !popupOverlay.contains(event.target)
  ) {
    popupOverlay.classList.remove("active");
    popupOverlay.style.display = "none";
  }
});

// Close Popup Event
closePopup.addEventListener("click", function () {
  popupOverlay.classList.remove("active");

  // Show search bar again after closing popup
  controls.style.display = "block";
});

// Function to Handle Markers and Show Table in Popup
function handleMarkers(data, searchQuery = "") {
  const markerLayer = L.layerGroup();
  const bounds = [];

  data.features.forEach((feature) => {
    let [lon, lat] = feature.geometry.coordinates;
    if (Math.abs(lon) > 100) {
      [lon, lat] = proj4("EPSG:32643", "EPSG:4326", [lon, lat]);
    }

    const {
      Buyer_Name,
      CNIC,
      CONTACT,
      Address,
      Status,
      Plot_Size,
      Block,
      TYPE,
      COM_STATUS,
      COLONY,
    } = feature.properties;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !Buyer_Name?.toLowerCase().includes(query) &&
        !CNIC?.includes(searchQuery)
      )
        return;
    }

    const marker = L.marker([lat, lon]);

    // Create Table for Popup
    const tableHTML = `
      <div class="table-wrapper">
  <table border="1">
    <tr><th>CNIC</th><td>${CNIC || "N/A"}</td></tr>
    <tr><th>CONTACT</th><td>${CONTACT || "N/A"}</td></tr>
    <tr><th>Address</th><td>${Address || "N/A"}</td></tr>
    <tr><th>Status</th><td>${Status || "N/A"}</td></tr>
    <tr><th>Plot Size</th><td>${Plot_Size || "N/A"}</td></tr>
    <tr><th>Block</th><td>${Block || "N/A"}</td></tr>
    <tr><th>Type</th><td>${TYPE || "N/A"}</td></tr>
    <tr><th>COM_STATUS</th><td>${COM_STATUS || "N/A"}</td></tr>
    <tr><th>COLONY</th><td>${COLONY || "N/A"}</td></tr>
  </table>
</div>

    `;

    marker.on("click", function () {
      openPopup(Buyer_Name || "No Name", tableHTML);
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

// Load Data and Add Markers
fetch("data.json")
  .then((response) => response.json())
  .then((data) => {
    setTimeout(() => {
      handleMarkers(data);
      loader.style.display = "none";
    }, 3000);

    function performSearch() {
      loaderr.style.display = "flex";
      loaderr.style.opacity = "1";

      map.eachLayer((layer) => {
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
    searchInput.addEventListener(
      "keypress",
      (e) => e.key === "Enter" && performSearch()
    );

    searchInput.addEventListener("input", () => {
      if (searchInput.value.trim() === "") {
        performSearch();
      }
    });
  })
  .catch((error) => {
    console.error("Error loading data:", error);
    loaderr.style.display = "none";
  });
