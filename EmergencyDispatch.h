
#ifndef EMERGENCY_DISPATCH_H
#define EMERGENCY_DISPATCH_H

#include <string>
#include <unordered_map>
#include <unordered_set>
#include "EmergencyVehicleList.h"
#include "ShortestPath.h"

struct DispatchResult
{
    std::string vehicleNumber;
    std::string emergencyType;
    int source;
    int destination;
    PathResult route;
    bool success;

    DispatchResult();
};

class EmergencyDispatch
{
private:
    EmergencyVehicleList& vehicles;
    RoadNetwork& network;
    ShortestPath shortestPath;
    std::unordered_map<std::string, int> vehicleLocations;
    std::unordered_set<std::string> busyVehicles;

    bool isSuitableVehicle(
        const std::string& vehicleType,
        const std::string& emergencyType) const;

public:
    EmergencyDispatch(
        EmergencyVehicleList& vehicleList,
        RoadNetwork& roadNetwork);

    bool setVehicleLocation(std::string number, int intersection);
    DispatchResult dispatchVehicle(
        int destination, std::string emergencyType);
    bool completeDispatch(std::string number);
    bool isVehicleBusy(std::string number) const;
    bool isVehicleAssigned(std::string number) const;
    void removeVehicleLocation(std::string number);
    void displayVehicleLocations() const;
};

#endif
