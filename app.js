/**
 * SMART CITY EMERGENCY RESPONSE SYSTEM - FRONTEND ENGINE
 * Connects with C++ backend via REST API (with offline standalone fallback)
 */

// Application State
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
  activePathHighlight: null, // array of node IDs for current shortest path
  animatingVehicle: null // { vehicleNumber, type, path: [], stepIndex: 0, progress: 0, x, y }
};

// Canvas & Viewport Coordinates
const canvas = document.getElementById("cityCanvas");
const ctx = canvas.getContext("2d");
let canvasWidth = 0;
let canvasHeight = 0;
let nodePositions = {}; // id -> { x, y, name }
let hoveredNodeId = null;

// DOM Elements
const backendPill = document.getElementById("backendPill");
const statusDot = document.getElementById("statusDot");
const backendStatus = document.getElementById("backendStatus");
const liveClock = document.getElementById("liveClock");
const loadSampleBtn = document.getElementById("loadSampleBtn");

// KPI elements
const kpiSignalValue = document.getElementById("kpiSignalValue");
const kpiSignalBadge = document.getElementById("kpiSignalBadge");
const kpiQueueCount = document.getElementById("kpiQueueCount");
const kpiFleetCount = document.getElementById("kpiFleetCount");
const kpiIntersectionsCount = document.getElementById("kpiIntersectionsCount");
const kpiDispatchesCount = document.getElementById("kpiDispatchesCount");

// Signal elements
const lightRed = document.getElementById("lightRed");
const lightYellow = document.getElementById("lightYellow");
const lightGreen = document.getElementById("lightGreen");
const lightStateText = document.getElementById("lightStateText");
const lightStateSub = document.getElementById("lightStateSub");
const givePriorityBtn = document.getElementById("givePriorityBtn");
const resetSignalBtn = document.getElementById("resetSignalBtn");
const dequeueBtn = document.getElementById("dequeueBtn");
const queueTrack = document.getElementById("queueTrack");

// Tab and Form elements
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

// Fleet forms
const addVehicleForm = document.getElementById("addVehicleForm");
const vehicleNumInput = document.getElementById("vehicleNumInput");
const vehicleTypeInput = document.getElementById("vehicleTypeInput");
const setLocationForm = document.getElementById("setLocationForm");
const assignVehicleSelect = document.getElementById("assignVehicleSelect");
const assignLocationSelect = document.getElementById("assignLocationSelect");
const enqueueForm = document.getElementById("enqueueForm");
const queueVehicleSelect = document.getElementById("queueVehicleSelect");
const fleetTableBody = document.getElementById("fleetTableBody");

// Network forms
const addIntersectionForm = document.getElementById("addIntersectionForm");
const intersectionNameInput = document.getElementById("intersectionNameInput");
const addRoadForm = document.getElementById("addRoadForm");
const roadSourceSelect = document.getElementById("roadSourceSelect");
const roadDestSelect = document.getElementById("roadDestSelect");
const roadDistInput = document.getElementById("roadDistInput");
const intersectionsTableBody = document.getElementById("intersectionsTableBody");

// History & Simulation
const historyList = document.getElementById("historyList");
const simBanner = document.getElementById("simBanner");
const simVehicleTitle = document.getElementById("simVehicleTitle");
const simStatusSub = document.getElementById("simStatusSub");
const simProgressFill = document.getElementById("simProgressFill");
const resetMapZoomBtn = document.getElementById("resetMapZoomBtn");

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
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

// Live Clock
setInterval(() => {
  const now = new Date();
  liveClock.textContent = now.toTimeString().split(" ")[0];
}, 1000);

// ==========================================
// TABS HANDLING
// ==========================================
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    const target = document.getElementById(btn.dataset.tab);
    if (target) target.classList.add("active");
  });
});

// ==========================================
// API & BACKEND COMMUNICATION LAYER
// ==========================================
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

// Fetch Full System Status
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
    // If backend is not running, fallback to client-side standalone simulation
    if (state.isBackendConnected) {
      console.warn("Backend disconnected, switching to In-Browser mode", err);
    }
    state.isBackendConnected = false;
    updateConnectionStatus(false);
    renderUI();
  }
}

