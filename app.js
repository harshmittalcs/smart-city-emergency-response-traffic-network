const state = {
  isBackendConnected: false,
  signal: { state: "RED", isEmergency: false },
  queue: [],
  vehicles: [],
  intersections: [],
  roads: [],
  history: [],
  activeDispatches: [],
  selectedDestinationId: null,
  activePathHighlight: null, 
  animatingVehicle: null, 

  activeTab: "tab-dispatch",
  networkSelectedSource: null,
  networkSelectedDest: null,
  draggedNodeId: null,
  isDragging: false,
  dragMoved: false,
  dragStartX: 0,
  dragStartY: 0
};

const canvas = document.getElementById("cityCanvas");
const ctx = canvas.getContext("2d");
let canvasWidth = 750;
let canvasHeight = 480;
let nodePositions = {}; 
let hoveredNodeId = null;

const backendPill = document.getElementById("backendPill");
const statusDot = document.getElementById("statusDot");
const backendStatus = document.getElementById("backendStatus");
const liveClock = document.getElementById("liveClock");
const loadSampleBtn = document.getElementById("loadSampleBtn");
const openDsaGuideBtn = document.getElementById("openDsaGuideBtn");
const dsaGuideModal = document.getElementById("dsaGuideModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const mapModeBadge = document.getElementById("mapModeBadge");
const overlayText = document.getElementById("overlayText");

const kpiSignalValue = document.getElementById("kpiSignalValue");
const kpiSignalBadge = document.getElementById("kpiSignalBadge");
const kpiQueueCount = document.getElementById("kpiQueueCount");
const kpiFleetCount = document.getElementById("kpiFleetCount");
const kpiIntersectionsCount = document.getElementById("kpiIntersectionsCount");
const kpiDispatchesCount = document.getElementById("kpiDispatchesCount");

const lightRed = document.getElementById("lightRed");
const lightYellow = document.getElementById("lightYellow");
const lightGreen = document.getElementById("lightGreen");
const lightStateText = document.getElementById("lightStateText");
const lightStateSub = document.getElementById("lightStateSub");
const givePriorityBtn = document.getElementById("givePriorityBtn");
const resetSignalBtn = document.getElementById("resetSignalBtn");
const dequeueBtn = document.getElementById("dequeueBtn");
const queueTrack = document.getElementById("queueTrack");

const dispatchForm = document.getElementById("dispatchForm");
const emergencyTypeSelect = document.getElementById("emergencyTypeSelect");
const dispatchDestSelect = document.getElementById("dispatchDestSelect");
const dispatchResultBox = document.getElementById("dispatchResultBox");
const resultDistance = document.getElementById("resultDistance");
const resultVehicle = document.getElementById("resultVehicle");
const resultEmergencyType = document.getElementById("resultEmergencyType");
const resultSource = document.getElementById("resultSource");
const resultDest = document.getElementById("resultDest");
const resultPathFlow = document.getElementById("resultPathFlow");
const btnSimulateRoute = document.getElementById("btnSimulateRoute");

const addVehicleForm = document.getElementById("addVehicleForm");
const vehicleNumInput = document.getElementById("vehicleNumInput");
const vehicleTypeInput = document.getElementById("vehicleTypeInput");
const setLocationForm = document.getElementById("setLocationForm");
const assignVehicleSelect = document.getElementById("assignVehicleSelect");
const assignLocationSelect = document.getElementById("assignLocationSelect");
const enqueueForm = document.getElementById("enqueueForm");
const queueVehicleSelect = document.getElementById("queueVehicleSelect");
const fleetTableBody = document.getElementById("fleetTableBody");

const addIntersectionForm = document.getElementById("addIntersectionForm");
const intersectionNameInput = document.getElementById("intersectionNameInput");
const addRoadForm = document.getElementById("addRoadForm");
const roadSourceSelect = document.getElementById("roadSourceSelect");
const roadDestSelect = document.getElementById("roadDestSelect");
const roadDistInput = document.getElementById("roadDistInput");
const btnConnectRoad = document.getElementById("btnConnectRoad");
const connectSelectionPill = document.getElementById("connectSelectionPill");
const connectSelectionText = document.getElementById("connectSelectionText");
const btnClearMapSelection = document.getElementById("btnClearMapSelection");
const intersectionsTableBody = document.getElementById("intersectionsTableBody");
const roadsTableBody = document.getElementById("roadsTableBody");

const historyList = document.getElementById("historyList");
const simBanner = document.getElementById("simBanner");
const simVehicleTitle = document.getElementById("simVehicleTitle");
const simStatusSub = document.getElementById("simStatusSub");
const simProgressFill = document.getElementById("simProgressFill");
const resetMapZoomBtn = document.getElementById("resetMapZoomBtn");


function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  const icon = type === "success" ? "✅" : type === "danger" ? "⚠️" : "ℹ️";
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}


setInterval(() => {
  const now = new Date();
  if (liveClock) liveClock.textContent = now.toTimeString().split(" ")[0];
}, 1000);


function switchTab(tabId) {
  state.activeTab = tabId;

  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });

  document.querySelectorAll(".tab-content").forEach(c => {
    c.classList.toggle("active", c.id === tabId);
  });

  document.querySelectorAll(".pipeline-step").forEach(step => {
    step.classList.toggle("active", step.dataset.step === tabId);
  });

  if (tabId !== "tab-network") {
    clearMapRoadSelection();
  }

  updateMapModeUI();
}

function updateMapModeUI() {
  if (!mapModeBadge || !overlayText) return;

  switch (state.activeTab) {
    case "tab-network":
      mapModeBadge.textContent = "Mode: Graph Builder (Connect Roads)";
      mapModeBadge.className = "chip chip-graph";
      if (state.networkSelectedSource !== null) {
        const srcName = state.intersections.find(i => i.id === state.networkSelectedSource)?.name || `#${state.networkSelectedSource}`;
        overlayText.textContent = `Source #${state.networkSelectedSource} (${srcName}) chosen! Click destination node on map.`;
      } else {
        overlayText.textContent = "Click two nodes on the map to connect a road (or drag nodes to rearrange)";
      }
      break;

    case "tab-vehicles":
      mapModeBadge.textContent = "Mode: Station Fleet";
      mapModeBadge.className = "chip chip-success";
      overlayText.textContent = "Click any intersection node to select where to station a vehicle";
      break;

    case "tab-history":
      mapModeBadge.textContent = "Mode: System Topology";
      mapModeBadge.className = "chip chip-info";
      overlayText.textContent = "Interactive overview of city intersections and road network";
      break;

    case "tab-dispatch":
    default:
      mapModeBadge.textContent = "Mode: Emergency Destination";
      mapModeBadge.className = "chip chip-warning";
      overlayText.textContent = "Click any intersection node to set it as Emergency Incident Destination";
      break;
  }
}

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});

