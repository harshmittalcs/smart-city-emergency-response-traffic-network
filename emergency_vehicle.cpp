
#include <iostream>
#include "EmergencyVehicleList.h"
#include "TrafficQueue.h"

EmergencyVehicleList::EmergencyVehicleList()
{
    head = nullptr;
}

EmergencyVehicleList::~EmergencyVehicleList()
{
    EmergencyVehicle* temp = head;

    while (temp != nullptr)
    {
        EmergencyVehicle* next = temp->vehicleNext;
        delete temp;
        temp = next;
    }

    head = nullptr;
}

EmergencyVehicle* EmergencyVehicleList::addVehicle(
    std::string number, std::string type)
{
    if (searchVehicle(number) != nullptr)
    {
        std::cout << "Vehicle number already registered.\n";
        return nullptr;
    }

    EmergencyVehicle* newVehicle =
        new EmergencyVehicle(number, type);

    if (head == nullptr)
    {
        head = newVehicle;
    }
    else
    {
        EmergencyVehicle* temp = head;

        while (temp->vehicleNext != nullptr)
        {
            temp = temp->vehicleNext;
        }

        temp->vehicleNext = newVehicle;
    }

    std::cout << "Emergency vehicle registered successfully.\n";
    return newVehicle;
}

void EmergencyVehicleList::displayVehicles()
{
    if (head == nullptr)
    {
        std::cout << "No emergency vehicles registered.\n";
        return;
    }

    EmergencyVehicle* temp = head;

    std::cout << "\n===== REGISTERED EMERGENCY VEHICLES =====\n";

    while (temp != nullptr)
    {
        std::cout << "Vehicle Number: " << temp->number << '\n';
        std::cout << "Vehicle Type: " << temp->type << '\n';
        std::cout << "-----------------------------\n";

        temp = temp->vehicleNext;
    }
}

EmergencyVehicle* EmergencyVehicleList::searchVehicle(
    std::string number)
{
    EmergencyVehicle* temp = head;

    while (temp != nullptr)
    {
        if (temp->number == number)
        {
            return temp;
        }

        temp = temp->vehicleNext;
    }

    return nullptr;
}

void EmergencyVehicleList::removeVehicle(
    std::string number, TrafficQueue& queue)
{
    EmergencyVehicle* temp = head;
    EmergencyVehicle* prev = nullptr;

    while (temp != nullptr && temp->number != number)
    {
        prev = temp;
        temp = temp->vehicleNext;
    }

    if (temp == nullptr)
    {
        std::cout << "Vehicle not found.\n";
        return;
    }

    if (queue.isInQueue(temp))
    {
        std::cout << "Vehicle is currently in the traffic queue.\n";
        std::cout << "Cannot remove vehicle.\n";
        return;
    }

    if (prev == nullptr)
    {
        head = temp->vehicleNext;
    }
    else
    {
        prev->vehicleNext = temp->vehicleNext;
    }

    delete temp;

    std::cout << "Vehicle removed successfully.\n";
}
