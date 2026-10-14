
#ifndef EMERGENCY_VEHICLE_LIST_H
#define EMERGENCY_VEHICLE_LIST_H

#include <string>
#include "EmergencyVehicle.h"

class TrafficQueue;

class EmergencyVehicleList
{
private:
    EmergencyVehicle* head;

public:
    EmergencyVehicleList();
    ~EmergencyVehicleList();

    EmergencyVehicle* addVehicle(std::string number, std::string type);
    void displayVehicles();
    EmergencyVehicle* searchVehicle(std::string number);
    void removeVehicle(std::string number, TrafficQueue& queue);
};

#endif
