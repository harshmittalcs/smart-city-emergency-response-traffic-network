
#ifndef TRAFFIC_SIMULATION_H
#define TRAFFIC_SIMULATION_H

#include <string>
#include "RoadNetwork.h"
#include "EmergencyDispatch.h"
#include "TrafficSignal.h"
#include "TrafficActionStack.h"

class TrafficSimulation
{
private:
    RoadNetwork& network;
    EmergencyDispatch& dispatch;
    TrafficSignal& signal;
    TrafficActionStack& history;

public:
    TrafficSimulation(
        RoadNetwork& roadNetwork,
        EmergencyDispatch& emergencyDispatch,
        TrafficSignal& trafficSignal,
        TrafficActionStack& actionHistory
    );

    void simulateEmergencyRoute(const DispatchResult& result);
};

#endif
