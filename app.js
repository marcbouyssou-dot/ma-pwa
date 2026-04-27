let user = JSON.parse(localStorage.getItem("user") || "{}");
let entries = JSON.parse(localStorage.getItem("entries") || "[]");
let trips = JSON.parse(localStorage.getItem("trips") || "[]");
let currentDate = new Date();
let selectedDate = today();
const kmInput = document.getElementById("kmInput");
const saveKmBtn = document.getElementById("saveKmBtn");
const historyList = document.getElementById("historyList");
const monthlyTotal = document.getElementById("monthlyTotal");

const tripNameInput = document.getElementById("tripNameInput");
const tripKmInput = document.getElementById("tripKmInput");
const addTripBtn = document.getElementById("addTripBtn");
const tripsList = document.getElementById("tripsList");
const calendarDiv = document.getElementById("calendar");

function today() {
  return new Date().toISOString().split("T")[0];
}

saveKmBtn.onclick = () => {
  const km = parseFloat(kmInput.value);
  if (!km) return;

  const date = today();
  const existing = entries.find(e => e.date === date);

  if (existing) existing.km = km;
  else entries.push({ date, km });

  saveEntries();
  kmInput.value = "";
  render();
};

addTripBtn.onclick = () => {
  const name = tripNameInput.value;
  const km = parseFloat(tripKmInput.value);

  if (!name || !km) return;

  trips.push({ name, km });
  localStorage.setItem("trips", JSON.stringify(trips));

  tripNameInput.value = "";
  tripKmInput.value = "";

  render();
};

function addQuickKm(value) {
  const date = today();
  const existing = entries.find(e => e.date === date);

  if (existing) existing.km += value;
  else entries.push({ date, km: value });

  saveEntries();
  render();
}

function saveEntries() {
  localStorage.setItem("entries", JSON.stringify(entries));
}

function render() {
  renderHistory();
  renderTrips();
  renderTotal();
  renderCalendar();
  document.getElementById("yearTotal").innerText =
  Math.round(yearlyTotal()) + " km";

document.getElementById("avgKm").innerText =
  Math.round(averageKm()) + " km";

document.getElementById("indemnites").innerText =
  Math.round(indemnitesKm()) + " €";
}

function renderHistory() {
  if (entries.length === 0) {
    historyList.innerHTML = "Aucune saisie pour le moment.";
    return;
  }

  historyList.innerHTML = entries
    .map(e => `<div>${e.date} : ${e.km} km</div>`)
    .join("");
}

function renderTrips() {
  tripsList.innerHTML = trips
    .map((t, index) => `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
        
        <div>
          <strong>${t.name}</strong><br>
          <small>${t.km} km</small>
        </div>

        <div style="display:flex;gap:5px;">
          <button onclick="addQuickKm(${t.km})">+${t.km}</button>
          <button onclick="addQuickKm(${t.km * 2})">+${t.km * 2}</button>
          <button onclick="deleteTrip(${index})">🗑</button>
        </div>

      </div>
    `)
    .join("");
}
function deleteTrip(index) {
  trips.splice(index, 1);
  localStorage.setItem("trips", JSON.stringify(trips));
  render();
}
function renderTotal() {
  const total = entries.reduce((sum, e) => sum + e.km, 0);
  monthlyTotal.innerText = total + " km";
}

function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  document.getElementById("monthLabel").innerText =
    firstDay.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric"
    });

  let html = "<div style='display:grid;grid-template-columns:repeat(7,1fr);gap:6px;'>";

  for (let i = 1; i <= lastDay.getDate(); i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2,"0")}-${String(i).padStart(2,"0")}`;

    const entry = entries.find(e => e.date === dateStr);
    const isSelected = dateStr === selectedDate;

    html += `
      <div onclick="selectDate('${dateStr}')"
        style="
          padding:10px;
          text-align:center;
          border-radius:10px;
          background:${
            isSelected ? '#3b82f6' :
            entry ? '#22c55e' :
            '#e5e7eb'
          };
          color:${isSelected || entry ? 'white' : 'black'};
          cursor:pointer;
        ">
        ${i}
      </div>
    `;
  }

  html += "</div>";
  calendarDiv.innerHTML = html;
}

function selectDate(date) {
  selectedDate = date;

  const entry = entries.find(e => e.date === date);
  const value = prompt("Km pour " + date, entry ? entry.km : "");

  if (value !== null) {
    const km = parseFloat(value);
    if (km) {
      if (entry) entry.km = km;
      else entries.push({ date, km });

      saveEntries();
    }
  }

  render();
}

document.getElementById("exportCsvBtn").onclick = () => {
  let csv = "Date,Km\n";

  entries.forEach(e => {
    csv += `${e.date},${e.km}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "kilometres.csv";
  a.click();
};

document.getElementById("prevMonth").onclick = () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  render();
};

document.getElementById("nextMonth").onclick = () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  render();
};
function yearlyTotal() {
  const year = new Date().getFullYear();

  return entries
    .filter(e => e.date.startsWith(year))
    .reduce((sum, e) => sum + e.km, 0);
}

function averageKm() {
  if (entries.length === 0) return 0;

  return yearlyTotal() / entries.length;
}

function indemnitesKm() {
  const total = yearlyTotal();

  if (user.useCustom && user.customRate) {
    return total * parseFloat(user.customRate);
  }

  const cv = parseInt(user.power || 5);

  if (cv <= 3) return total * 0.53;
  if (cv === 4) return total * 0.60;
  if (cv === 5) return total * 0.63;
  if (cv === 6) return total * 0.66;

  return total * 0.70;
}
function saveUser() {
  user.name = document.getElementById("userName").value;
  user.vehicle = document.getElementById("vehicle").value;
  user.power = document.getElementById("vehiclePower").value;
  user.customRate = document.getElementById("customRate").value;
  user.useCustom = document.getElementById("customRateToggle").checked;

  localStorage.setItem("user", JSON.stringify(user));
}

function loadUser() {
  document.getElementById("userName").value = user.name || "";
  document.getElementById("vehicle").value = user.vehicle || "";
  document.getElementById("vehiclePower").value = user.power || "";
  document.getElementById("customRate").value = user.customRate || "";
  document.getElementById("customRateToggle").checked = user.useCustom || false;
}
document.querySelectorAll("#userName, #vehicle, #vehiclePower, #customRate, #customRateToggle")
  .forEach(el => el.onchange = saveUser);
  loadUser();
render();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
document.getElementById("exportPdfBtn").onclick = () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 20;

  doc.setFontSize(16);
  doc.text("Carnet de route", 20, y);

  y += 10;

  doc.setFontSize(12);
  doc.text(`Nom: ${user.name || ""}`, 20, y);
  y += 8;
  doc.text(`Véhicule: ${user.vehicle || ""}`, 20, y);
  y += 8;
  doc.text(`CV: ${user.power || ""}`, 20, y);

  y += 15;

  doc.text(`Total annuel: ${Math.round(yearlyTotal())} km`, 20, y);
  y += 8;
  doc.text(`Indemnités: ${Math.round(indemnitesKm())} €`, 20, y);

  y += 15;

  doc.text("Historique :", 20, y);
  y += 10;

  entries.forEach(e => {
    doc.text(`${e.date} - ${e.km} km`, 20, y);
    y += 7;
  });

  doc.save("carnet-route.pdf");
};