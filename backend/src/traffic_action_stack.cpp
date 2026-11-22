#include <iostream>
#include "TrafficActionStack.h"

Action::Action(std::string text)
    : description(text), next(nullptr)
{
}

TrafficActionStack::TrafficActionStack()
{
    top = nullptr;
}

TrafficActionStack::~TrafficActionStack()
{
    while (top != nullptr)
    {
        Action* temp = top;
        top = top->next;
        delete temp;
    }
}

void TrafficActionStack::push(std::string description)
{
    Action* newAction = new Action(description);
    newAction->next = top;
    top = newAction;
}

void TrafficActionStack::pop()
{
    if (top == nullptr)
    {
        std::cout << "No actions in history.\n";
        return;
    }

    Action* temp = top;
    std::cout << "Removed action: " << temp->description << '\n';

    top = top->next;
    delete temp;
}

void TrafficActionStack::display()
{
    if (top == nullptr)
    {
        std::cout << "No actions recorded.\n";
        return;
    }

    Action* temp = top;

    std::cout << "\n===== ACTION HISTORY (LATEST FIRST) =====\n";

    while (temp != nullptr)
    {
        std::cout << temp->description << '\n';
        temp = temp->next;
    }
}

std::vector<std::string> TrafficActionStack::getHistory() const
{
    std::vector<std::string> list;
    Action* temp = top;

    while (temp != nullptr)
    {
        list.push_back(temp->description);
        temp = temp->next;
    }

    return list;
}
