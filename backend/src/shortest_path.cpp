
#include <iostream>
#include <queue>
#include <vector>
#include <limits>
#include <functional>
#include <algorithm>
#include "ShortestPath.h"

PathResult::PathResult()
{
    distance = -1;
    found = false;
}

PathResult ShortestPath::dijkstra(
    const RoadNetwork& network, int source, int destination)
{
    PathResult result;

    if (!network.isValidIntersection(source) ||
        !network.isValidIntersection(destination))
    {
        std::cout << "Invalid source or destination.\n";
        return result;
    }

    int n = network.getIntersectionCount();
    const int INF = std::numeric_limits<int>::max();

    std::vector<int> dist(n, INF);
    std::vector<int> parent(n, -1);

    using Node = std::pair<int, int>;

    std::priority_queue<Node, std::vector<Node>, std::greater<Node>> pq;

    dist[source] = 0;
    pq.push({0, source});

    while (!pq.empty())
    {
        int currentDistance = pq.top().first;
        int u = pq.top().second;
        pq.pop();

        if (currentDistance != dist[u])
        {
            continue;
        }

        if (u == destination)
        {
            break;
        }

        for (const auto& edge : network.getNeighbors(u))
        {
            int v = edge.first;
            int weight = edge.second;

            if (currentDistance <= INF - weight &&
                currentDistance + weight < dist[v])
            {
                dist[v] = currentDistance + weight;
                parent[v] = u;
                pq.push({dist[v], v});
            }
        }
    }

    if (dist[destination] == INF)
    {
        return result;
    }

    result.found = true;
    result.distance = dist[destination];

    int current = destination;

    while (current != -1)
    {
        result.path.push_back(current);
        current = parent[current];
    }

    std::reverse(result.path.begin(), result.path.end());

    return result;
}

void ShortestPath::displayPath(
    const RoadNetwork& network, const PathResult& result)
{
    if (!result.found)
    {
        std::cout << "No route available.\n";
        return;
    }

    std::cout << "\nShortest Route: ";

    for (int i = 0; i < static_cast<int>(result.path.size()); i++)
    {
        std::cout << network.getIntersectionName(result.path[i]);

        if (i + 1 < static_cast<int>(result.path.size()))
        {
            std::cout << " -> ";
        }
    }

    std::cout << "\nTotal Distance: " << result.distance << " km\n";
}
