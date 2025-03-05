document.addEventListener("DOMContentLoaded", function () {
  
  const validUsername = "topcity";
  const validPassword = "topcity";

 
  const loginContainer = document.getElementById("login-container");
  const loginButton = document.getElementById("login-button");
  const usernameInput = document.getElementById("login-username");
  const passwordInput = document.getElementById("password");
  const errorMessage = document.getElementById("error-message");
  const loader = document.getElementById("loader");
  const logoutButton = document.getElementById("logout-button");
  const mapContainer = document.getElementById("map");
  const loaderr = document.getElementById("loaderr");
  const searchInput = document.getElementById("search-input");
  const searchButton = document.getElementById("search-button");
  const controls = document.getElementById("controls");
  const popupOverlay = document.getElementById("full-screen-popup");
  const popupTitle = document.getElementById("popup-title");
  const popupInfo = document.getElementById("popup-info");
  const closePopup = document.getElementById("close-popup");

  
  if (!loginContainer || !loginButton || !usernameInput || !passwordInput || !errorMessage || !mapContainer || !loader || !logoutButton) {
    console.error("One or more critical DOM elements are missing.");
    return;
  }

  
  loader.style.display = "flex"; 

  function checkLoginStatus() {
    setTimeout(() => {
      loader.style.display = "none"; 

      if (localStorage.getItem("loggedIn") === "true") {
        loginContainer.style.display = "none";
        mapContainer.style.display = "block";
        controls.style.display = "flex";
        logoutButton.style.display = "block";
        initializeMap(); 
      } else {
        loginContainer.style.display = "block";
        mapContainer.style.display = "none";
        controls.style.display = "none";
        logoutButton.style.display = "none";
      }
    }, 2000);
  }

  
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

  
  logoutButton.addEventListener("click", function () {
    localStorage.removeItem("loggedIn");
    checkLoginStatus();
  });

  // Initialize map
  function initializeMap() {
    // Remove existing map instance if it exists
    if (window.mapInstance) {
      window.mapInstance.remove();
    }

    // Initialize Leaflet map
    window.mapInstance = L.map("map", {
      zoomControl: false,
    }).setView([31.4181, 72.9947], 13);

    // Add zoom control
    L.control.zoom({ position: "bottomleft" }).addTo(window.mapInstance);

    
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(window.mapInstance);

    
    setTimeout(() => {
      window.mapInstance.invalidateSize();
    }, 500);

    // Define the UTM Zone 43N (EPSG:32643) projection manually
    proj4.defs("EPSG:32643", "+proj=utm +zone=43 +datum=WGS84 +units=m +no_defs");

    
    const boundaryStyles = {
      district: { color: "red", weight: 3, fillColor: "yellow", fillOpacity: 0.3 },
      city: { color: "blue", weight: 5, fillColor: "transparent", fillOpacity: 0 },
    };

   
    Promise.all([
      fetch("faisalabad-boundary.geojson").then((r) => r.json()).catch(() => null),
      fetch("faisalabad-city-boundary.geojson").then((r) => r.json()).catch(() => null),
    ])
      .then(([districtData, cityData]) => {
        if (districtData) L.geoJSON(districtData, { style: boundaryStyles.district }).addTo(window.mapInstance);
        if (cityData) L.geoJSON(cityData, { style: boundaryStyles.city }).addTo(window.mapInstance);
      })
      .catch((error) => {
        console.error("Error loading boundary data:", error);
      });

    
    function openPopup(title, info) {
      if (!popupTitle || !popupInfo || !popupOverlay) return;
      popupTitle.innerText = title || "No Title";
      popupInfo.innerHTML = info || "No Info";
      popupOverlay.classList.add("active");
      popupOverlay.style.display = "flex";
    }

    
    if (closePopup) {
      closePopup.addEventListener("click", function () {
        if (popupOverlay) {
          popupOverlay.classList.remove("active");
          popupOverlay.style.display = "none";
          if (controls) controls.style.display = "flex";
        }
      });
    }

   
    document.addEventListener("touchstart", function (event) {
      if (popupOverlay && popupOverlay.classList.contains("active") && !popupOverlay.contains(event.target)) {
        popupOverlay.classList.remove("active");
        popupOverlay.style.display = "none";
        if (controls) controls.style.display = "flex";
      }
    });

    
    function handleMarkers(data, searchQuery = "") {
      const markerLayer = L.layerGroup();
      const bounds = [];

      data.features.forEach((feature) => {
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

      markerLayer.addTo(window.mapInstance);

      if (bounds.length > 0) {
        window.mapInstance.fitBounds(bounds);
      } else {
        window.mapInstance.setView([31.4181, 72.9947], 13);
      }
    }

    
    fetch("data.json")
      .then((response) => response.json())
      .then((data) => {
        if (loader) loader.style.display = "none";
        handleMarkers(data);

       
        function performSearch() {
          if (loaderr) {
            loaderr.style.display = "flex";
            loaderr.style.opacity = "1";
          }

          window.mapInstance.eachLayer((layer) => {
            if (layer instanceof L.LayerGroup) window.mapInstance.removeLayer(layer);
          });

          setTimeout(() => {
            handleMarkers(data, searchInput ? searchInput.value.trim() : "");
            if (loaderr) {
              loaderr.style.opacity = "0";
              setTimeout(() => {
                loaderr.style.display = "none";
              }, 300);
            }
          }, 500);
        }

        if (searchButton) searchButton.addEventListener("click", performSearch);
        if (searchInput) {
          searchInput.addEventListener("keypress", (e) => e.key === "Enter" && performSearch());
          searchInput.addEventListener("input", () => {
            if (searchInput.value.trim() === "") performSearch();
          });
        }
      })
      .catch((error) => {
        console.error("Error loading data:", error);
        if (loaderr) loaderr.style.display = "none";
      });
  }

  
  checkLoginStatus();
});