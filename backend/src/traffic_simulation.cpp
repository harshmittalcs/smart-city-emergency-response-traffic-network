
#include <iostream>
#include "TrafficSimulation.h"

TrafficSimulation::TrafficSimulation(
    RoadNetwork& roadNetwork,
    EmergencyDispatch& emergencyDispatch,
    TrafficSignal& trafficSignal,
    TrafficActionStack& actionHistory)
    : network(roadNetwork),
      dispatch(emergencyDispatch),
      signal(trafficSignal),
      history(actionHistory)
{
}

void TrafficSimulation::simulateEmergencyRoute(
    const DispatchResult& result)
{
    if (!result.success || !result.route.found)
    {
        std::cout << "No valid dispatch available for simulation.\n";
        return;
    }

    if (!dispatch.isVehicleBusy(result.vehicleNumber))
    {
        std::cout << "This dispatch is no longer active.\n";
        return;
    }

    std::cout << "\n===== EMERGENCY ROUTE SIMULATION =====\n";
    std::cout << "Vehicle: " << result.vehicleNumber << '\n';

    signal.setEmergency(true);
    signal.givePriority();

    history.push(
        "Green corridor activated for " + result.vehicleNumber);

    for (int i = 0; i < static_cast<int>(result.route.path.size()); i++)
    {
        int intersection = result.route.path[i];

        std::string location = network.getIntersectionName(intersection);

        std::cout << "Vehicle " << result.vehicleNumber
                  << " reached " << location << '\n';

        history.push(
            "Vehicle " + result.vehicleNumber + " reached " + location);
    }

    signal.resetSignal();

    dispatch.completeDispatch(result.vehicleNumber);
    dispatch.setVehicleLocation(
        result.vehicleNumber, result.destination);

    history.push(
        "Emergency dispatch completed for " + result.vehicleNumber);

    std::cout << "Vehicle reached its destination successfully.\n";
}