document.querySelectorAll(".pipeline-step").forEach(step => {
  step.addEventListener("click", () => switchTab(step.dataset.step));
});

if (openDsaGuideBtn && dsaGuideModal) {
  openDsaGuideBtn.addEventListener("click", () => {
    dsaGuideModal.classList.remove("hidden");
  });
}

if (closeModalBtn && dsaGuideModal) {
  closeModalBtn.addEventListener("click", () => {
    dsaGuideModal.classList.add("hidden");
  });
}

if (dsaGuideModal) {
  dsaGuideModal.addEventListener("click", (e) => {
    if (e.target === dsaGuideModal) {
      dsaGuideModal.classList.add("hidden");
    }
  });
}

function clearMapRoadSelection() {
  state.networkSelectedSource = null;
  state.networkSelectedDest = null;
  if (connectSelectionPill) {
    connectSelectionPill.classList.remove("active");
  }
  if (connectSelectionText) {
    connectSelectionText.textContent = "Click a node on the map to select Road Source, or use dropdowns below.";
  }
  if (btnClearMapSelection) {
    btnClearMapSelection.classList.add("hidden");
  }
  updateMapModeUI();
}

if (btnClearMapSelection) {
  btnClearMapSelection.addEventListener("click", (e) => {
    e.stopPropagation();
    clearMapRoadSelection();
    showToast("Road selection cleared", "info");
  });
}


