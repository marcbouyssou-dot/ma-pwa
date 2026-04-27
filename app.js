let entries = JSON.parse(localStorage.getItem("entries") || "[]");
let trips = JSON.parse(localStorage.getItem("trips") || "[]");

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
    .map(t => `
      <div>
        <span>${t.name} (${t.km} km)</span>
        <button onclick="addQuickKm(${t.km})">+${t.km}</button>
      </div>
    `)
    .join("");
}

function renderTotal() {
  const total = entries.reduce((sum, e) => sum + e.km, 0);
  monthlyTotal.innerText = total + " km";
}

function renderCalendar() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDay = new Date(year, month + 1, 0);

  let html = "<div style='display:grid;grid-template-columns:repeat(7,1fr);gap:6px;'>";

  for (let i = 1; i <= lastDay.getDate(); i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    const entry = entries.find(e => e.date === dateStr);

    html += `
      <div onclick="selectDate('${dateStr}')"
        style="
          padding:10px;
          text-align:center;
          border-radius:10px;
          background:${entry ? "#22c55e" : "#e5e7eb"};
          color:${entry ? "white" : "black"};
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
  const entry = entries.find(e => e.date === date);
  const value = prompt("Km pour " + date, entry ? entry.km : "");

  if (value === null) return;

  const km = parseFloat(value);
  if (!km) return;

  if (entry) entry.km = km;
  else entries.push({ date, km });

  saveEntries();
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

render();
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}