# Smart City Emergency Response & Traffic Network

A data-structure-based system designed to improve emergency vehicle response by enabling efficient route selection and intelligent traffic management.

---

## 🌟 Interactive Web Dashboard & Real-Time Simulation

An interactive Web Frontend dashboard has been integrated with the C++ Data Structures backend:
- **Interactive City Map**: Built with HTML5 Canvas, visualizing intersections (nodes) and roads (weighted edges).
- **Dijkstra Shortest Path Highlighting**: Computes the optimal emergency route in real time.
- **Green Corridor Simulation**: Automatically changes traffic signals to GREEN along the route and animates the vehicle sprite moving node-by-node.
- **FIFO Traffic Queue**: Live visual waiting line at the traffic intersection.
- **LIFO Action Stack**: Real-time audit history of every operation.

---

## 🚀 How to Run the Project

### Option 1: One-Click Web Mode
Double-click `run_web.bat` or run:
```powershell
g++ -std=c++17 -Ibackend/include backend/src/*.cpp -o pbl_smart.exe -lws2_32
.\pbl_smart.exe --web
```
This automatically starts the server and opens `http://localhost:8080/` in your browser.

### Option 2: Console Menu Mode
Double-click `run_console.bat` or run:
```powershell
.\pbl_smart.exe
```

### Option 3: Direct In-Browser View
Double-click `frontend/index.html` (or `index.html`) to open directly in Google Chrome or Microsoft Edge.

---

📌 Project Overview

In urban areas, emergency vehicles such as ambulances, fire engines, and police vehicles can be delayed by traffic congestion and inefficient route selection.

The **Smart City Emergency Response & Traffic Network** aims to model a city's road network and develop efficient methods for emergency vehicles to reach their destinations while considering the changing traffic conditions.

The project is being developed incrementally as part of the **Project-Based Learning (PBL)** curriculum.

🎯 Objectives

* Represent the city road network using suitable data structures.
* Efficiently find routes between locations.
* Reduce response time for emergency vehicles.
* Model traffic conditions on roads.
* Provide a foundation for future intelligent traffic management.
* Apply Data Structures and Algorithms to a real-world problem.

🧠 Data Structures & Algorithms

The project makes use of concepts from the Data Structures curriculum, including:

* Arrays & Vectors
* Linked Lists (`EmergencyVehicleList`)
* Stacks (`TrafficActionStack`)
* Queues (`TrafficQueue`)
* Graphs & Adjacency Lists (`RoadNetwork`)
* Priority Queue & Dijkstra's Algorithm (`ShortestPath`)
* Hash Maps & Sets (`EmergencyDispatch`)

📚 Phase 1 — Research & Analysis

Phase 1 focuses primarily on understanding the problem domain, studying existing approaches, and identifying suitable data structures and algorithms for the proposed system.

Phase 1 Activities

* Problem identification
* Literature review
* Study of existing emergency traffic management approaches
* Comparative analysis of selected research papers
* Identification of suitable data structures
* Initial system planning
* Definition of future development scope

  🧩 Phase 2 — Design & Module Development

Phase 2 turns the Phase 1 idea into a buildable design: a software simulation split into nine modules, each tied to a data structure.

Phase 2 Activities
Reworked the architecture into nine modules
Mapped each module to a data structure
Defined the road network model and congestion-weighted edges
Defined the signal priority rule
Started coding the graph and shortest-path modules


🛠️ Phase 3 — Integration, Front End & Testing

Phase 3 moves from design to a working program, with all modules integrated and a web dashboard added.

Phase 3 Activities
Implemented and integrated all nine modules
Added the web dashboard
Created sample road layouts and traffic scenarios
Tested the data structures, shortest path and full flow
Normal vs. optimized comparison in progress

🛠️ Technology

The implementation is built using:

* C++17
* Data Structures & Algorithms
* HTML5, CSS3, JavaScript (Frontend Dashboard)
* Winsock2 (Embedded Web Server & REST API)
* Git & GitHub

👥 Team

Team ID: DSCPP-III-2026-T230

Section: A, G, E

👨‍🏫 Mentor

Mr. Rohan Verma

📁 Repository Structure
smart-city-emergency-response-traffic-network/
│
├── backend/
│   ├── include/
│   │   ├── EmergencyDispatch.h
│   │   ├── EmergencyVehicle.h
│   │   ├── EmergencyVehicleList.h
│   │   ├── RoadNetwork.h
│   │   ├── ShortestPath.h
│   │   ├── TrafficActionStack.h
│   │   ├── TrafficQueue.h
│   │   ├── TrafficSignal.h
│   │   ├── TrafficSimulation.h
│   │   └── WebServer.h
│   └── src/
│       ├── emergency_dispatch.cpp
│       ├── emergency_vehicle.cpp
│       ├── main.cpp
│       ├── road_network.cpp
│       ├── shortest_path.cpp
│       ├── traffic_action_stack.cpp
│       ├── traffic_priority.cpp
│       ├── traffic_signal_queue.cpp
│       ├── traffic_simulation.cpp
│       └── web_server.cpp
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
│
├── docs/
│   ├── Phase-1/
│   │   ├── finalppt_phase1.pdf
│   │   └── finalreport_phase1.pdf
│   ├── Phase-2/
│   │   ├── finalppt_phase2.pdf
│   │   └── finalreport_phase2.pdf
│   └── Phase-3/
│       ├── finalppt_phase3.pdf
│       └── finalreport_phase3.pdf
│
├── .vscode/
│   ├── tasks.json
│   ├── launch.json
│   └── c_cpp_properties.json
│
├── compile_and_run.bat
├── run_web.bat
├── run_console.bat
└── README.md