async function apiCall(endpoint, method = "GET", data = null) {
  try {
    const options = {
      method,
      headers: { "Content-Type": "application/json" }
    };
    if (data && method !== "GET") {
      options.body = JSON.stringify(data);
    }
    const response = await fetch(endpoint, options);
    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || `HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    throw err;
  }
}

async function syncSystemState() {
  try {
    const data = await apiCall("/api/status");
    // Update state from backend
    state.isBackendConnected = true;
    state.signal = data.signal || { state: "RED", isEmergency: false };
    state.queue = data.queue || [];
    state.vehicles = data.vehicles || [];
    state.intersections = data.intersections || [];
    state.roads = data.roads || [];
    state.history = data.history || [];
    state.activeDispatches = data.activeDispatches || [];

    updateConnectionStatus(true);
    renderUI();
  } catch (err) {
    if (state.isBackendConnected) {
      console.warn("Backend disconnected, switching to In-Browser mode", err);
    }
    state.isBackendConnected = false;
    updateConnectionStatus(false);
    renderUI();
  }
}

function updateConnectionStatus(online) {
  if (!statusDot || !backendStatus || !backendPill) return;
  if (online) {
    statusDot.className = "status-dot online";
    backendStatus.textContent = "C++ Backend Active";
    backendPill.title = "Connected to C++ Winsock Web Server (http://localhost:8080)";
  } else {
    statusDot.className = "status-dot";
    backendStatus.textContent = "In-Browser Mode";
    backendPill.title = "Local client-side simulation. Run ./pbl_smart.exe --web for live C++ backend!";
  }
}


function initFallbackDataIfEmpty() {
  if (state.intersections.length === 0) {
    state.intersections = [
      { id: 0, name: "Central Hospital" },
      { id: 1, name: "Fire Station #1" },
      { id: 2, name: "City Center" },
      { id: 3, name: "North Junction" },
      { id: 4, name: "East District" },
      { id: 5, name: "South Hub" },
      { id: 6, name: "Rescue Command" }
    ];

    state.roads = [
      { source: 0, destination: 2, distance: 4 },
      { source: 1, destination: 2, distance: 3 },
      { source: 2, destination: 3, distance: 5 },
      { source: 2, destination: 4, distance: 6 },
      { source: 2, destination: 5, distance: 4 },
      { source: 3, destination: 4, distance: 7 },
      { source: 4, destination: 5, distance: 5 },
      { source: 5, destination: 6, distance: 3 },
      { source: 0, destination: 3, distance: 8 },
      { source: 1, destination: 6, distance: 6 }
    ];

    state.vehicles = [
      { number: "AMB-101", type: "Ambulance", locationId: 0, locationName: "Central Hospital", isBusy: false, inQueue: false },
      { number: "FIRE-201", type: "Fire Engine", locationId: 1, locationName: "Fire Station #1", isBusy: false, inQueue: false },
      { number: "RESCUE-301", type: "Rescue Squad", locationId: 6, locationName: "Rescue Command", isBusy: false, inQueue: false },
      { number: "AMB-102", type: "Ambulance", locationId: 2, locationName: "City Center", isBusy: false, inQueue: true }
    ];

    state.queue = [
      { number: "AMB-102", type: "Ambulance" }
    ];

    state.history = [
      "System initialized in demo mode",
      "Loaded 7 intersections and 10 roads",
      "Registered emergency fleet: AMB-101, FIRE-201, RESCUE-301, AMB-102"
    ];
  }
}

function runClientDijkstra(sourceId, destId) {
  const n = state.intersections.length;
  const dist = new Array(n).fill(Infinity);
  const parent = new Array(n).fill(-1);
  const visited = new Array(n).fill(false);

  dist[sourceId] = 0;

  for (let i = 0; i < n; i++) {
    let u = -1;
    let minDist = Infinity;
    for (let j = 0; j < n; j++) {
      if (!visited[j] && dist[j] < minDist) {
        minDist = dist[j];
        u = j;
      }
    }

    if (u === -1 || u === destId) break;
    visited[u] = true;

    state.roads.forEach(r => {
      let v = -1, w = r.distance;
      if (r.source === u) v = r.destination;
      else if (r.destination === u) v = r.source;

      if (v !== -1 && !visited[v]) {
        if (dist[u] + w < dist[v]) {
          dist[v] = dist[u] + w;
          parent[v] = u;
        }
      }
    });
  }

  if (dist[destId] === Infinity) return { found: false, distance: -1, path: [] };

  const path = [];
  let curr = destId;
  while (curr !== -1) {
    path.push(curr);
    curr = parent[curr];
  }
  path.reverse();
  return { found: true, distance: dist[destId], path };
}


function renderUI() {
  updateKPIs();
  updateTrafficLight();
  updateQueueDisplay();
  updateDropdowns();
  updateFleetTable();
  updateNetworkTable();
  updateHistoryList();
  calculateNodeCoordinates();
}

function updateKPIs() {
  if (!kpiSignalValue) return;
  kpiSignalValue.textContent = state.signal.state;
  if (state.signal.state === "GREEN") {
    kpiSignalValue.style.color = "#10b981";
    kpiSignalBadge.textContent = state.signal.isEmergency ? "Emergency Priority" : "Regular Green";
    kpiSignalBadge.className = "kpi-badge success";
  } else {
    kpiSignalValue.style.color = "#ef4444";
    kpiSignalBadge.textContent = "Halted";
    kpiSignalBadge.className = "kpi-badge danger";
  }

  kpiQueueCount.textContent = state.queue.length;
  kpiFleetCount.textContent = state.vehicles.length;
  kpiIntersectionsCount.textContent = state.intersections.length;

  const busyCount = state.vehicles.filter(v => v.isBusy).length;
  kpiDispatchesCount.textContent = busyCount;
  kpiDispatchBadge.textContent = busyCount > 0 ? `${busyCount} Active` : "None";
  kpiDispatchBadge.className = busyCount > 0 ? "kpi-badge danger" : "kpi-badge info";
}

function updateTrafficLight() {
  if (!lightRed || !lightGreen || !lightYellow) return;
  const isGreen = state.signal.state === "GREEN";
  lightRed.classList.toggle("active", !isGreen);
  lightGreen.classList.toggle("active", isGreen);
  lightYellow.classList.remove("active");

  if (isGreen) {
    lightStateText.textContent = "SIGNAL: GREEN";
    lightStateText.style.color = "#10b981";
    lightStateSub.textContent = state.signal.isEmergency ? "🚨 Emergency Green Corridor Active" : "Signal Open";
  } else {
    lightStateText.textContent = "SIGNAL: RED";
    lightStateText.style.color = "#ef4444";
    lightStateSub.textContent = "Waiting vehicles stopped";
  }
}

function updateQueueDisplay() {
  if (!queueTrack) return;
  queueTrack.innerHTML = "";
  if (state.queue.length === 0) {
    queueTrack.innerHTML = `<div class="queue-empty-msg">Queue is empty. Enqueue a registered vehicle.</div>`;
    if (dequeueBtn) dequeueBtn.disabled = true;
    return;
  }

  if (dequeueBtn) dequeueBtn.disabled = false;
  state.queue.forEach((v, index) => {
    const item = document.createElement("div");
    item.className = `queue-item ${index === 0 ? "first-in-line" : ""}`;
    const vType = (v.type || "").toLowerCase();
    const icon = vType.includes("fire") ? "🚒" : vType.includes("rescue") ? "🚓" : "🚑";
    item.innerHTML = `
      <span>${icon}</span>
      <strong>${v.number}</strong>
      <span class="text-dim">(${index === 0 ? "FRONT" : `#${index + 1}`})</span>
    `;
    queueTrack.appendChild(item);
  });
}

let lastIntersectionsSignature = "";
let lastVehiclesSignature = "";

function updateDropdowns() {
  const currentIntersectionsSig = state.intersections.map(i => `${i.id}:${i.name}`).join("|");
  const currentVehiclesSig = state.vehicles.map(v => `${v.number}:${v.locationName}:${v.inQueue}:${v.isBusy}`).join("|");

  const currentDest = dispatchDestSelect ? dispatchDestSelect.value : "";
  const currentAssignVeh = assignVehicleSelect ? assignVehicleSelect.value : "";
  const currentAssignLoc = assignLocationSelect ? assignLocationSelect.value : "";
  const currentQueueVeh = queueVehicleSelect ? queueVehicleSelect.value : "";
  const currentRoadSrc = roadSourceSelect ? roadSourceSelect.value : "";
  const currentRoadDest = roadDestSelect ? roadDestSelect.value : "";

  if (dispatchDestSelect && (currentIntersectionsSig !== lastIntersectionsSignature || dispatchDestSelect.children.length <= 1)) {
    dispatchDestSelect.innerHTML = `<option value="">Select destination (or click node on map)...</option>`;
    state.intersections.forEach(i => {
      const opt = document.createElement("option");
      opt.value = i.id;
      opt.textContent = `${i.id}. ${i.name}`;
      if (state.selectedDestinationId === i.id || currentDest == i.id) opt.selected = true;
      dispatchDestSelect.appendChild(opt);
    });
  } else if (dispatchDestSelect && currentDest) {
    dispatchDestSelect.value = currentDest;
  }

  if (assignVehicleSelect && (currentVehiclesSig !== lastVehiclesSignature || assignVehicleSelect.children.length <= 1)) {
    assignVehicleSelect.innerHTML = `<option value="">Select vehicle...</option>`;
    state.vehicles.forEach(v => {
      const opt = document.createElement("option");
      opt.value = v.number;
      opt.textContent = `${v.number} (${v.type}) [Loc: ${v.locationName}]`;
      if (currentAssignVeh === v.number) opt.selected = true;
      assignVehicleSelect.appendChild(opt);
    });
  } else if (assignVehicleSelect && currentAssignVeh) {
    assignVehicleSelect.value = currentAssignVeh;
  }

  if (assignLocationSelect && (currentIntersectionsSig !== lastIntersectionsSignature || assignLocationSelect.children.length <= 1)) {
    assignLocationSelect.innerHTML = `<option value="">Select intersection...</option>`;
    state.intersections.forEach(i => {
      const opt = document.createElement("option");
      opt.value = i.id;
      opt.textContent = `${i.id}. ${i.name}`;
      if (currentAssignLoc == i.id) opt.selected = true;
      assignLocationSelect.appendChild(opt);
    });
  } else if (assignLocationSelect && currentAssignLoc) {
    assignLocationSelect.value = currentAssignLoc;
  }

  if (queueVehicleSelect && (currentVehiclesSig !== lastVehiclesSignature || queueVehicleSelect.children.length <= 1)) {
    queueVehicleSelect.innerHTML = `<option value="">Select vehicle...</option>`;
    state.vehicles.filter(v => !v.inQueue && !v.isBusy).forEach(v => {
      const opt = document.createElement("option");
      opt.value = v.number;
      opt.textContent = `${v.number} (${v.type})`;
      if (currentQueueVeh === v.number) opt.selected = true;
      queueVehicleSelect.appendChild(opt);
    });
  } else if (queueVehicleSelect && currentQueueVeh) {
    queueVehicleSelect.value = currentQueueVeh;
  }

  if (roadSourceSelect && roadDestSelect && (currentIntersectionsSig !== lastIntersectionsSignature || roadSourceSelect.children.length <= 1 || roadDestSelect.children.length <= 1)) {
    roadSourceSelect.innerHTML = `<option value="">Select source...</option>`;
    roadDestSelect.innerHTML = `<option value="">Select destination...</option>`;
    state.intersections.forEach(i => {
      const opt1 = document.createElement("option");
      opt1.value = i.id;
      opt1.textContent = `${i.id}. ${i.name}`;
      if (currentRoadSrc == i.id) opt1.selected = true;
      roadSourceSelect.appendChild(opt1);

      const opt2 = document.createElement("option");
      opt2.value = i.id;
      opt2.textContent = `${i.id}. ${i.name}`;
      if (currentRoadDest == i.id) opt2.selected = true;
      roadDestSelect.appendChild(opt2);
    });
  } else {
    if (roadSourceSelect && currentRoadSrc) roadSourceSelect.value = currentRoadSrc;
    if (roadDestSelect && currentRoadDest) roadDestSelect.value = currentRoadDest;
  }

  lastIntersectionsSignature = currentIntersectionsSig;
  lastVehiclesSignature = currentVehiclesSig;
}

function updateFleetTable() {
  if (!fleetTableBody) return;
  fleetTableBody.innerHTML = "";
  if (state.vehicles.length === 0) {
    fleetTableBody.innerHTML = `<tr><td colspan="5" class="text-center">No vehicles registered yet.</td></tr>`;
    return;
  }

  state.vehicles.forEach(v => {
    const tr = document.createElement("tr");
    const vType = (v.type || "").toLowerCase();
    const icon = vType.includes("fire") ? "🚒" : vType.includes("rescue") ? "🚓" : "🚑";

    let badgeClass = "badge-success";
    let statusText = "Available";
    if (v.isBusy) {
      badgeClass = "badge-danger";
      statusText = "Dispatched";
    } else if (v.inQueue) {
      badgeClass = "badge-info";
      statusText = "In Queue";
    }

    tr.innerHTML = `
      <td><strong>${icon} ${v.number}</strong></td>
      <td>${v.type}</td>
      <td>${v.locationName}</td>
      <td><span class="badge ${badgeClass}">${statusText}</span></td>
      <td>
        <button class="btn btn-xs btn-outline btn-remove-v" data-num="${v.number}" ${v.isBusy ? "disabled" : ""}>Remove</button>
      </td>
    `;
    fleetTableBody.appendChild(tr);
  });

  document.querySelectorAll(".btn-remove-v").forEach(btn => {
    btn.addEventListener("click", () => handleRemoveVehicle(btn.dataset.num));
  });
}

function updateNetworkTable() {
  if (intersectionsTableBody) {
    intersectionsTableBody.innerHTML = "";
    if (state.intersections.length === 0) {
      intersectionsTableBody.innerHTML = `<tr><td colspan="3" class="text-center">No intersections created.</td></tr>`;
    } else {
      state.intersections.forEach(i => {
        const connectedRoads = state.roads.filter(r => r.source === i.id || r.destination === i.id);
        const roadDesc = connectedRoads.map(r => {
          const otherId = r.source === i.id ? r.destination : r.source;
          const otherName = state.intersections.find(it => it.id === otherId)?.name || `#${otherId}`;
          return `${otherName} (${r.distance} km)`;
        }).join(", ") || "None";

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><span class="badge badge-info">ID: ${i.id}</span></td>
          <td><strong>${i.name}</strong></td>
          <td class="text-dim">${roadDesc}</td>
        `;
        intersectionsTableBody.appendChild(tr);
      });
    }
  }

  if (roadsTableBody) {
    roadsTableBody.innerHTML = "";
    if (state.roads.length === 0) {
      roadsTableBody.innerHTML = `<tr><td colspan="4" class="text-center">No roads connected yet.</td></tr>`;
    } else {
      state.roads.forEach(r => {
        const srcName = state.intersections.find(i => i.id === r.source)?.name || `#${r.source}`;
        const destName = state.intersections.find(i => i.id === r.destination)?.name || `#${r.destination}`;

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><strong>${srcName}</strong> ⟷ <strong>${destName}</strong> <span class="text-dim">(#${r.source} ➔ #${r.destination})</span></td>
          <td><span class="badge badge-warning">${r.distance} km</span></td>
          <td><span class="badge badge-info">Bidirectional</span></td>
          <td>
            <button class="btn-remove-r" data-src="${r.source}" data-dest="${r.destination}">Remove</button>
          </td>
        `;
        roadsTableBody.appendChild(tr);
      });

      document.querySelectorAll(".btn-remove-r").forEach(btn => {
        btn.addEventListener("click", () => {
          const s = parseInt(btn.dataset.src);
          const d = parseInt(btn.dataset.dest);
          handleRemoveRoad(s, d);
        });
      });
    }
  }
}

function updateHistoryList() {
  if (!historyList) return;
  historyList.innerHTML = "";
  if (state.history.length === 0) {
    historyList.innerHTML = `<div class="history-empty">No actions logged yet.</div>`;
    return;
  }

  state.history.forEach((text, index) => {
    const item = document.createElement("div");
    item.className = `history-item ${index === 0 ? "top-stack" : ""}`;
    item.innerHTML = `
      <span>${index === 0 ? "⭐ " : ""}${text}</span>
      <span class="history-time">${index === 0 ? "TOP" : `#${index + 1}`}</span>
    `;
    historyList.appendChild(item);
  });
}

function resizeCanvas() {
  const rect = canvas.parentElement ? canvas.parentElement.getBoundingClientRect() : { width: 750, height: 480 };
  const dpr = window.devicePixelRatio || 1;
  const w = rect.width > 0 ? rect.width : (canvas.parentElement?.clientWidth || 750);
  const h = rect.height > 0 ? rect.height : 480;

  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvasWidth = w;
  canvasHeight = h;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  calculateNodeCoordinates();
}

window.addEventListener("resize", resizeCanvas);

function calculateNodeCoordinates() {
  const n = state.intersections.length;
  if (n === 0) return;

  const w = canvasWidth > 0 ? canvasWidth : (canvas.parentElement?.clientWidth || 750);
  const h = canvasHeight > 0 ? canvasHeight : 480;
  const centerX = w / 2;
  const centerY = h / 2;

  const presetOffsets = [
    { x: -0.32, y: -0.25 },
    { x: -0.32, y: 0.28 },  
    { x: 0.0, y: 0.0 },    
    { x: 0.08, y: -0.32 },  
    { x: 0.35, y: -0.15 },  
    { x: 0.15, y: 0.32 }, 
    { x: 0.38, y: 0.28 }    
  ];

  state.intersections.forEach((intersection, idx) => {
    if (nodePositions[intersection.id] && nodePositions[intersection.id].custom) {
      nodePositions[intersection.id].name = intersection.name;
      return;
    }

    let px, py;
    if (idx < presetOffsets.length) {
      px = centerX + presetOffsets[idx].x * w;
      py = centerY + presetOffsets[idx].y * h;
    } else {
      const extraIdx = idx - presetOffsets.length;
      const angle = (extraIdx * 1.618033) * 2 * Math.PI;
      const radius = Math.min(w, h) * 0.40;
      px = centerX + radius * Math.cos(angle);
      py = centerY + radius * Math.sin(angle);
    }

    nodePositions[intersection.id] = {
      x: Math.max(50, Math.min(w - 50, px)),
      y: Math.max(50, Math.min(h - 50, py)),
      name: intersection.name,
      custom: false
    };
  });
}

function drawGraph() {
  try {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    state.roads.forEach(road => {
      const p1 = nodePositions[road.source];
      const p2 = nodePositions[road.destination];
      if (!p1 || !p2) return;

      const isPathEdge = isEdgeInPath(road.source, road.destination, state.activePathHighlight);
      const isCorridor = isPathEdge && state.signal.state === "GREEN";

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);

      if (isCorridor) {
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 5;
        ctx.shadowColor = "#10b981";
        ctx.shadowBlur = 15;
      } else if (isPathEdge) {
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 4;
        ctx.shadowColor = "#f59e0b";
        ctx.shadowBlur = 12;
      } else {
        ctx.strokeStyle = "#253347";
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 0;
      }

      ctx.stroke();
      ctx.shadowBlur = 0; 

      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      drawDistanceTag(midX, midY, `${road.distance} km`, isPathEdge);
    });

    if (state.activeTab === "tab-network" && state.networkSelectedSource !== null && nodePositions[state.networkSelectedSource]) {
      const pSrc = nodePositions[state.networkSelectedSource];
      const targetPos = hoveredNodeId !== null && hoveredNodeId !== state.networkSelectedSource && nodePositions[hoveredNodeId]
        ? nodePositions[hoveredNodeId]
        : null;

      if (targetPos) {
        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([6, 6]);
        ctx.moveTo(pSrc.x, pSrc.y);
        ctx.lineTo(targetPos.x, targetPos.y);
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      }
    }

    state.intersections.forEach(intersection => {
      const pos = nodePositions[intersection.id];
      if (!pos) return;

      const isHovered = hoveredNodeId === intersection.id;
      const isDestination = state.selectedDestinationId === intersection.id;
      const isNetworkSource = state.networkSelectedSource === intersection.id;
      const isInPath = state.activePathHighlight && state.activePathHighlight.includes(intersection.id);

      if (isNetworkSource) {
        const now = performance.now() / 400;
        const pulseRadius = 24 + Math.sin(now) * 4;
        ctx.save();
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pulseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);

      if (isNetworkSource) {
        ctx.fillStyle = "#0284c7";
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 18;
      } else if (isDestination) {
        ctx.fillStyle = "#dc2626";
        ctx.strokeStyle = "#f87171";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = 18;
      } else if (isInPath) {
        ctx.fillStyle = "#d97706";
        ctx.strokeStyle = "#fde047";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#f59e0b";
        ctx.shadowBlur = 14;
      } else if (isHovered) {
        ctx.fillStyle = "#334155";
        ctx.strokeStyle = "#60a5fa";
        ctx.lineWidth = 2.5;
        ctx.shadowColor = "#60a5fa";
        ctx.shadowBlur = 10;
      } else {
        ctx.fillStyle = "#1e293b";
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 2;
        ctx.shadowBlur = 0;
      }

      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.font = "bold 12px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#f8fafc";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(intersection.id, pos.x, pos.y);
      ctx.restore();

      ctx.save();
      ctx.font = "600 11px Inter, sans-serif";
      ctx.fillStyle = isDestination ? "#f87171" : isNetworkSource ? "#38bdf8" : isInPath ? "#fbbf24" : "#e2e8f0";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(intersection.name, pos.x, pos.y + 24);
      ctx.restore();

      const stationedVehicles = state.vehicles.filter(v => v.locationId === intersection.id);
      if (stationedVehicles.length > 0) {
        drawStationedVehicleIcons(pos.x, pos.y - 25, stationedVehicles);
      }
    });

    if (state.animatingVehicle) {
      drawAnimatedVehicleSprite(state.animatingVehicle);
    }
  } catch (err) {
    console.error("drawGraph error:", err);
  }

  requestAnimationFrame(drawGraph);
}

function isEdgeInPath(u, v, path) {
  if (!path || path.length < 2) return false;
  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i];
    const p2 = path[i + 1];
    if ((p1 === u && p2 === v) || (p1 === v && p2 === u)) {
      return true;
    }
  }
  return false;
}

function drawDistanceTag(x, y, text, isHighlight) {
  ctx.save();
  ctx.font = "bold 9px 'JetBrains Mono', monospace";
  const metrics = ctx.measureText(text);
  const w = metrics.width + 10;
  const h = 16;

  ctx.fillStyle = isHighlight ? "#1e293b" : "#0f172a";
  ctx.strokeStyle = isHighlight ? "#f59e0b" : "#334155";
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x - w / 2, y - h / 2, w, h, 4);
  } else {
    ctx.rect(x - w / 2, y - h / 2, w, h);
  }
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = isHighlight ? "#fbbf24" : "#94a3b8";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawStationedVehicleIcons(x, y, vehicles) {
  if (!vehicles || vehicles.length === 0) return;
  const iconStr = vehicles.map(v => {
    const typeStr = (v.type || "").toLowerCase();
    return typeStr.includes("fire") ? "🚒" : typeStr.includes("rescue") ? "🚓" : "🚑";
  }).join("");

  ctx.save();
  ctx.font = "13px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(iconStr, x, y);
  ctx.restore();
}

function drawAnimatedVehicleSprite(av) {
  if (!av) return;
  ctx.save();
  ctx.beginPath();
  ctx.arc(av.x, av.y, 16, 0, Math.PI * 2);
  ctx.fillStyle = "#10b981";
  ctx.shadowColor = "#10b981";
  ctx.shadowBlur = 20;
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.stroke();

  const typeStr = (av.type || "").toLowerCase();
  const icon = typeStr.includes("fire") ? "🚒" : typeStr.includes("rescue") ? "🚓" : "🚑";
  ctx.font = "14px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(icon, av.x, av.y);

  ctx.font = "bold 10px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#fff";
  ctx.fillText(av.vehicleNumber || "", av.x, av.y - 22);

  ctx.restore();
}

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  if (state.isDragging && state.draggedNodeId !== null && nodePositions[state.draggedNodeId]) {
    const dx = Math.abs(mouseX - state.dragStartX);
    const dy = Math.abs(mouseY - state.dragStartY);
    if (dx > 4 || dy > 4) {
      state.dragMoved = true;
    }
    nodePositions[state.draggedNodeId].x = Math.max(40, Math.min(canvasWidth - 40, mouseX));
    nodePositions[state.draggedNodeId].y = Math.max(40, Math.min(canvasHeight - 40, mouseY));
    nodePositions[state.draggedNodeId].custom = true;
    canvas.style.cursor = "grabbing";
    return;
  }

  let found = null;
  for (const id in nodePositions) {
    const pos = nodePositions[id];
    const dist = Math.hypot(pos.x - mouseX, pos.y - mouseY);
    if (dist <= 24) {
      found = parseInt(id);
      break;
    }
  }
  hoveredNodeId = found;
  canvas.style.cursor = found !== null ? "pointer" : "default";
});

canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  state.dragStartX = mouseX;
  state.dragStartY = mouseY;
  state.dragMoved = false;

  if (hoveredNodeId !== null) {
    state.isDragging = true;
    state.draggedNodeId = hoveredNodeId;
  }
});

window.addEventListener("mouseup", () => {
  state.isDragging = false;
  state.draggedNodeId = null;
  canvas.style.cursor = hoveredNodeId !== null ? "pointer" : "default";
});

canvas.addEventListener("click", () => {
  if (state.dragMoved) {
    state.dragMoved = false;
    return;
  }

  if (hoveredNodeId === null) return;

  const clickedId = hoveredNodeId;
  const nodeName = nodePositions[clickedId]?.name || `#${clickedId}`;

  if (state.activeTab === "tab-network") {
    if (state.networkSelectedSource === null) {
      state.networkSelectedSource = clickedId;
      if (roadSourceSelect) roadSourceSelect.value = clickedId;

      if (connectSelectionPill) connectSelectionPill.classList.add("active");
      if (connectSelectionText) {
        connectSelectionText.textContent = `Source: #${clickedId} (${nodeName}). Now click DESTINATION node on map!`;
      }
      if (btnClearMapSelection) btnClearMapSelection.classList.remove("hidden");

      showToast(`Source selected: #${clickedId} (${nodeName}). Click second node to connect road!`, "info");
      updateMapModeUI();
    } else if (state.networkSelectedSource === clickedId) {
      clearMapRoadSelection();
      showToast("Deselected road source", "info");
    } else {
      state.networkSelectedDest = clickedId;
      if (roadDestSelect) roadDestSelect.value = clickedId;

      if (roadDistInput && (!roadDistInput.value || parseInt(roadDistInput.value) <= 0)) {
        roadDistInput.value = "5"; 
      }

      if (connectSelectionPill) connectSelectionPill.classList.add("active");
      if (connectSelectionText) {
        const srcName = nodePositions[state.networkSelectedSource]?.name || `#${state.networkSelectedSource}`;
        const distVal = roadDistInput ? roadDistInput.value : "5";
        connectSelectionText.textContent = `Ready to connect #${state.networkSelectedSource} (${srcName}) ➔ #${clickedId} (${nodeName})! Distance: ${distVal} km.`;
      }
      if (btnClearMapSelection) btnClearMapSelection.classList.remove("hidden");

      if (roadDistInput) roadDistInput.focus();
      showToast(`Ready to connect #${state.networkSelectedSource} ➔ #${clickedId}! Click 'Connect Road' below.`, "success");
      updateMapModeUI();
    }
    return;
  }

  if (state.activeTab === "tab-vehicles") {
    if (assignLocationSelect) assignLocationSelect.value = clickedId;
    showToast(`Intersection #${clickedId} (${nodeName}) selected for vehicle stationing`, "info");
    return;
  }

  state.selectedDestinationId = clickedId;
  if (dispatchDestSelect) dispatchDestSelect.value = clickedId;
  showToast(`Emergency destination set: #${clickedId} (${nodeName})`, "info");
  renderUI();
});

