
#include <iostream>
#include "TrafficSignal.h"

TrafficSignal::TrafficSignal()
{
    signal = "RED";
    emergency = false;
}

void TrafficSignal::setEmergency(bool status)
{
    emergency = status;
}

void TrafficSignal::givePriority()
{
    if (emergency)
    {
        signal = "GREEN";
        std::cout << "Emergency vehicle detected. Green signal granted.\n";
    }
    else
    {
        std::cout << "No emergency priority requested.\n";
    }
}

void TrafficSignal::resetSignal()
{
    emergency = false;
    signal = "RED";
    std::cout << "Signal reset to RED.\n";
}

void TrafficSignal::displaySignal()
{
    std::cout << "Current Traffic Signal: " << signal << '\n';
}
