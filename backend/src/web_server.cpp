#include <winsock2.h>
#include <ws2tcpip.h>
#include <windows.h>
#include <iostream>
#include <sstream>
#include <fstream>
#include <algorithm>
#include "WebServer.h"

WebServer::WebServer(
    EmergencyVehicleList& v,
    TrafficQueue& q,
    TrafficSignal& s,
    TrafficActionStack& h,
    RoadNetwork& n,
    ShortestPath& sp,
    EmergencyDispatch& d,
    TrafficSimulation& sim,
    std::vector<DispatchResult>& dispatches
)
    : vehicles(v),
      queue(q),
      signal(s),
      history(h),
      network(n),
      shortestPath(sp),
      dispatch(d),
      simulation(sim),
      activeDispatches(dispatches)
{
}

std::string WebServer::escapeJson(const std::string& input)
{
    std::string output;
    for (char c : input)
    {
        if (c == '"') output += "\\\"";
        else if (c == '\\') output += "\\\\";
        else if (c == '\b') output += "\\b";
        else if (c == '\f') output += "\\f";
        else if (c == '\n') output += "\\n";
        else if (c == '\r') output += "\\r";
        else if (c == '\t') output += "\\t";
        else output += c;
    }
    return output;
}

static std::string extractJsonField(const std::string& json, const std::string& field)
{
    std::string needle = "\"" + field + "\"";
    size_t pos = json.find(needle);
    if (pos == std::string::npos) return "";

    pos += needle.length();
    while (pos < json.length() && (json[pos] == ' ' || json[pos] == ':' || json[pos] == '\t'))
    {
        pos++;
    }

    if (pos >= json.length()) return "";

    if (json[pos] == '"')
    {
        pos++;
        size_t endPos = json.find('"', pos);
        if (endPos == std::string::npos) return "";
        return json.substr(pos, endPos - pos);
    }
    else
    {
        size_t endPos = pos;
        while (endPos < json.length() && json[endPos] != ',' && json[endPos] != '}' && json[endPos] != '\r' && json[endPos] != '\n')
        {
            endPos++;
        }
        std::string val = json.substr(pos, endPos - pos);
        val.erase(std::remove_if(val.begin(), val.end(), ::isspace), val.end());
        return val;
    }
}

std::string WebServer::readFileContent(const std::string& filepath)
{
    std::ifstream file(filepath, std::ios::binary);
    if (!file.is_open())
    {
        std::ifstream file2("frontend/" + filepath, std::ios::binary);
        if (!file2.is_open()) return "";
        std::stringstream buffer2;
        buffer2 << file2.rdbuf();
        return buffer2.str();
    }
    std::stringstream buffer;
    buffer << file.rdbuf();
    return buffer.str();
}

void WebServer::loadSampleData()
{
    if (network.getIntersectionCount() == 0)
    {
        network.addIntersection("Central Hospital");     // 0
        network.addIntersection("Fire Station #1");       // 1
        network.addIntersection("City Center");           // 2
        network.addIntersection("North Junction");        // 3
        network.addIntersection("East District");         // 4
        network.addIntersection("South Hub");             // 5
        network.addIntersection("Rescue Command");        // 6

        network.addRoad(0, 2, 4);
        network.addRoad(1, 2, 3);
        network.addRoad(2, 3, 5);
        network.addRoad(2, 4, 6);
        network.addRoad(2, 5, 4);
        network.addRoad(3, 4, 7);
        network.addRoad(4, 5, 5);
        network.addRoad(5, 6, 3);
        network.addRoad(0, 3, 8);
        network.addRoad(1, 6, 6);

        history.push("Loaded City Road Network with 7 intersections");
    }

    if (vehicles.getVehicles().empty())
    {
        EmergencyVehicle* v1 = vehicles.addVehicle("AMB-101", "Ambulance");
        EmergencyVehicle* v2 = vehicles.addVehicle("FIRE-201", "Fire Engine");
        EmergencyVehicle* v3 = vehicles.addVehicle("RESCUE-301", "Rescue Squad");
        EmergencyVehicle* v4 = vehicles.addVehicle("AMB-102", "Ambulance");

        if (v1) dispatch.setVehicleLocation("AMB-101", 0);
        if (v2) dispatch.setVehicleLocation("FIRE-201", 1);
        if (v3) dispatch.setVehicleLocation("RESCUE-301", 6);
        if (v4) dispatch.setVehicleLocation("AMB-102", 2);

        if (v4) queue.enqueue(v4);

        history.push("Sample fleet registered: AMB-101, FIRE-201, RESCUE-301, AMB-102");
    }
}