if (resetMapZoomBtn) {
  resetMapZoomBtn.addEventListener("click", () => {
    for (const id in nodePositions) {
      nodePositions[id].custom = false;
    }
    calculateNodeCoordinates();
    showToast("Map view centered & layout normalized", "info");
  });
}


if (loadSampleBtn) {
  loadSampleBtn.addEventListener("click", async () => {
    if (state.isBackendConnected) {
      try {
        await apiCall("/api/network/sample-data", "POST", {});
        showToast("Demo city data loaded on backend!", "success");
        syncSystemState();
      } catch (err) {
        showToast(err.message, "danger");
      }
    } else {
      initFallbackDataIfEmpty();
      showToast("Loaded sample city network in standalone mode!", "success");
      renderUI();
    }
  });
}


if (dispatchForm) {
  dispatchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const type = emergencyTypeSelect.value;
    const destId = parseInt(dispatchDestSelect.value);

    if (isNaN(destId)) {
      showToast("Please choose a valid destination intersection", "warning");
      return;
    }

    if (state.isBackendConnected) {
      try {
        const result = await apiCall("/api/dispatch", "POST", { emergencyType: type, destination: destId });
        handleDispatchSuccess(result, type, destId);
        syncSystemState();
      } catch (err) {
        showToast(err.message, "danger");
      }
    } else {
      const suitableVehicles = state.vehicles.filter(v => {
        if (v.isBusy) return false;
        const vt = (v.type || "").toLowerCase();
        const em = (type || "").toLowerCase();
        if (em === "medical") return vt.includes("ambulance");
        if (em === "fire") return vt.includes("fire");
        if (em === "rescue") return vt.includes("rescue");
        return false;
      });

      if (suitableVehicles.length === 0) {
        showToast(`No available ${type} vehicles in fleet!`, "danger");
        return;
      }

      let bestVehicle = null;
      let bestRoute = null;
      let minDistance = Infinity;

      suitableVehicles.forEach(v => {
        const route = runClientDijkstra(v.locationId, destId);
        if (route.found && route.distance < minDistance) {
          minDistance = route.distance;
          bestVehicle = v;
          bestRoute = route;
        }
      });

      if (!bestVehicle || !bestRoute) {
        showToast("No road path connects any available vehicle to that destination!", "danger");
        return;
      }

      bestVehicle.isBusy = true;
      const result = {
        success: true,
        vehicleNumber: bestVehicle.number,
        source: bestVehicle.locationId,
        destination: destId,
        distance: bestRoute.distance,
        path: bestRoute.path
      };

      state.activeDispatches.push(result);
      const destName = state.intersections.find(i => i.id === destId)?.name || `#${destId}`;
      state.history.unshift(`Dispatched ${type} vehicle ${bestVehicle.number} to ${destName}`);
      handleDispatchSuccess(result, type, destId);
      renderUI();
    }
  });
}

