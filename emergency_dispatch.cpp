
#include <iostream>
#include <limits>
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

DispatchResult EmergencyDispatch::dispatchVehicle(int destination)
{
    DispatchResult result;

    if (!network.isValidIntersection(destination))
    {
        std::cout << "Invalid destination.\n";
        return result;
    }

    int minimumDistance = std::numeric_limits<int>::max();

    for (const auto& entry : vehicleLocations)
    {
        const std::string& number = entry.first;
        int source = entry.second;

        if (vehicles.searchVehicle(number) == nullptr ||
            isVehicleBusy(number))
        {
            continue;
        }

        PathResult route =
            shortestPath.dijkstra(network, source, destination);

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
        std::cout << "No available vehicle can reach the destination.\n";
        return result;
    }

    busyVehicles.insert(result.vehicleNumber);

    std::cout << "\n===== EMERGENCY DISPATCH =====\n";
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

    std::cout << "Dispatch completed for vehicle "
              << number << ".\n";

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
        {
            continue;
        }

        std::cout << "Vehicle: " << entry.first
                  << " | Location: "
                  << network.getIntersectionName(entry.second)
                  << " | Status: "
                  << (isVehicleBusy(entry.first) ? "BUSY" : "AVAILABLE")
                  << '\n';
    }
}