std::string WebServer::getSystemStatusJson()
{
    std::stringstream ss;
    ss << "{";

    // Signal state
    ss << "\"signal\":{";
    ss << "\"state\":\"" << escapeJson(signal.getSignal()) << "\",";
    ss << "\"isEmergency\":" << (signal.isEmergency() ? "true" : "false");
    ss << "},";

    // Traffic Queue
    std::vector<EmergencyVehicle*> qList = queue.getQueue();
    ss << "\"queue\":[";
    for (size_t i = 0; i < qList.size(); i++)
    {
        if (i > 0) ss << ",";
        ss << "{";
        ss << "\"number\":\"" << escapeJson(qList[i]->number) << "\",";
        ss << "\"type\":\"" << escapeJson(qList[i]->type) << "\"";
        ss << "}";
    }
    ss << "],";

    // All registered vehicles with current location & status
    std::vector<EmergencyVehicle*> vList = vehicles.getVehicles();
    const auto& locations = dispatch.getVehicleLocations();
    const auto& busySet = dispatch.getBusyVehicles();

    ss << "\"vehicles\":[";
    for (size_t i = 0; i < vList.size(); i++)
    {
        if (i > 0) ss << ",";
        std::string num = vList[i]->number;
        int locId = -1;
        std::string locName = "Unassigned";
        auto it = locations.find(num);
        if (it != locations.end())
        {
            locId = it->second;
            locName = network.getIntersectionName(locId);
        }
        bool busy = (busySet.find(num) != busySet.end());
        bool inQ = queue.isInQueue(vList[i]);

        ss << "{";
        ss << "\"number\":\"" << escapeJson(num) << "\",";
        ss << "\"type\":\"" << escapeJson(vList[i]->type) << "\",";
        ss << "\"locationId\":" << locId << ",";
        ss << "\"locationName\":\"" << escapeJson(locName) << "\",";
        ss << "\"isBusy\":" << (busy ? "true" : "false") << ",";
        ss << "\"inQueue\":" << (inQ ? "true" : "false");
        ss << "}";
    }
    ss << "],";

    // Intersections
    const auto& inters = network.getAllIntersections();
    ss << "\"intersections\":[";
    for (size_t i = 0; i < inters.size(); i++)
    {
        if (i > 0) ss << ",";
        ss << "{";
        ss << "\"id\":" << i << ",";
        ss << "\"name\":\"" << escapeJson(inters[i]) << "\"";
        ss << "}";
    }
    ss << "],";

    // Roads
    const auto& roads = network.getAllRoads();
    ss << "\"roads\":[";
    bool firstRoad = true;
    for (size_t u = 0; u < roads.size(); u++)
    {
        for (const auto& edge : roads[u])
        {
            int v = edge.first;
            int dist = edge.second;
            // Record only one direction to prevent duplicate rendering
            if (static_cast<int>(u) < v)
            {
                if (!firstRoad) ss << ",";
                firstRoad = false;
                ss << "{";
                ss << "\"source\":" << u << ",";
                ss << "\"destination\":" << v << ",";
                ss << "\"distance\":" << dist;
                ss << "}";
            }
        }
    }
    ss << "],";

    // Action History
    std::vector<std::string> hist = history.getHistory();
    ss << "\"history\":[";
    for (size_t i = 0; i < hist.size(); i++)
    {
        if (i > 0) ss << ",";
        ss << "\"" << escapeJson(hist[i]) << "\"";
    }
    ss << "],";

    // Active Dispatches
    ss << "\"activeDispatches\":[";
    bool firstDispatch = true;
    for (const auto& ad : activeDispatches)
    {
        if (ad.success && dispatch.isVehicleBusy(ad.vehicleNumber))
        {
            if (!firstDispatch) ss << ",";
            firstDispatch = false;
            ss << "{";
            ss << "\"vehicleNumber\":\"" << escapeJson(ad.vehicleNumber) << "\",";
            ss << "\"emergencyType\":\"" << escapeJson(ad.emergencyType) << "\",";
            ss << "\"source\":" << ad.source << ",";
            ss << "\"destination\":" << ad.destination << ",";
            ss << "\"distance\":" << ad.route.distance << ",";
            ss << "\"path\":[";
            for (size_t p = 0; p < ad.route.path.size(); p++)
            {
                if (p > 0) ss << ",";
                ss << ad.route.path[p];
            }
            ss << "]";
            ss << "}";
        }
    }
    ss << "]";

    ss << "}";
    return ss.str();
}

