#ifndef EMERGENCY_VEHICLE_H
#define EMERGENCY_VEHICLE_H

#include <string>

struct EmergencyVehicle
{
    std::string number;
    std::string type;

    EmergencyVehicle* vehicleNext;

    EmergencyVehicle* queueNext;

    EmergencyVehicle(std::string n = "", std::string t = "")
    {
        number = n;
        type = t;

        vehicleNext = nullptr;
        queueNext = nullptr;
    }
};

#endif