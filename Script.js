// === MGNREGA Dashboard Script (Simplified + No Past/No Error Msg) ===

// === Initialize Map ===
const map = L.map("map").setView([20.5937, 78.9629], 5);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

// === Detect My District ===
document.getElementById("autoDetectBtn").addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.setView([latitude, longitude], 10);
        L.marker([latitude, longitude])
          .addTo(map)
          .bindPopup("You are here!")
          .openPopup();
      },
      () => alert("Location access denied.")
    );
  } else alert("Geolocation not supported.");
});

// === API URL ===
const API_URL =
  "https://api.data.gov.in/resource/ee03643a-ee4c-48c2-ac30-9f2ff26ab722?api-key=579b464db66ec23bdd0000017a275b23a50e49087e7429d93fb3c3cf&format=json&filters[state_name]=KARNATAKA";

// === Elements ===
const districtSelect = document.getElementById("districtSelect");
const compareSelect1 = document.getElementById("compareSelect1");
const compareSelect2 = document.getElementById("compareSelect2");
const dataDisplay = document.getElementById("dataDisplay");
const compareDisplay = document.getElementById("compareDisplay");
const loadingSpinner = document.getElementById("loadingSpinner");
const metricsList = document.getElementById("metricsList");
const metricsChart = document.getElementById("metricsChart");
const compareChart = document.getElementById("compareChart");

// === Fetch District Data ===
async function fetchDistrictData() {
  loadingSpinner.classList.remove("hidden");

  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    const districts = data.records || [];

    populateDistricts(districts);
    populateCompareDropdowns(districts);
  } catch (err) {
    console.error("Data fetch failed:", err);
  } finally {
    loadingSpinner.classList.add("hidden");
  }
}

// === Populate Dropdowns ===
function populateDistricts(districts) {
  districtSelect.innerHTML = `<option value="">Select District</option>`;
  districts.forEach((d) => {
    const name = d.district_name || d.district || "Unknown";
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    districtSelect.appendChild(opt);
  });
}

function populateCompareDropdowns(districts) {
  [compareSelect1, compareSelect2].forEach((select) => {
    select.innerHTML = `<option value="">Select District</option>`;
    districts.forEach((d) => {
      const name = d.district_name || d.district || "Unknown";
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      select.appendChild(opt);
    });
  });
}

// === On District Change ===
districtSelect.addEventListener("change", async () => {
  const selected = districtSelect.value;
  if (!selected) return;

  loadingSpinner.classList.remove("hidden");
  dataDisplay.classList.add("hidden");

  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    const districtData = data.records.find(
      (d) => d.district_name === selected || d.district === selected
    );

    if (districtData) displayDistrictData(districtData);
  } catch (err) {
    console.error(err);
  } finally {
    loadingSpinner.classList.add("hidden");
  }
});

// === Display District Data ===
function displayDistrictData(data) {
  const name = data.district_name || data.district || "Unknown";
  document.getElementById("districtTitle").textContent = name;
  metricsList.innerHTML = "";

  // Dynamically list all fields
  for (let [key, val] of Object.entries(data)) {
    const li = document.createElement("li");
    li.textContent = `${key.replace(/_/g, " ")}: ${val}`;
    metricsList.appendChild(li);
  }

  // Simple numeric chart
  const numericEntries = Object.entries(data)
    .filter(([_, v]) => !isNaN(parseFloat(v)))
    .slice(0, 5);

  if (numericEntries.length) {
    const labels = numericEntries.map(([k]) => k.replace(/_/g, " "));
    const values = numericEntries.map(([_, v]) => parseFloat(v));

    new Chart(metricsChart, {
      type: "bar",
      data: {
        labels,
        datasets: [{ label: "Metrics", data: values }],
      },
      options: { responsive: true, plugins: { legend: { display: false } } },
    });
  }

  dataDisplay.classList.remove("hidden");
}
const pastTabButton = document.querySelector('[data-tab="past"]');
if (pastTabButton) {
  pastTabButton.addEventListener("click", () => {
    const pastTab = document.getElementById("pastTab");
    pastTab.classList.remove("hidden");
    pastTab.innerHTML = `<p style="text-align:center;color:gray;">No past data available for this district.</p>`;
  });
}
// === Compare Districts ===
document.getElementById("compareForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const d1 = compareSelect1.value;
  const d2 = compareSelect2.value;
  if (!d1 || !d2) return alert("Select two districts!");

  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    const dist1 = data.records.find(
      (r) => r.district_name === d1 || r.district === d1
    );
    const dist2 = data.records.find(
      (r) => r.district_name === d2 || r.district === d2
    );
    if (dist1 && dist2) showComparison(dist1, dist2);
  } catch (err) {
    console.error(err);
  }
});

function showComparison(d1, d2) {
  const keys = Object.keys(d1).slice(0, 5);
  const vals1 = keys.map((k) => parseFloat(d1[k]) || 0);
  const vals2 = keys.map((k) => parseFloat(d2[k]) || 0);

  new Chart(compareChart, {
    type: "bar",
    data: {
      labels: keys,
      datasets: [
        { label: d1.district_name, data: vals1 },
        { label: d2.district_name, data: vals2 },
      ],
    },
  });

  compareDisplay.classList.remove("hidden");
}

// === Init ===
document.addEventListener("DOMContentLoaded", fetchDistrictData);