std::string WebServer::handleApiRequest(const std::string& method, const std::string& path, const std::string& body)
{
    if (method == "GET" && path == "/api/status")
    {
        return "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n" + getSystemStatusJson();
    }

    if (method == "POST" && path == "/api/network/sample-data")
    {
        loadSampleData();
        return "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n{\"success\":true,\"message\":\"Sample data loaded\"}";
    }

    if (method == "POST" && path == "/api/vehicles/add")
    {
        std::string number = extractJsonField(body, "number");
        std::string type = extractJsonField(body, "type");
        if (number.empty() || type.empty())
        {
            return "HTTP/1.1 400 Bad Request\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n{\"success\":false,\"error\":\"Number and type required\"}";
        }
        EmergencyVehicle* v = vehicles.addVehicle(number, type);
        if (v != nullptr)
        {
            history.push("Registered vehicle " + number + " (" + type + ")");
            return "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n{\"success\":true}";
        }
        return "HTTP/1.1 400 Bad Request\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n{\"success\":false,\"error\":\"Vehicle already exists\"}";
    }

    if (method == "POST" && path == "/api/vehicles/remove")
    {
        std::string number = extractJsonField(body, "number");
        if (dispatch.isVehicleBusy(number))
        {
            return "HTTP/1.1 400 Bad Request\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n{\"success\":false,\"error\":\"Cannot remove busy vehicle\"}";
        }
        vehicles.removeVehicle(number, queue);
        dispatch.removeVehicleLocation(number);
        history.push("Removed vehicle " + number);
        return "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n{\"success\":true}";
    }

    if (method == "POST" && path == "/api/vehicles/set-location")
    {
        std::string number = extractJsonField(body, "number");
        std::string locStr = extractJsonField(body, "intersectionId");
        int locId = -1;
        try { locId = std::stoi(locStr); } catch (...) {}

        if (dispatch.setVehicleLocation(number, locId))
        {
            history.push("Assigned " + number + " to " + network.getIntersectionName(locId));
            return "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n{\"success\":true}";
        }
        return "HTTP/1.1 400 Bad Request\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n{\"success\":false,\"error\":\"Failed to set location\"}";
    }

    if (method == "POST" && path == "/api/queue/enqueue")
    {
        std::string number = extractJsonField(body, "number");
        EmergencyVehicle* v = vehicles.searchVehicle(number);
        if (v == nullptr)
        {
            return "HTTP/1.1 400 Bad Request\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n{\"success\":false,\"error\":\"Vehicle not found\"}";
        }
        if (dispatch.isVehicleBusy(number))
        {
            return "HTTP/1.1 400 Bad Request\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n{\"success\":false,\"error\":\"Vehicle is on active dispatch\"}";
        }
        if (queue.enqueue(v))
        {
            history.push("Added vehicle " + number + " to traffic queue");
            return "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n{\"success\":true}";
        }
        return "HTTP/1.1 400 Bad Request\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n{\"success\":false,\"error\":\"Vehicle already in queue\"}";
    }

    if (method == "POST" && path == "/api/queue/dequeue")
    {
        EmergencyVehicle* v = queue.dequeue();
        if (v != nullptr)
        {
            history.push("Vehicle " + v->number + " passed traffic signal");
            return "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n{\"success\":true,\"vehicle\":\"" + escapeJson(v->number) + "\"}";
        }
        return "HTTP/1.1 400 Bad Request\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n{\"success\":false,\"error\":\"Queue is empty\"}";
    }

    if (method == "POST" && path == "/api/signal/priority")
    {
        signal.setEmergency(true);
        signal.givePriority();
        history.push("Green corridor emergency priority activated");
        return "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n{\"success\":true,\"signal\":\"GREEN\"}";
    }

    if (method == "POST" && path == "/api/signal/reset")
    {
        signal.resetSignal();
        history.push("Traffic signal reset to RED");
        return "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n{\"success\":true,\"signal\":\"RED\"}";
    }

    if (method == "POST" && path == "/api/network/add-intersection")
    {
        std::string name = extractJsonField(body, "name");
        if (name.empty())
        {
            return "HTTP/1.1 400 Bad Request\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n{\"success\":false,\"error\":\"Intersection name required\"}";
        }
        int id = network.addIntersection(name);
        history.push("Added intersection " + name + " (ID: " + std::to_string(id) + ")");
        return "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n{\"success\":true,\"id\":" + std::to_string(id) + "}";
    }

    if (method == "POST" && path == "/api/network/add-road")
    {
        int src = -1, dest = -1, dist = -1;
        try {
            src = std::stoi(extractJsonField(body, "source"));
            dest = std::stoi(extractJsonField(body, "destination"));
            dist = std::stoi(extractJsonField(body, "distance"));
        } catch (...) {}

        if (src < 0 || dest < 0 || dist <= 0 || src == dest)
        {
            return "HTTP/1.1 400 Bad Request\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n{\"success\":false,\"error\":\"Invalid road parameters\"}";
        }

        network.addRoad(src, dest, dist);
        history.push("Added road between " + network.getIntersectionName(src) + " and " + network.getIntersectionName(dest) + " (" + std::to_string(dist) + " km)");
        return "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n{\"success\":true}";
    }

    if (method == "POST" && path == "/api/dispatch")
    {
        std::string type = extractJsonField(body, "emergencyType");
        std::string destStr = extractJsonField(body, "destination");
        int dest = -1;
        try { dest = std::stoi(destStr); } catch (...) {}

        DispatchResult result = dispatch.dispatchVehicle(dest, type);
        if (result.success)
        {
            activeDispatches.push_back(result);
            history.push("Dispatched " + type + " emergency vehicle " + result.vehicleNumber + " to " + network.getIntersectionName(dest));

            std::stringstream ss;
            ss << "{\"success\":true,";
            ss << "\"vehicleNumber\":\"" << escapeJson(result.vehicleNumber) << "\",";
            ss << "\"source\":" << result.source << ",";
            ss << "\"destination\":" << result.destination << ",";
            ss << "\"distance\":" << result.route.distance << ",";
            ss << "\"path\":[";
            for (size_t i = 0; i < result.route.path.size(); i++)
            {
                if (i > 0) ss << ",";
                ss << result.route.path[i];
            }
            ss << "]}";

            return "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n" + ss.str();
        }
        return "HTTP/1.1 400 Bad Request\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n{\"success\":false,\"error\":\"No available suitable vehicle can reach destination\"}";
    }

    if (method == "POST" && path == "/api/simulate")
    {
        std::string vehicleNum = extractJsonField(body, "vehicleNumber");
        for (auto& res : activeDispatches)
        {
            if (res.success && res.vehicleNumber == vehicleNum && dispatch.isVehicleBusy(vehicleNum))
            {
                simulation.simulateEmergencyRoute(res);
                return "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n{\"success\":true,\"message\":\"Simulation completed\"}";
            }
        }
        return "HTTP/1.1 400 Bad Request\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n{\"success\":false,\"error\":\"No active dispatch found for this vehicle\"}";
    }

    return "HTTP/1.1 404 Not Found\r\nContent-Type: text/plain\r\n\r\nNot Found";
}