function updateConnectionStatus(online) {
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

// ==========================================
// FALLBACK CLIENT-SIDE SIMULATION ENGINE
// (Ensures the UI is 100% functional even offline!)
// ==========================================
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

// Dijkstra Shortest Path in JS (mirrors C++ shortest_path.cpp)
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

    // Find neighbors of u
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

// ==========================================
// RENDER UI & UPDATE ALL COMPONENTS
// ==========================================
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
  queueTrack.innerHTML = "";
  if (state.queue.length === 0) {
    queueTrack.innerHTML = `<div class="queue-empty-msg">Queue is empty. Enqueue a registered vehicle.</div>`;
    dequeueBtn.disabled = true;
    return;
  }

  dequeueBtn.disabled = false;
  state.queue.forEach((v, index) => {
    const item = document.createElement("div");
    item.className = `queue-item ${index === 0 ? "first-in-line" : ""}`;
    const icon = v.type.toLowerCase().includes("fire") ? "🚒" : v.type.toLowerCase().includes("rescue") ? "🚓" : "🚑";
    item.innerHTML = `
      <span>${icon}</span>
      <strong>${v.number}</strong>
      <span class="text-dim">(${index === 0 ? "FRONT" : `#${index + 1}`})</span>
    `;
    queueTrack.appendChild(item);
  });
}

function updateDropdowns() {
  // Destination Dropdown for Dispatch
  const currentDest = dispatchDestSelect.value;
  dispatchDestSelect.innerHTML = `<option value="">Select destination...</option>`;
  state.intersections.forEach(i => {
    const opt = document.createElement("option");
    opt.value = i.id;
    opt.textContent = `${i.id}. ${i.name}`;
    if (state.selectedDestinationId === i.id || currentDest == i.id) opt.selected = true;
    dispatchDestSelect.appendChild(opt);
  });

  // Assign Vehicle Select
  assignVehicleSelect.innerHTML = `<option value="">Select vehicle...</option>`;
  state.vehicles.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v.number;
    opt.textContent = `${v.number} (${v.type}) [Loc: ${v.locationName}]`;
    assignVehicleSelect.appendChild(opt);
  });

  // Assign Location Select
  assignLocationSelect.innerHTML = `<option value="">Select intersection...</option>`;
  state.intersections.forEach(i => {
    const opt = document.createElement("option");
    opt.value = i.id;
    opt.textContent = `${i.id}. ${i.name}`;
    assignLocationSelect.appendChild(opt);
  });

  // Queue Vehicle Select
  queueVehicleSelect.innerHTML = `<option value="">Select vehicle...</option>`;
  state.vehicles.filter(v => !v.inQueue && !v.isBusy).forEach(v => {
    const opt = document.createElement("option");
    opt.value = v.number;
    opt.textContent = `${v.number} (${v.type})`;
    queueVehicleSelect.appendChild(opt);
  });

  // Road Source & Dest Select
  roadSourceSelect.innerHTML = `<option value="">Select source...</option>`;
  roadDestSelect.innerHTML = `<option value="">Select dest...</option>`;
  state.intersections.forEach(i => {
    const opt1 = document.createElement("option");
    opt1.value = i.id;
    opt1.textContent = `${i.id}. ${i.name}`;
    roadSourceSelect.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = i.id;
    opt2.textContent = `${i.id}. ${i.name}`;
    roadDestSelect.appendChild(opt2);
  });
}

function updateFleetTable() {
  fleetTableBody.innerHTML = "";
  if (state.vehicles.length === 0) {
    fleetTableBody.innerHTML = `<tr><td colspan="5" class="text-center">No vehicles registered yet.</td></tr>`;
    return;
  }

  state.vehicles.forEach(v => {
    const tr = document.createElement("tr");
    const icon = v.type.toLowerCase().includes("fire") ? "🚒" : v.type.toLowerCase().includes("rescue") ? "🚓" : "🚑";

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
  intersectionsTableBody.innerHTML = "";
  if (state.intersections.length === 0) {
    intersectionsTableBody.innerHTML = `<tr><td colspan="3" class="text-center">No intersections created.</td></tr>`;
    return;
  }

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

function updateHistoryList() {
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

// ==========================================
// INTERACTIVE CANVAS GRAPH ENGINE
// ==========================================
function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width * window.devicePixelRatio;
  canvas.height = rect.height * window.devicePixelRatio;
  canvasWidth = rect.width;
  canvasHeight = rect.height;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  calculateNodeCoordinates();
}

window.addEventListener("resize", resizeCanvas);

function calculateNodeCoordinates() {
  const n = state.intersections.length;
  if (n === 0) return;

  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  // Predefined appealing coordinates for 7 nodes demo
  const presetOffsets = [
    { x: -0.32, y: -0.25 }, // 0: Hospital (Top-Left)
    { x: -0.32, y: 0.28 },  // 1: Fire Station (Bottom-Left)
    { x: 0.0, y: 0.0 },     // 2: City Center (Center)
    { x: 0.08, y: -0.32 },  // 3: North Junction (Top)
    { x: 0.35, y: -0.15 },  // 4: East District (Top-Right)
    { x: 0.15, y: 0.32 },   // 5: South Hub (Bottom-Right)
    { x: 0.38, y: 0.28 }    // 6: Rescue Command (Far Bottom-Right)
  ];

  nodePositions = {};
  state.intersections.forEach((intersection, idx) => {
    let px, py;
    if (idx < presetOffsets.length && n <= 7) {
      px = centerX + presetOffsets[idx].x * canvasWidth;
      py = centerY + presetOffsets[idx].y * canvasHeight;
    } else {
      // Circular layout for general graphs
      const angle = (idx / n) * 2 * Math.PI - Math.PI / 2;
      const radius = Math.min(canvasWidth, canvasHeight) * 0.38;
      px = centerX + radius * Math.cos(angle);
      py = centerY + radius * Math.sin(angle);
    }
    nodePositions[intersection.id] = {
      x: Math.max(50, Math.min(canvasWidth - 50, px)),
      y: Math.max(50, Math.min(canvasHeight - 50, py)),
      name: intersection.name,
      id: intersection.id
    };
  });
}

function drawGraph() {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // 1. Draw Road Edges
  state.roads.forEach(road => {
    const p1 = nodePositions[road.source];
    const p2 = nodePositions[road.destination];
    if (!p1 || !p2) return;

    // Check if this road is part of active shortest path or green corridor
    const isPathEdge = isEdgeInPath(road.source, road.destination, state.activePathHighlight);
    const isCorridor = isPathEdge && state.signal.state === "GREEN";

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);

    if (isCorridor) {
      // Glowing green corridor
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 5;
      ctx.shadowColor = "#10b981";
      ctx.shadowBlur = 15;
    } else if (isPathEdge) {
      // Glowing Dijkstra path
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 4;
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 12;
    } else {
      // Normal road
      ctx.strokeStyle = "#253347";
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 0;
    }

    ctx.stroke();
    ctx.shadowBlur = 0; // reset

    // Distance Label on Road
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    drawDistanceTag(midX, midY, `${road.distance} km`, isPathEdge);
  });

  // 2. Draw Nodes (Intersections)
  state.intersections.forEach(intersection => {
    const pos = nodePositions[intersection.id];
    if (!pos) return;

    const isHovered = hoveredNodeId === intersection.id;
    const isSelected = state.selectedDestinationId === intersection.id;
    const isInPath = state.activePathHighlight && state.activePathHighlight.includes(intersection.id);

    // Node Outer Glow
    ctx.beginPath();
    const radius = isSelected ? 22 : isHovered ? 20 : 17;
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);

    if (isSelected) {
      ctx.fillStyle = "#ef4444";
      ctx.shadowColor = "#ef4444";
      ctx.shadowBlur = 20;
    } else if (isInPath) {
      ctx.fillStyle = state.signal.state === "GREEN" ? "#10b981" : "#0284c7";
      ctx.shadowColor = state.signal.state === "GREEN" ? "#10b981" : "#38bdf8";
      ctx.shadowBlur = 15;
    } else {
      ctx.fillStyle = "#1e293b";
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 6;
    }

    ctx.fill();
    ctx.strokeStyle = isSelected ? "#fff" : isInPath ? "#7dd3fc" : "#475569";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Node Icon / ID inside
    ctx.fillStyle = "#fff";
    ctx.font = "bold 11px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(intersection.id, pos.x, pos.y);

    // Intersection Label text underneath
    ctx.font = "600 11px 'Inter', sans-serif";
    ctx.fillStyle = isSelected ? "#fca5a5" : isInPath ? "#bae6fd" : "#cbd5e1";
    ctx.fillText(pos.name, pos.x, pos.y + radius + 14);

    // Vehicles stationed at this node
    const stationedVehicles = state.vehicles.filter(v => v.locationId === intersection.id && !v.isBusy);
    if (stationedVehicles.length > 0) {
      drawStationedVehicleIcons(pos.x, pos.y - radius - 12, stationedVehicles);
    }
  });

  // 3. Draw Moving Simulated Vehicle
  if (state.animatingVehicle) {
    drawAnimatedVehicleSprite(state.animatingVehicle);
  }

  requestAnimationFrame(drawGraph);
}

function isEdgeInPath(u, v, path) {
  if (!path || path.length < 2) return false;
  for (let i = 0; i < path.length - 1; i++) {
    if ((path[i] === u && path[i + 1] === v) || (path[i] === v && path[i + 1] === u)) {
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
  ctx.roundRect(x - w / 2, y - h / 2, w, h, 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = isHighlight ? "#fbbf24" : "#94a3b8";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawStationedVehicleIcons(x, y, vehicles) {
  const iconStr = vehicles.map(v => {
    return v.type.toLowerCase().includes("fire") ? "🚒" : v.type.toLowerCase().includes("rescue") ? "🚓" : "🚑";
  }).join("");

  ctx.save();
  ctx.font = "13px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(iconStr, x, y);
  ctx.restore();
}

function drawAnimatedVehicleSprite(av) {
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

  const icon = av.type.toLowerCase().includes("fire") ? "🚒" : av.type.toLowerCase().includes("rescue") ? "🚓" : "🚑";
  ctx.font = "14px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(icon, av.x, av.y);

  // Label tag above vehicle
  ctx.font = "bold 10px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#fff";
  ctx.fillText(av.vehicleNumber, av.x, av.y - 22);

  ctx.restore();
}

// Canvas Mouse Events: Click on Node to set Destination
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  let found = null;
  for (const id in nodePositions) {
    const pos = nodePositions[id];
    const dist = Math.hypot(pos.x - mouseX, pos.y - mouseY);
    if (dist <= 22) {
      found = parseInt(id);
      break;
    }
  }
  hoveredNodeId = found;
  canvas.style.cursor = found !== null ? "pointer" : "default";
});

canvas.addEventListener("click", (e) => {
  if (hoveredNodeId !== null) {
    state.selectedDestinationId = hoveredNodeId;
    dispatchDestSelect.value = hoveredNodeId;
    showToast(`Destination selected: #${hoveredNodeId} (${nodePositions[hoveredNodeId].name})`, "info");
    renderUI();
  }
});