function handleDispatchSuccess(result, type, destId) {
  state.activePathHighlight = result.path;
  const srcName = state.intersections.find(i => i.id === result.source)?.name || `#${result.source}`;
  const destName = state.intersections.find(i => i.id === destId)?.name || `#${destId}`;

  if (resultDistance) resultDistance.textContent = `${result.distance} km`;
  if (resultVehicle) resultVehicle.textContent = result.vehicleNumber;
  if (resultEmergencyType) resultEmergencyType.textContent = type;
  if (resultSource) resultSource.textContent = srcName;
  if (resultDest) resultDest.textContent = destName;

  if (resultPathFlow) {
    resultPathFlow.innerHTML = result.path.map((nodeId, idx) => {
      const name = state.intersections.find(i => i.id === nodeId)?.name || `#${nodeId}`;
      return `<span class="path-node">${name}</span>${idx < result.path.length - 1 ? '<span class="path-arrow">➔</span>' : ''}`;
    }).join("");
  }

  if (dispatchResultBox) dispatchResultBox.classList.remove("hidden");
  showToast(`Vehicle ${result.vehicleNumber} dispatched via shortest route (${result.distance} km)!`, "success");
}

if (btnSimulateRoute) {
  btnSimulateRoute.addEventListener("click", async () => {
    const vehicleNum = resultVehicle.textContent;
    if (!vehicleNum || !state.activePathHighlight) return;

    const vehicleObj = state.vehicles.find(v => v.number === vehicleNum) || { vehicleNumber: vehicleNum, type: resultEmergencyType.textContent };

    state.signal.state = "GREEN";
    state.signal.isEmergency = true;
    updateTrafficLight();

    if (simBanner) simBanner.classList.remove("hidden");
    if (simVehicleTitle) simVehicleTitle.textContent = `Vehicle ${vehicleNum} En Route`;
    if (simStatusSub) simStatusSub.textContent = `Green Corridor active • Driving through ${state.activePathHighlight.length} intersections...`;

    const path = [...state.activePathHighlight];
    const totalSteps = path.length - 1;
    let currentStep = 0;

    function animateStep() {
      if (currentStep >= totalSteps) {

        state.animatingVehicle = null;
        if (simBanner) simBanner.classList.add("hidden");
        state.signal.state = "RED";
        state.signal.isEmergency = false;

        const destId = path[path.length - 1];
        const vehicle = state.vehicles.find(v => v.number === vehicleNum);
        if (vehicle) {
          vehicle.locationId = destId;
          vehicle.locationName = state.intersections.find(i => i.id === destId)?.name || `#${destId}`;
          vehicle.isBusy = false;
        }

        state.activePathHighlight = null;
        if (dispatchResultBox) dispatchResultBox.classList.add("hidden");
        showToast(`Vehicle ${vehicleNum} reached destination successfully! Dispatch complete.`, "success");

        if (state.isBackendConnected) {
          apiCall("/api/simulate", "POST", { vehicleNumber: vehicleNum }).catch(() => {});
          syncSystemState();
        } else {
          state.history.unshift(`Emergency dispatch completed for ${vehicleNum}`);
          renderUI();
        }
        return;
      }

      const u = path[currentStep];
      const v = path[currentStep + 1];
      const p1 = nodePositions[u];
      const p2 = nodePositions[v];

      if (!p1 || !p2) {
        currentStep++;
        animateStep();
        return;
      }

      let t = 0;
      const duration = 1200; 
      const startTime = performance.now();

      function stepFrame(now) {
        const elapsed = now - startTime;
        t = Math.min(1, elapsed / duration);

        const curX = p1.x + (p2.x - p1.x) * t;
        const curY = p1.y + (p2.y - p1.y) * t;

        state.animatingVehicle = {
          vehicleNumber: vehicleNum,
          type: vehicleObj.type,
          x: curX,
          y: curY
        };

        const overallProgress = ((currentStep + t) / totalSteps) * 100;
        if (simProgressFill) simProgressFill.style.width = `${overallProgress}%`;

        if (t < 1) {
          requestAnimationFrame(stepFrame);
        } else {
          currentStep++;
          animateStep();
        }
      }

      requestAnimationFrame(stepFrame);
    }

    animateStep();
  });
}


