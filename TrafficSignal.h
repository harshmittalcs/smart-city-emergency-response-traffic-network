
#ifndef TRAFFIC_SIGNAL_H
#define TRAFFIC_SIGNAL_H

#include <string>

class TrafficSignal
{
private:
    std::string signal;
    bool emergency;

public:
    TrafficSignal();

    void setEmergency(bool status);
    void givePriority();
    void resetSignal();
    void displaySignal();
};

#endif
