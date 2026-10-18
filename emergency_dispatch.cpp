

#include <iostream>
#include <limits>
#include <cctype>
#include "EmergencyDispatch.h"

DispatchResult::DispatchResult()
{
    source = -1;
    destination = -1;
    success = false;
}

EmergencyDispatch::EmergencyDispatch(
    EmergencyVehicleList& vehicleList, RoadNetwork& roadNetwork)
    : vehicles(vehicleList), network(roadNetwork)
{
}

bool EmergencyDispatch::isSuitableVehicle(
    const std::string& vehicleType,
    const std::string& emergencyType) const
{
    std::string type = vehicleType;
    std::string emergency = emergencyType;

    for (char& c : type)
        c = static_cast<char>(std::tolower(static_cast<unsigned char>(c)));

    for (char& c : emergency)
        c = static_cast<char>(std::tolower(static_cast<unsigned char>(c)));

    if (emergency == "medical")
        return type.find("ambulance") != std::string::npos;

    if (emergency == "fire")
        return type.find("fire") != std::string::npos;

    if (emergency == "rescue")
        return type.find("rescue") != std::string::npos;

    return false;
}

bool EmergencyDispatch::setVehicleLocation(
    std::string number, int intersection)
{
    if (vehicles.searchVehicle(number) == nullptr)
    {
        std::cout << "Vehicle is not registered.\n";
        return false;
    }

    if (!network.isValidIntersection(intersection))
    {
        std::cout << "Invalid intersection.\n";
        return false;
    }

    if (isVehicleBusy(number))
    {
        std::cout << "Vehicle is currently on an emergency dispatch.\n";
        return false;
    }

    vehicleLocations[number] = intersection;
    std::cout << "Vehicle location updated successfully.\n";
    return true;
}

DispatchResult EmergencyDispatch::dispatchVehicle(
    int destination, std::string emergencyType)
{
    DispatchResult result;
    result.emergencyType = emergencyType;

    if (!network.isValidIntersection(destination))
    {
        std::cout << "Invalid destination.\n";
        return result;
    }

    std::string emergency = emergencyType;

    for (char& c : emergency)
        c = static_cast<char>(std::tolower(static_cast<unsigned char>(c)));

    if (emergency != "medical" &&
        emergency != "fire" &&
        emergency != "rescue")
    {
        std::cout << "Invalid emergency type. Enter Medical, Fire, or Rescue.\n";
        return result;
    }

    int minimumDistance = std::numeric_limits<int>::max();

    for (const auto& entry : vehicleLocations)
    {
        const std::string& number = entry.first;
        int source = entry.second;

        EmergencyVehicle* vehicle = vehicles.searchVehicle(number);

        if (vehicle == nullptr || isVehicleBusy(number))
            continue;

        if (!isSuitableVehicle(vehicle->type, emergency))
            continue;

        PathResult route = shortestPath.dijkstra(network, source, destination);

        if (route.found && route.distance < minimumDistance)
        {
            minimumDistance = route.distance;
            result.vehicleNumber = number;
            result.source = source;
            result.destination = destination;
            result.route = route;
            result.success = true;
        }
    }

    if (!result.success)
    {
        std::cout << "No available suitable vehicle can reach the destination.\n";
        return result;
    }

    busyVehicles.insert(result.vehicleNumber);

    std::cout << "\n===== EMERGENCY DISPATCH =====\n";
    std::cout << "Emergency Type: " << emergencyType << '\n';
    std::cout << "Assigned Vehicle: " << result.vehicleNumber << '\n';
    std::cout << "Starting Location: "
              << network.getIntersectionName(result.source) << '\n';
    std::cout << "Destination: "
              << network.getIntersectionName(result.destination) << '\n';

    shortestPath.displayPath(network, result.route);

    return result;
}

bool EmergencyDispatch::completeDispatch(std::string number)
{
    if (!isVehicleBusy(number))
    {
        std::cout << "Vehicle has no active dispatch.\n";
        return false;
    }

    busyVehicles.erase(number);
    std::cout << "Dispatch completed for vehicle " << number << ".\n";
    return true;
}

bool EmergencyDispatch::isVehicleBusy(std::string number) const
{
    return busyVehicles.find(number) != busyVehicles.end();
}

bool EmergencyDispatch::isVehicleAssigned(std::string number) const
{
    return vehicleLocations.find(number) != vehicleLocations.end();
}

void EmergencyDispatch::removeVehicleLocation(std::string number)
{
    if (isVehicleBusy(number))
    {
        std::cout << "Cannot remove location during active dispatch.\n";
        return;
    }

    vehicleLocations.erase(number);
}

void EmergencyDispatch::displayVehicleLocations() const
{
    if (vehicleLocations.empty())
    {
        std::cout << "No vehicle locations assigned.\n";
        return;
    }

    std::cout << "\n===== VEHICLE LOCATIONS =====\n";

    for (const auto& entry : vehicleLocations)
    {
        if (vehicles.searchVehicle(entry.first) == nullptr)
            continue;

        std::cout << "Vehicle: " << entry.first
                  << " | Location: "
                  << network.getIntersectionName(entry.second)
                  << " | Status: "
                  << (isVehicleBusy(entry.first) ? "BUSY" : "AVAILABLE")
                  << '\n';
    }
}
