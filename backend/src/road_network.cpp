
#include <iostream>
#include "RoadNetwork.h"

int RoadNetwork::addIntersection(std::string name)
{
    for (int i = 0; i < static_cast<int>(intersections.size()); i++)
    {
        if (intersections[i] == name)
        {
            std::cout << "Intersection already exists.\n";
            return i;
        }
    }

    intersections.push_back(name);
    roads.push_back({});

    int id = static_cast<int>(intersections.size()) - 1;

    std::cout << "Intersection added with ID: " << id << '\n';
    return id;
}

void RoadNetwork::addRoad(int source, int destination, int distance)
{
    if (!isValidIntersection(source) || !isValidIntersection(destination))
    {
        std::cout << "Invalid intersection ID.\n";
        return;
    }

    if (source == destination || distance <= 0)
    {
        std::cout << "Invalid road details.\n";
        return;
    }

    for (auto& road : roads[source])
    {
        if (road.first == destination)
        {
            std::cout << "Road already exists.\n";
            return;
        }
    }

    roads[source].push_back({destination, distance});
    roads[destination].push_back({source, distance});

    std::cout << "Road added successfully.\n";
}

void RoadNetwork::displayNetwork() const
{
    if (intersections.empty())
    {
        std::cout << "Road network is empty.\n";
        return;
    }

    std::cout << "\n===== ROAD NETWORK =====\n";

    for (int i = 0; i < static_cast<int>(intersections.size()); i++)
    {
        std::cout << i << " (" << intersections[i] << ") -> ";

        for (const auto& road : roads[i])
        {
            std::cout << road.first << "(" << road.second << " km) ";
        }

        std::cout << '\n';
    }
}

void RoadNetwork::displayIntersections() const
{
    if (intersections.empty())
    {
        std::cout << "No intersections available.\n";
        return;
    }

    std::cout << "\n===== INTERSECTIONS =====\n";

    for (int i = 0; i < static_cast<int>(intersections.size()); i++)
    {
        std::cout << i << ". " << intersections[i] << '\n';
    }
}

int RoadNetwork::getIntersectionCount() const
{
    return static_cast<int>(intersections.size());
}

std::string RoadNetwork::getIntersectionName(int id) const
{
    if (!isValidIntersection(id))
    {
        return "Unknown";
    }

    return intersections[id];
}

const std::vector<std::pair<int, int>>& RoadNetwork::getNeighbors(int id) const
{
    static const std::vector<std::pair<int, int>> empty;

    if (!isValidIntersection(id))
    {
        return empty;
    }

    return roads[id];
}

bool RoadNetwork::isValidIntersection(int id) const
{
    return id >= 0 && id < static_cast<int>(intersections.size());
}
