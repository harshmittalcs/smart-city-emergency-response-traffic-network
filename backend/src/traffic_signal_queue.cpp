
#include <iostream>
#include "TrafficQueue.h"

TrafficQueue::TrafficQueue()
{
    front = nullptr;
    rear = nullptr;
}

bool TrafficQueue::isInQueue(EmergencyVehicle* vehicle)
{
    EmergencyVehicle* temp = front;

    while (temp != nullptr)
    {
        if (temp == vehicle)
        {
            return true;
        }

        temp = temp->queueNext;
    }

    return false;
}

bool TrafficQueue::enqueue(EmergencyVehicle* vehicle)
{
    if (vehicle == nullptr)
    {
        std::cout << "Invalid vehicle.\n";
        return false;
    }

    if (isInQueue(vehicle))
    {
        std::cout << "Vehicle is already in the queue.\n";
        return false;
    }

    vehicle->queueNext = nullptr;

    if (rear == nullptr)
    {
        front = vehicle;
        rear = vehicle;
    }
    else
    {
        rear->queueNext = vehicle;
        rear = vehicle;
    }

    std::cout << "Vehicle added to traffic queue.\n";
    return true;
}

EmergencyVehicle* TrafficQueue::dequeue()
{
    if (front == nullptr)
    {
        std::cout << "Traffic queue is empty.\n";
        return nullptr;
    }

    EmergencyVehicle* temp = front;
    front = front->queueNext;

    if (front == nullptr)
    {
        rear = nullptr;
    }

    temp->queueNext = nullptr;

    std::cout << "Vehicle " << temp->number
              << " passed the traffic signal.\n";

    return temp;
}

void TrafficQueue::display()
{
    if (front == nullptr)
    {
        std::cout << "Traffic queue is empty.\n";
        return;
    }

    EmergencyVehicle* temp = front;

    std::cout << "\n===== TRAFFIC QUEUE =====\n";

    while (temp != nullptr)
    {
        std::cout << "Vehicle Number: " << temp->number << '\n';
        std::cout << "Vehicle Type: " << temp->type << '\n';
        std::cout << "-------------------------\n";

        temp = temp->queueNext;
    }
}

int TrafficQueue::queueSize()
{
    int count = 0;
    EmergencyVehicle* temp = front;

    while (temp != nullptr)
    {
        count++;
        temp = temp->queueNext;
    }

    return count;
}