void WebServer::start(int port)
{
    WSADATA wsaData;
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0)
    {
        std::cerr << "Failed to initialize Winsock.\n";
        return;
    }

    SOCKET serverSocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (serverSocket == INVALID_SOCKET)
    {
        std::cerr << "Failed to create socket.\n";
        WSACleanup();
        return;
    }

    sockaddr_in serverAddr;
    memset(&serverAddr, 0, sizeof(serverAddr));
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_addr.s_addr = htonl(INADDR_ANY);
    serverAddr.sin_port = htons(port);

    int opt = 1;
    setsockopt(serverSocket, SOL_SOCKET, SO_REUSEADDR, (const char*)&opt, sizeof(opt));

    if (bind(serverSocket, (sockaddr*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR)
    {
        std::cerr << "Failed to bind socket on port " << port << ".\n" << std::flush;
        closesocket(serverSocket);
        WSACleanup();
        return;
    }

    if (listen(serverSocket, SOMAXCONN) == SOCKET_ERROR)
    {
        std::cerr << "Failed to listen on socket.\n" << std::flush;
        closesocket(serverSocket);
        WSACleanup();
        return;
    }

    // Load sample city if empty
    loadSampleData();

    std::cout << "\n===========================================================\n";
    std::cout << "  SMART CITY EMERGENCY RESPONSE SYSTEM - FRONTEND SERVER\n";
    std::cout << "===========================================================\n";
    std::cout << "  * Running at: http://localhost:" << port << "/\n";
    std::cout << "  * Frontend UI and REST API are ACTIVE!\n";
    std::cout << "  * Press Ctrl+C in this terminal to stop the server.\n";
    std::cout << "===========================================================\n\n" << std::flush;

    // Auto open browser non-blocking via ShellExecute
    std::string webUrl = "http://localhost:" + std::to_string(port);
    ShellExecuteA(NULL, "open", webUrl.c_str(), NULL, NULL, SW_SHOWNORMAL);

    while (true)
    {
        SOCKET clientSocket = accept(serverSocket, NULL, NULL);
        if (clientSocket == INVALID_SOCKET)
        {
            continue;
        }

        char buffer[8192];
        int bytesReceived = recv(clientSocket, buffer, sizeof(buffer) - 1, 0);
        if (bytesReceived <= 0)
        {
            closesocket(clientSocket);
            continue;
        }
        buffer[bytesReceived] = '\0';

        std::string request(buffer, bytesReceived);
        std::istringstream reqStream(request);
        std::string method, path, protocol;
        reqStream >> method >> path >> protocol;

        // Support CORS preflight
        if (method == "OPTIONS")
        {
            std::string corsResponse =
                "HTTP/1.1 204 No Content\r\n"
                "Access-Control-Allow-Origin: *\r\n"
                "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n"
                "Access-Control-Allow-Headers: Content-Type\r\n"
                "Content-Length: 0\r\n\r\n";
            send(clientSocket, corsResponse.c_str(), corsResponse.length(), 0);
            closesocket(clientSocket);
            continue;
        }

        // Extract body
        std::string body = "";
        size_t bodyPos = request.find("\r\n\r\n");
        if (bodyPos != std::string::npos)
        {
            body = request.substr(bodyPos + 4);
        }

        std::string response;

        if (path.rfind("/api/", 0) == 0)
        {
            response = handleApiRequest(method, path, body);
        }
        else
        {
            // Static files
            std::string filename = "index.html";
            std::string contentType = "text/html";

            if (path == "/" || path == "/index.html")
            {
                filename = "index.html";
                contentType = "text/html; charset=utf-8";
            }
            else if (path == "/style.css")
            {
                filename = "style.css";
                contentType = "text/css; charset=utf-8";
            }
            else if (path == "/app.js")
            {
                filename = "app.js";
                contentType = "application/javascript; charset=utf-8";
            }

            std::string content = readFileContent(filename);
            if (!content.empty())
            {
                std::stringstream resp;
                resp << "HTTP/1.1 200 OK\r\n";
                resp << "Content-Type: " << contentType << "\r\n";
                resp << "Content-Length: " << content.length() << "\r\n";
                resp << "Access-Control-Allow-Origin: *\r\n\r\n";
                resp << content;
                response = resp.str();
            }
            else
            {
                response = "HTTP/1.1 404 Not Found\r\nContent-Type: text/plain\r\n\r\nFile Not Found: " + filename;
            }
        }

        send(clientSocket, response.c_str(), response.length(), 0);
        closesocket(clientSocket);
    }

    closesocket(serverSocket);
    WSACleanup();
}