resetMapZoomBtn.addEventListener("click", () => {
  calculateNodeCoordinates();
  showToast("Map view centered", "info");
});

// ==========================================
// ACTIONS & HANDLERS
// ==========================================

// Preload Demo City
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

// Emergency Dispatch
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
    // Client-side simulation
    const suitableVehicles = state.vehicles.filter(v => {
      if (v.isBusy) return false;
      const vt = v.type.toLowerCase();
      const em = type.toLowerCase();
      if (em === "medical") return vt.includes("ambulance");
      if (em === "fire") return vt.includes("fire");
      if (em === "rescue") return vt.includes("rescue");
      return false;
    });

    if (suitableVehicles.length === 0) {
      showToast(`No available ${type} vehicles in fleet!`, "danger");
      return;
    }

    // Find nearest suitable vehicle using Dijkstra
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
    state.history.unshift(`Dispatched ${type} vehicle ${bestVehicle.number} to ${state.intersections[destId].name}`);
    handleDispatchSuccess(result, type, destId);
    renderUI();
  }
});

function handleDispatchSuccess(result, type, destId) {
  state.activePathHighlight = result.path;
  const srcName = state.intersections.find(i => i.id === result.source)?.name || `#${result.source}`;
  const destName = state.intersections.find(i => i.id === destId)?.name || `#${destId}`;

  resultDistance.textContent = `${result.distance} km`;
  resultVehicle.textContent = result.vehicleNumber;
  resultEmergencyType.textContent = type;
  resultSource.textContent = srcName;
  resultDest.textContent = destName;

  resultPathFlow.innerHTML = result.path.map((nodeId, idx) => {
    const name = state.intersections.find(i => i.id === nodeId)?.name || `#${nodeId}`;
    return `<span class="path-node">${name}</span>${idx < result.path.length - 1 ? '<span class="path-arrow">➔</span>' : ''}`;
  }).join("");

  dispatchResultBox.classList.remove("hidden");
  showToast(`Vehicle ${result.vehicleNumber} dispatched via shortest route (${result.distance} km)!`, "success");
}