if (givePriorityBtn) {
  givePriorityBtn.addEventListener("click", async () => {
    if (state.isBackendConnected) {
      try {
        await apiCall("/api/signal/priority", "POST", {});
        showToast("Emergency signal priority granted (Green Corridor)!", "success");
        syncSystemState();
      } catch (err) {
        showToast(err.message, "danger");
      }
    } else {
      state.signal.state = "GREEN";
      state.signal.isEmergency = true;
      state.history.unshift("Green corridor emergency priority requested");
      showToast("Green corridor emergency priority requested!", "success");
      renderUI();
    }
  });
}

if (resetSignalBtn) {
  resetSignalBtn.addEventListener("click", async () => {
    if (state.isBackendConnected) {
      try {
        await apiCall("/api/signal/reset", "POST", {});
        showToast("Signal reset to RED", "info");
        syncSystemState();
      } catch (err) {
        showToast(err.message, "danger");
      }
    } else {
      state.signal.state = "RED";
      state.signal.isEmergency = false;
      state.history.unshift("Traffic signal reset to RED");
      showToast("Traffic signal reset to RED", "info");
      renderUI();
    }
  });
}

if (dequeueBtn) {
  dequeueBtn.addEventListener("click", async () => {
    if (state.isBackendConnected) {
      try {
        const res = await apiCall("/api/queue/dequeue", "POST", {});
        showToast(`Vehicle ${res.vehicle} passed the traffic signal!`, "success");
        syncSystemState();
      } catch (err) {
        showToast(err.message, "danger");
      }
    } else {
      if (state.queue.length === 0) return;
      const passed = state.queue.shift();
      const v = state.vehicles.find(veh => veh.number === passed.number);
      if (v) v.inQueue = false;
      state.history.unshift(`Vehicle ${passed.number} passed the traffic signal`);
      showToast(`Vehicle ${passed.number} passed the traffic signal!`, "success");
      renderUI();
    }
  });
}


