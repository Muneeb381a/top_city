// Define the UTM Zone 43N (EPSG:32643) projection manually
proj4.defs(
  "EPSG:32643",
  "+proj=utm +zone=43 +datum=WGS84 +units=m +no_defs"
);

// Show the loader initially
const loader = document.getElementById("loader");
loader.style.display = "flex"; // Show loader when the page loads

// Initialize the map centered on Faisalabad
const map = L.map("map").setView([31.4181, 72.9947], 13); // Faisalabad coordinates

// Add tile layer
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// Style for Faisalabad boundary
const faisalabadBoundaryStyle = {
  color: "red", // Boundary color
  weight: 3, // Boundary thickness
  fillColor: "yellow", // Fill color
  fillOpacity: 0.3, // Transparency of the fill
};

// Style for Faisalabad city boundary (highlight)
const faisalabadCityStyle = {
  color: "blue", // Boundary color
  weight: 5, // Boundary thickness
  fillColor: "transparent", // No fill
  fillOpacity: 0, // No fill
};

// Load Faisalabad boundary GeoJSON
fetch("faisalabad-boundary.geojson")
  .then((response) => response.json())
  .then((geojson) => {
    // Add GeoJSON layer to map
    L.geoJSON(geojson, { style: faisalabadBoundaryStyle }).addTo(map);
  })
  .catch((error) => {
    console.error("Error loading Faisalabad boundary GeoJSON:", error);
  });

// Load Faisalabad city boundary GeoJSON (if available)
fetch("faisalabad-city-boundary.geojson")
  .then((response) => response.json())
  .then((geojson) => {
    // Add GeoJSON layer to map with highlight style
    L.geoJSON(geojson, { style: faisalabadCityStyle }).addTo(map);
  })
  .catch((error) => {
    console.error("Error loading Faisalabad city boundary GeoJSON:", error);
  });

// Function to add markers to the map
function addMarkers(data, searchQuery = "") {
  const bounds = []; // Store bounds for the markers
  // Clear any existing markers before adding new ones
  map.eachLayer(function(layer) {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });

  data.features.forEach((feature) => {
    let { coordinates } = feature.geometry;

    // Check if coordinates are UTM (EPSG:32643) and convert them to WGS84 (lat/lon)
    if (coordinates.length === 2 && Math.abs(coordinates[0]) > 100) {
      coordinates = proj4("EPSG:32643", "EPSG:4326", coordinates);
    }

    if (coordinates && coordinates.length === 2) {
      const [lon, lat] = coordinates; // Destructure coordinates into lon, lat

      const { Buyer_Name, CNIC, Address, Plot_Size, Block, TYPE } = feature.properties;

      // Ensure Buyer_Name and CNIC are not null or undefined before using .includes()
      if (
        searchQuery &&
        !(
          (Buyer_Name && Buyer_Name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (CNIC && CNIC.includes(searchQuery))
        )
      ) {
        return;
      }

      const marker = L.marker([lat, lon]).addTo(map);
      marker.bindPopup(`
        <strong>Buyer Name:</strong> ${Buyer_Name} <br />
        <strong>CNIC:</strong> ${CNIC} <br />
        <strong>Address:</strong> ${Address} <br />
        <strong>Plot Size:</strong> ${Plot_Size} <br />
        <strong>Block:</strong> ${Block} <br />
        <strong>Type:</strong> ${TYPE}
      `);

      bounds.push([lat, lon]); // Add the marker's location to bounds
    }
  });

  // Only zoom to bounds if markers exist
  if (bounds.length > 0) {
    map.fitBounds(bounds); // Adjust the map to fit the bounds of the markers
  } else {
    // Optional: Set the view to a default position if no results are found
    map.setView([31.4181, 72.9947], 13); // Faisalabad coordinates
  }

  // Hide loader once everything is loaded
  loader.style.display = "none"; // Hide the loader
}

// Fetch the data from the JSON file
fetch("data.json")
  .then((response) => response.json())
  .then((data) => {
    addMarkers(data);

    const searchInput = document.getElementById("search-input");
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.trim();
      addMarkers(data, query);
    });
  })
  .catch((error) => {
    console.error("Error loading marker data:", error);
  });
