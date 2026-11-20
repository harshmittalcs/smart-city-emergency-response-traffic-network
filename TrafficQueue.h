
#ifndef TRAFFIC_QUEUE_H
#define TRAFFIC_QUEUE_H

#include "EmergencyVehicle.h"

class TrafficQueue
{
private:
    EmergencyVehicle* front;
    EmergencyVehicle* rear;

public:
    TrafficQueue();

    bool isInQueue(EmergencyVehicle* vehicle);
    bool enqueue(EmergencyVehicle* vehicle);
    EmergencyVehicle* dequeue();
    void display();
    int queueSize();
};

#endif