if (addVehicleForm) {
  addVehicleForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const num = vehicleNumInput.value.trim().toUpperCase();
    const type = vehicleTypeInput.value;

    if (state.isBackendConnected) {
      try {
        await apiCall("/api/vehicles/add", "POST", { number: num, type });
        showToast(`Registered vehicle ${num}`, "success");
        vehicleNumInput.value = "";
        syncSystemState();
      } catch (err) {
        showToast(err.message, "danger");
      }
    } else {
      if (state.vehicles.some(v => v.number === num)) {
        showToast("Vehicle number already registered", "danger");
        return;
      }
      state.vehicles.push({ number: num, type, locationId: -1, locationName: "Unassigned", isBusy: false, inQueue: false });
      state.history.unshift(`Registered vehicle ${num} (${type})`);
      vehicleNumInput.value = "";
      showToast(`Registered vehicle ${num} successfully`, "success");
      renderUI();
    }
  });
}

if (setLocationForm) {
  setLocationForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const num = assignVehicleSelect.value;
    const locId = parseInt(assignLocationSelect.value);

    if (!num || isNaN(locId)) return;

    if (state.isBackendConnected) {
      try {
        await apiCall("/api/vehicles/set-location", "POST", { number: num, intersectionId: locId });
        showToast(`Assigned ${num} to intersection #${locId}`, "success");
        syncSystemState();
      } catch (err) {
        showToast(err.message, "danger");
      }
    } else {
      const v = state.vehicles.find(veh => veh.number === num);
      if (v) {
        v.locationId = locId;
        v.locationName = state.intersections.find(i => i.id === locId)?.name || `#${locId}`;
        state.history.unshift(`Location assigned to ${num} -> ${v.locationName}`);
        showToast(`Assigned ${num} to ${v.locationName}`, "success");
        renderUI();
      }
    }
  });
}


