
#include <iostream>
#include <string>
#include "EmergencyVehicle.h"

using namespace std;

class TrafficQueue;  

class EmergencyVehicleList
{
private:
    EmergencyVehicle* head;

public:

    EmergencyVehicleList()
    {
        head = nullptr;
    }

    EmergencyVehicle* addVehicle(string number, string type)
    {
        if (searchVehicle(number) != nullptr)
        {
            cout << "Vehicle number already registered.\n";
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

        cout << "Emergency vehicle registered successfully.\n";

        return newVehicle;
    }

    void displayVehicles()
    {
        if (head == nullptr)
        {
            cout << "No emergency vehicles registered.\n";
            return;
        }

        EmergencyVehicle* temp = head;

        cout << "\n===== REGISTERED EMERGENCY VEHICLES =====\n";

        while (temp != nullptr)
        {
            cout << "Vehicle Number: " << temp->number << endl;
            cout << "Vehicle Type: " << temp->type << endl;
            cout << "-----------------------------\n";

            temp = temp->vehicleNext;
        }
    }

    EmergencyVehicle* searchVehicle(string number)
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

    void removeVehicle(string number, TrafficQueue& queue);

    ~EmergencyVehicleList()
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
};