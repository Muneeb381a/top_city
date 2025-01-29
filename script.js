// Define the UTM Zone 43N (EPSG:32643) projection manually
proj4.defs(
  "EPSG:32643",
  "+proj=utm +zone=43 +datum=WGS84 +units=m +no_defs"
);


const loader = document.getElementById("loader");
loader.style.display = "flex"; 


const map = L.map("map").setView([31.4181, 72.9947], 13); // Faisalabad coordinates


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


fetch("faisalabad-boundary.geojson")
  .then((response) => response.json())
  .then((geojson) => {
    
    L.geoJSON(geojson, { style: faisalabadBoundaryStyle }).addTo(map);
  })
  .catch((error) => {
    console.error("Error loading Faisalabad boundary GeoJSON:", error);
  });


fetch("faisalabad-city-boundary.geojson")
  .then((response) => response.json())
  .then((geojson) => {
    
    L.geoJSON(geojson, { style: faisalabadCityStyle }).addTo(map);
  })
  .catch((error) => {
    console.error("Error loading Faisalabad city boundary GeoJSON:", error);
  });


function addMarkers(data, searchQuery = "") {
  const bounds = []; 
  
  map.eachLayer(function(layer) {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });

  data.features.forEach((feature) => {
    let { coordinates } = feature.geometry;

    
    if (coordinates.length === 2 && Math.abs(coordinates[0]) > 100) {
      coordinates = proj4("EPSG:32643", "EPSG:4326", coordinates);
    }

    if (coordinates && coordinates.length === 2) {
      const [lon, lat] = coordinates; 

      const { Buyer_Name, CNIC, Address, Plot_Size, Block, TYPE } = feature.properties;

      
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

      bounds.push([lat, lon]); 
    }
  });

  
  if (bounds.length > 0) {
    map.fitBounds(bounds); 
  } else {
    
    map.setView([31.4181, 72.9947], 13); 
  }
}

fetch("data.json")
  .then((response) => response.json())
  .then((data) => {
    
    setTimeout(() => {
      addMarkers(data);
      loader.style.display = "none"; 
    }, 3000); 

    const searchInput = document.getElementById("search-input");
    let searchTimeout;

    searchInput.addEventListener("input", () => {
      
      clearTimeout(searchTimeout);

      
      loader.style.display = "flex";

      
      searchTimeout = setTimeout(() => {
        const query = searchInput.value.trim();
        addMarkers(data, query);
        loader.style.display = "none"; 
      }, 1000); 
    });
  })
  .catch((error) => {
    console.error("Error loading marker data:", error);
    loader.style.display = "none"; 
  });