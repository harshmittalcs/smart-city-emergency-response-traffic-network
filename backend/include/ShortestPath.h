
#ifndef SHORTEST_PATH_H
#define SHORTEST_PATH_H

#include <vector>
#include "RoadNetwork.h"

struct PathResult
{
    std::vector<int> path;
    int distance;
    bool found;

    PathResult();
};

class ShortestPath
{
public:
    PathResult dijkstra(const RoadNetwork& network, int source, int destination);
    void displayPath(const RoadNetwork& network, const PathResult& result);
};

#endif
