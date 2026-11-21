# Smart City Emergency Response & Traffic Management System

A Data Structures and Algorithms (DSA) project featuring an interactive Web Frontend Dashboard connected to a C++ simulation engine.

## 🌟 How the Frontend Works (Architecture Overview)

```
+-------------------------------------------------------------------------------+
|                             WEB FRONTEND (UI)                                 |
|  - HTML5 Canvas Road Map (Visualizes City Graph, Intersections & Roads)        |
|  - Real-time Dijkstra Route Animation (Vehicle moving along shortest path)    |
|  - Live Traffic Signal Widget (RED / GREEN glowing corridor)                  |
|  - FIFO Traffic Queue Visualizer (Vehicles waiting at intersection)           |
|  - Emergency Dispatch & Fleet Management Controls                             |
+-------------------------------------------------------------------------------+
                                 ▲              │
                 JSON Data Sync  │              │ HTTP REST Requests
         (e.g., /api/status)     │              │ (e.g., /api/dispatch)
                                 │              ▼
+-------------------------------------------------------------------------------+
|                          C++ BACKEND ENGINE (pbl_smart)                       |
|  - WebServer (Winsock2 HTTP Server & JSON API Handler)                        |
|  - Graph Adjacency List: RoadNetwork (Intersections & Roads)                  |
|  - Shortest Path: Dijkstra's Algorithm using Min-Heap / Priority Queue        |
|  - Linked List: EmergencyVehicleList (Fleet management)                       |
|  - Queue: TrafficQueue (FIFO waiting line at traffic signal)                  |
|  - Stack: TrafficActionStack (LIFO history / audit log)                       |
|  - EmergencyDispatch & TrafficSimulation (Green corridor priority)           |
+-------------------------------------------------------------------------------+
```

---

## 🚀 How to Run the Project

### Option 1: Native C++ Web Server (Recommended)
Compile and launch the C++ program directly in Web mode:
```bash
g++ -std=c++17 *.cpp -o pbl_smart.exe -lws2_32
.\pbl_smart.exe --web
```
This automatically starts the server and opens `http://localhost:8080` in your web browser.

### Option 2: Run via Console Menu
```bash
.\pbl_smart.exe
```
In the menu, enter `20` to start the Web Frontend Server, or use options `1-19` for the traditional terminal interface.

### Option 3: Python Web Runner (Zero Dependencies)
```bash
python server.py
```
Automatically serves the frontend and launches your browser at `http://localhost:8080`.

### Option 4: Direct Offline / Standalone View
Simply double-click [index.html](file:///c:/Users/dhair/pbl_smart/index.html) to open it in Chrome, Edge, or Firefox. The built-in JavaScript simulator will run with full map visualization and client-side Dijkstra calculations!

---

## 📁 Key Project Files

| File | Type | Description |
|---|---|---|
| [index.html](file:///c:/Users/dhair/pbl_smart/index.html) | Frontend | Main dashboard layout, KPI stats, Canvas container, control panels |
| [style.css](file:///c:/Users/dhair/pbl_smart/style.css) | Frontend | High-tech command center dark theme, traffic light glow, animations |
| [app.js](file:///c:/Users/dhair/pbl_smart/app.js) | Frontend | Canvas graph renderer, live Dijkstra animation, REST API client |
| [WebServer.h](file:///c:/Users/dhair/pbl_smart/WebServer.h) | C++ Backend | Embedded Winsock HTTP server interface |
| [web_server.cpp](file:///c:/Users/dhair/pbl_smart/web_server.cpp) | C++ Backend | HTTP request router & JSON serialization for all DSA models |
| [main.cpp](file:///c:/Users/dhair/pbl_smart/main.cpp) | C++ Backend | Main entry point supporting both terminal menu & `--web` flag |
| [RoadNetwork.h](file:///c:/Users/dhair/pbl_smart/RoadNetwork.h) | C++ DSA | Graph representation (Intersections & Roads) |
| [ShortestPath.h](file:///c:/Users/dhair/pbl_smart/ShortestPath.h) | C++ DSA | Dijkstra's algorithm for optimal emergency routes |
| [EmergencyVehicleList.h](file:///c:/Users/dhair/pbl_smart/EmergencyVehicleList.h) | C++ DSA | Singly linked list storing registered vehicles |
| [TrafficQueue.h](file:///c:/Users/dhair/pbl_smart/TrafficQueue.h) | C++ DSA | FIFO queue managing vehicles waiting at traffic light |
| [TrafficActionStack.h](file:///c:/Users/dhair/pbl_smart/TrafficActionStack.h) | C++ DSA | LIFO stack recording activity audit trail |