// Simulate Route Animation
btnSimulateRoute.addEventListener("click", async () => {
  const vehicleNum = resultVehicle.textContent;
  if (!vehicleNum || !state.activePathHighlight) return;

  const vehicleObj = state.vehicles.find(v => v.number === vehicleNum) || { vehicleNumber: vehicleNum, type: resultEmergencyType.textContent };

  // 1. Activate green corridor
  state.signal.state = "GREEN";
  state.signal.isEmergency = true;
  updateTrafficLight();

  // 2. Start Canvas Animation
  simBanner.classList.remove("hidden");
  simVehicleTitle.textContent = `Vehicle ${vehicleNum} En Route`;
  simStatusSub.textContent = `Green Corridor active • Driving through ${state.activePathHighlight.length} intersections...`;

  const path = [...state.activePathHighlight];
  const totalSteps = path.length - 1;
  let currentStep = 0;

  function animateStep() {
    if (currentStep >= totalSteps) {
      // Completed route!
      state.animatingVehicle = null;
      simBanner.classList.add("hidden");
      state.signal.state = "RED";
      state.signal.isEmergency = false;

      // Update vehicle location to destination
      const destId = path[path.length - 1];
      const vehicle = state.vehicles.find(v => v.number === vehicleNum);
      if (vehicle) {
        vehicle.locationId = destId;
        vehicle.locationName = state.intersections.find(i => i.id === destId)?.name || `#${destId}`;
        vehicle.isBusy = false;
      }

      state.activePathHighlight = null;
      dispatchResultBox.classList.add("hidden");
      showToast(`Vehicle ${vehicleNum} reached destination successfully! Dispatch complete.`, "success");

      // Notify backend if online
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

    let t = 0;
    const duration = 1200; // ms per road segment
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
      simProgressFill.style.width = `${overallProgress}%`;

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

// Signal Controls
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

// Dequeue Front Vehicle
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

// Register Vehicle
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

// Set Location
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

// Enqueue Vehicle
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

// Remove Vehicle
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

// Add Intersection
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

// Add Road
addRoadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const src = parseInt(roadSourceSelect.value);
  const dest = parseInt(roadDestSelect.value);
  const dist = parseInt(roadDistInput.value);

  if (isNaN(src) || isNaN(dest) || isNaN(dist) || src === dest || dist <= 0) {
    showToast("Invalid road details", "warning");
    return;
  }

  if (state.isBackendConnected) {
    try {
      await apiCall("/api/network/add-road", "POST", { source: src, destination: dest, distance: dist });
      showToast("Road added successfully!", "success");
      roadDistInput.value = "";
      syncSystemState();
    } catch (err) {
      showToast(err.message, "danger");
    }
  } else {
    state.roads.push({ source: src, destination: dest, distance: dist });
    state.history.unshift(`Added road between #${src} and #${dest} (${dist} km)`);
    roadDistInput.value = "";
    showToast("Road added successfully!", "success");
    renderUI();
  }
});

// ==========================================
// STARTUP BOOTSTRAP
// ==========================================
window.addEventListener("DOMContentLoaded", () => {
  resizeCanvas();
  initFallbackDataIfEmpty();
  renderUI();
  drawGraph();

  // Initial sync with backend
  syncSystemState();

  // Periodic polling every 2s for backend synchronization
  setInterval(() => {
    syncSystemState();
  }, 2000);
});
