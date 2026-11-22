#ifndef WEB_SERVER_H
#define WEB_SERVER_H

#include <vector>
#include <string>
#include "EmergencyVehicleList.h"
#include "TrafficQueue.h"
#include "TrafficSignal.h"
#include "TrafficActionStack.h"
#include "RoadNetwork.h"
#include "ShortestPath.h"
#include "EmergencyDispatch.h"
#include "TrafficSimulation.h"

class WebServer
{
private:
    EmergencyVehicleList& vehicles;
    TrafficQueue& queue;
    TrafficSignal& signal;
    TrafficActionStack& history;
    RoadNetwork& network;
    ShortestPath& shortestPath;
    EmergencyDispatch& dispatch;
    TrafficSimulation& simulation;
    std::vector<DispatchResult>& activeDispatches;

    std::string escapeJson(const std::string& input);
    std::string getSystemStatusJson();
    std::string handleApiRequest(const std::string& method, const std::string& path, const std::string& body);
    std::string readFileContent(const std::string& filepath);

public:
    WebServer(
        EmergencyVehicleList& v,
        TrafficQueue& q,
        TrafficSignal& s,
        TrafficActionStack& h,
        RoadNetwork& n,
        ShortestPath& sp,
        EmergencyDispatch& d,
        TrafficSimulation& sim,
        std::vector<DispatchResult>& dispatches
    );

    void loadSampleData();
    void start(int port = 8080);
};

#endif
