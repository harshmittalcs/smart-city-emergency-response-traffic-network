
#ifndef ROAD_NETWORK_H
#define ROAD_NETWORK_H

#include <vector>
#include <string>
#include <utility>

class RoadNetwork
{
private:
    std::vector<std::string> intersections;
    std::vector<std::vector<std::pair<int, int>>> roads;

public:
    int addIntersection(std::string name);
    void addRoad(int source, int destination, int distance);
    void displayNetwork() const;
    void displayIntersections() const;
    int getIntersectionCount() const;
    std::string getIntersectionName(int id) const;
    const std::vector<std::pair<int, int>>& getNeighbors(int id) const;
    bool isValidIntersection(int id) const;
};

#endif
