#ifndef TRAFFIC_ACTION_STACK_H
#define TRAFFIC_ACTION_STACK_H

#include <string>
#include <vector>

struct Action
{
    std::string description;
    Action* next;

    Action(std::string text);
};

class TrafficActionStack
{
private:
    Action* top;

public:
    TrafficActionStack();
    ~TrafficActionStack();

    void push(std::string description);
    void pop();
    void display();
    std::vector<std::string> getHistory() const;
};

#endif