if (enqueueForm) {
  enqueueForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const num = queueVehicleSelect.value;
    if (!num) return;

    if (state.isBackendConnected) {
      try {
        await apiCall("/api/queue/enqueue", "POST", { number: num });
        showToast(`Added ${num} to traffic queue`, "success");
        syncSystemState();
      } catch (err) {
        showToast(err.message, "danger");
      }
    } else {
      const v = state.vehicles.find(veh => veh.number === num);
      if (v && !v.inQueue) {
        v.inQueue = true;
        state.queue.push({ number: v.number, type: v.type });
        state.history.unshift(`Added vehicle ${v.number} to queue`);
        showToast(`Added ${v.number} to traffic queue`, "success");
        renderUI();
      }
    }
  });
}

async function handleRemoveVehicle(num) {
  if (state.isBackendConnected) {
    try {
      await apiCall("/api/vehicles/remove", "POST", { number: num });
      showToast(`Removed vehicle ${num}`, "info");
      syncSystemState();
    } catch (err) {
      showToast(err.message, "danger");
    }
  } else {
    state.vehicles = state.vehicles.filter(v => v.number !== num);
    state.queue = state.queue.filter(q => q.number !== num);
    state.history.unshift(`Removed vehicle ${num}`);
    showToast(`Removed vehicle ${num}`, "info");
    renderUI();
  }
}

if (addIntersectionForm) {
  addIntersectionForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = intersectionNameInput.value.trim();
    if (!name) return;

    if (state.isBackendConnected) {
      try {
        const res = await apiCall("/api/network/add-intersection", "POST", { name });
        showToast(`Added intersection ${name} (ID: ${res.id})`, "success");
        intersectionNameInput.value = "";
        syncSystemState();
      } catch (err) {
        showToast(err.message, "danger");
      }
    } else {
      const id = state.intersections.length;
      state.intersections.push({ id, name });
      state.history.unshift(`Added intersection ${name} (ID: ${id})`);
      intersectionNameInput.value = "";
      showToast(`Added intersection ${name} (ID: ${id})`, "success");
      calculateNodeCoordinates();
      renderUI();
    }
  });
}

if (addRoadForm) {
  addRoadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const src = parseInt(roadSourceSelect.value);
    const dest = parseInt(roadDestSelect.value);
    const dist = parseInt(roadDistInput.value);

    if (isNaN(src) || isNaN(dest) || isNaN(dist) || dist <= 0) {
      showToast("Please select valid source, destination, and distance", "warning");
      return;
    }

    if (src === dest) {
      showToast("Source and destination cannot be the same intersection!", "warning");
      return;
    }

    const alreadyExists = state.roads.some(
      r => (r.source === src && r.destination === dest) || (r.source === dest && r.destination === src)
    );

    if (alreadyExists) {
      showToast(`A road between #${src} and #${dest} already exists!`, "warning");
      return;
    }

    if (state.isBackendConnected) {
      try {
        await apiCall("/api/network/add-road", "POST", { source: src, destination: dest, distance: dist });
        showToast(`Road connected between #${src} and #${dest} (${dist} km)!`, "success");
        if (roadDistInput) roadDistInput.value = "";
        clearMapRoadSelection();
        syncSystemState();
      } catch (err) {
        showToast(err.message, "danger");
      }
    } else {
      state.roads.push({ source: src, destination: dest, distance: dist });
      state.history.unshift(`Added road between #${src} and #${dest} (${dist} km)`);
      if (roadDistInput) roadDistInput.value = "";
      clearMapRoadSelection();
      showToast(`Road connected between #${src} and #${dest} (${dist} km)!`, "success");
      renderUI();
    }
  });
}

async function handleRemoveRoad(src, dest) {
  if (state.isBackendConnected) {
    try {
      await apiCall("/api/network/remove-road", "POST", { source: src, destination: dest });
      showToast(`Removed road between #${src} and #${dest}`, "info");
      syncSystemState();
    } catch (err) {
      showToast(err.message, "danger");
    }
  } else {
    state.roads = state.roads.filter(
      r => !((r.source === src && r.destination === dest) || (r.source === dest && r.destination === src))
    );
    state.history.unshift(`Removed road between #${src} and #${dest}`);
    showToast(`Removed road between #${src} and #${dest}`, "info");
    renderUI();
  }
}


function initApp() {
  initFallbackDataIfEmpty();
  resizeCanvas();
  renderUI();
  drawGraph();
  updateMapModeUI();

  syncSystemState();

  setInterval(() => {
    syncSystemState();
  }, 2000);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
