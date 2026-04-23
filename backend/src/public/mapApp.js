// mapApp.js
import axiosClient from "./axiosClient.js";

const api = axiosClient;

let map;
let marker;
let routeLayer;

function showMarker(lat, lon, label) {
  console.log("showMarker called with:", lat, lon, label);
  if (!map) {
    console.error("Map chưa khởi tạo!");
    return;
  }
  if (marker) {
    console.log("Xóa marker cũ");
    map.removeLayer(marker);
  }
  marker = L.marker([parseFloat(lat), parseFloat(lon)])
    .addTo(map)
    .bindPopup(label)
    .openPopup();
  map.setView([parseFloat(lat), parseFloat(lon)], 15);
}

export function initMap() {
  map = L.map("map").setView([16.0678, 108.2208], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  // Forward
  document.getElementById("forwardBtn").onclick = async () => {
    const address = document.getElementById("forwardInput").value;
    const data = await api.get(`map/forwardGeocode?address=${encodeURIComponent(address)}`);
    console.log("Data:", data);
    if (data?.[0]) {
      const loc = data[0];
      showMarker(parseFloat(loc.lat), parseFloat(loc.lon), loc.display_name);
    }
  };

  // Reverse
  document.getElementById("reverseBtn").onclick = async () => {
    const lat = document.getElementById("latInput").value;
    const lon = document.getElementById("lonInput").value;
    const data = await api.get(`map/reverseGeocode?lat=${lat}&lon=${lon}`);
    if (data) {
      console.log("Data:", data);
      const loc = data;
      console.log("Location:", loc);
      showMarker(parseFloat(loc.lat), parseFloat(loc.lon), loc.display_name);
    }
  };

  // Autocomplete
  document.getElementById("autocompleteInput").oninput = async (e) => {
    const input = e.target.value;
    const list = document.getElementById("autocompleteResults");
    list.innerHTML = "";
    if (!input) return;

    const data = await api.get(`map/placeAutocomplete?input=${encodeURIComponent(input)}`);
    if (data) {
      data.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item.display_name;
        li.onclick = () => {
          document.getElementById("forwardInput").value = item.display_name;
          showMarker(parseFloat(item.lat), parseFloat(item.lon), item.display_name);
        };
        list.appendChild(li);
      });
    }
  };

  // Directions
  document.getElementById("directionsBtn").onclick = async () => {
    // // Lấy nhiều điểm từ input (ví dụ 3 điểm)
    // const coords = [
    //   [document.getElementById("lon1").value, document.getElementById("lat1").value],
    //   [document.getElementById("lon2").value, document.getElementById("lat2").value],
    //   [document.getElementById("lon3").value, document.getElementById("lat3").value],
    // ];

    
    // Giả sử bạn đã có mảng users từ DB
    // const users = [
    //   { id: 1, name: "Showroom A", role: "showroom", lat: 16.0723604, lon: 108.2284106 },
    //   { id: 2, name: "Showroom B", role: "showroom", lat: 16.029718, lon: 108.208352 },
    //   { id: 3, name: "Tuấn", role: "user", lat: 16.0700, lon: 108.2300 }
    // ];

    const user = JSON.parse(localStorage.getItem("user"));
    const userLocationData = await api.get(`user_location/getMyLocation`);
    console.log("userLocationData:", userLocationData);
    //khoi tao lat/lon cho user
      user.latitude = userLocationData.latitude;  
      user.longitude = userLocationData.longitude;
        console.log("user lat:", user.lat);

    const showrooms = await api.get(`user_location/getShowroomsLocation`);

    // Ghép thành chuỗi lon,lat;lon,lat;...
    // Ghép chuỗi tọa độ: user + showroom
    // Đầu tiên là vị trí user, sau đó là các showroom
    const coords = [
      [user.longitude, user.latitude],
      ...showrooms.map(sr => [sr.longitude, sr.latitude])
    ];
    // Ghép thành chuỗi lon,lat;lon,lat;...
    const coordinates = coords.map(c => `${c[0]},${c[1]}`).join(";");
    // Gọi API backend
    const data = await api.get(
      `map/directions?profile=driving&coordinates=${coordinates}`
    );

    if (data && data.routes && data.routes.length > 0) {
      console.log("Directions Data:", data);

      const encoded = data.routes[0].geometry; // chuỗi polyline
      console.log("Encoded:", encoded);
      const routeCoords = polyline.decode(encoded);
      // Xóa tuyến cũ nếu có
      if (routeLayer) {
        map.removeLayer(routeLayer);
      }

      // Vẽ polyline lên bản đồ
      routeLayer = L.polyline(routeCoords, { color: "blue" }).addTo(map);

      // Zoom vừa khít tuyến đường
      map.fitBounds(routeLayer.getBounds());

      // Vẽ showroom lên bản đồ
      showrooms.forEach(sr => {
        L.marker([sr.latitude, sr.longitude])
          .addTo(map)
          .bindPopup(`<b>${sr.name}</b><br/>Showroom`);
      });

      var greenIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
      L.marker([user.latitude, user.longitude], {
        icon: greenIcon
      })
        .addTo(map)
        .bindPopup(`<b>${user.name}</b><br/>Bạn đang ở đây`)
        .openPopup(); // mở popup ngay

    } else {
      console.error("Không tìm thấy tuyến đường!");
    }
  };
}
