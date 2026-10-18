
#include <iostream>
#include <string>
#include <limits>
#include "EmergencyVehicleList.h"
#include "TrafficQueue.h"
#include "TrafficSignal.h"
#include "TrafficActionStack.h"
#include "RoadNetwork.h"
#include "ShortestPath.h"
#include "EmergencyDispatch.h"
#include "TrafficSimulation.h"

int main()
{
    EmergencyVehicleList vehicles;
    TrafficQueue queue;
    TrafficSignal signal;
    TrafficActionStack history;
    RoadNetwork network;
    ShortestPath shortestPath;
    EmergencyDispatch dispatch(vehicles, network);
    TrafficSimulation simulation(network, dispatch, signal, history);

    int choice = 0;
    int source, destination, distance;
    std::string number, type, name;
    DispatchResult activeDispatch;

    do
    {
        std::cout << "\n===== SMART CITY EMERGENCY RESPONSE SYSTEM =====\n";
        std::cout << "1. Register Emergency Vehicle\n";
        std::cout << "2. Display Registered Vehicles\n";
        std::cout << "3. Add Vehicle to Traffic Queue\n";
        std::cout << "4. Display Traffic Queue\n";
        std::cout << "5. Allow Front Vehicle to Pass\n";
        std::cout << "6. Give Emergency Signal Priority\n";
        std::cout << "7. Display Action History\n";
        std::cout << "8. Remove Registered Vehicle\n";
        std::cout << "9. Reset Traffic Signal\n";
        std::cout << "10. Display Traffic Signal\n";
        std::cout << "11. Add Intersection\n";
        std::cout << "12. Add Road\n";
        std::cout << "13. Display Road Network\n";
        std::cout << "14. Find Shortest Path\n";
        std::cout << "15. Set Emergency Vehicle Location\n";
        std::cout << "16. Dispatch Emergency Vehicle\n";
        std::cout << "17. Simulate Emergency Route\n";
        std::cout << "18. Display Vehicle Locations\n";
        std::cout << "19. Exit\n";
        std::cout << "Enter choice: ";

        if (!(std::cin >> choice))
        {
            std::cin.clear();
            std::cin.ignore(
                std::numeric_limits<std::streamsize>::max(), '\n');
            std::cout << "Invalid input.\n";
            continue;
        }

        std::cin.ignore(
            std::numeric_limits<std::streamsize>::max(), '\n');

        switch (choice)
        {
            case 1:
            {
                std::cout << "Enter vehicle number: ";
                std::getline(std::cin, number);

                std::cout << "Enter vehicle type: ";
                std::getline(std::cin, type);

                if (vehicles.addVehicle(number, type) != nullptr)
                {
                    history.push("Registered vehicle " + number);
                }
                break;
            }

            case 2:
                vehicles.displayVehicles();
                break;

            case 3:
            {
                std::cout << "Enter registered vehicle number: ";
                std::getline(std::cin, number);

                EmergencyVehicle* vehicle =
                    vehicles.searchVehicle(number);

                if (vehicle == nullptr)
                {
                    std::cout << "Vehicle not found.\n";
                }
                else if (dispatch.isVehicleBusy(number))
                {
                    std::cout << "Vehicle is on an active dispatch.\n";
                }
                else if (queue.enqueue(vehicle))
                {
                    history.push("Added vehicle " + number + " to queue");
                }
                break;
            }

            case 4:
                queue.display();
                std::cout << "Vehicles waiting: "
                          << queue.queueSize() << '\n';
                break;

            case 5:
            {
                EmergencyVehicle* vehicle = queue.dequeue();

                if (vehicle != nullptr)
                {
                    history.push(
                        "Vehicle " + vehicle->number +
                        " passed the traffic signal");
                }
                break;
            }

            case 6:
                signal.setEmergency(true);
                signal.givePriority();
                signal.displaySignal();
                history.push("Emergency signal priority requested");
                break;

            case 7:
                history.display();
                break;

            case 8:
            {
                std::cout << "Enter vehicle number to remove: ";
                std::getline(std::cin, number);

                if (dispatch.isVehicleBusy(number))
                {
                    std::cout << "Cannot remove vehicle during dispatch.\n";
                }
                else
                {
                    bool existed =
                        vehicles.searchVehicle(number) != nullptr;

                    vehicles.removeVehicle(number, queue);

                    if (existed &&
                        vehicles.searchVehicle(number) == nullptr)
                    {
                        dispatch.removeVehicleLocation(number);
                        history.push("Removed vehicle " + number);
                    }
                }
                break;
            }

            case 9:
                signal.resetSignal();
                signal.displaySignal();
                history.push("Traffic signal reset to RED");
                break;

            case 10:
                signal.displaySignal();
                break;

            case 11:
            {
                std::cout << "Enter intersection name: ";
                std::getline(std::cin, name);

                network.addIntersection(name);
                break;
            }

            case 12:
            {
                network.displayIntersections();

                std::cout << "Enter source ID: ";
                if (!(std::cin >> source))
                {
                    std::cin.clear();
                    std::cin.ignore(
                        std::numeric_limits<std::streamsize>::max(), '\n');
                    std::cout << "Invalid input.\n";
                    break;
                }

                std::cout << "Enter destination ID: ";
                if (!(std::cin >> destination))
                {
                    std::cin.clear();
                    std::cin.ignore(
                        std::numeric_limits<std::streamsize>::max(), '\n');
                    std::cout << "Invalid input.\n";
                    break;
                }

                std::cout << "Enter road distance in km: ";
                if (!(std::cin >> distance))
                {
                    std::cin.clear();
                    std::cin.ignore(
                        std::numeric_limits<std::streamsize>::max(), '\n');
                    std::cout << "Invalid input.\n";
                    break;
                }

                network.addRoad(source, destination, distance);
                history.push("Road network update requested");
                break;
            }

            case 13:
                network.displayNetwork();
                break;

            case 14:
            {
                network.displayIntersections();

                std::cout << "Enter source ID: ";
                if (!(std::cin >> source))
                {
                    std::cin.clear();
                    std::cin.ignore(
                        std::numeric_limits<std::streamsize>::max(), '\n');
                    std::cout << "Invalid input.\n";
                    break;
                }

                std::cout << "Enter destination ID: ";
                if (!(std::cin >> destination))
                {
                    std::cin.clear();
                    std::cin.ignore(
                        std::numeric_limits<std::streamsize>::max(), '\n');
                    std::cout << "Invalid input.\n";
                    break;
                }

                PathResult result =
                    shortestPath.dijkstra(network, source, destination);

                shortestPath.displayPath(network, result);
                break;
            }

            case 15:
            {
                std::cout << "Enter vehicle number: ";
                std::getline(std::cin, number);

                network.displayIntersections();

                std::cout << "Enter intersection ID: ";
                if (!(std::cin >> source))
                {
                    std::cin.clear();
                    std::cin.ignore(
                        std::numeric_limits<std::streamsize>::max(), '\n');
                    std::cout << "Invalid input.\n";
                    break;
                }

                if (dispatch.setVehicleLocation(number, source))
                {
                    history.push("Location assigned to " + number);
                }
                break;
            }

            case 16:
            {
                network.displayIntersections();

                std::cout << "Enter emergency destination ID: ";
                if (!(std::cin >> destination))
                {
                    std::cin.clear();
                    std::cin.ignore(
                        std::numeric_limits<std::streamsize>::max(), '\n');
                    std::cout << "Invalid input.\n";
                    break;
                }

                if (activeDispatch.success &&
                    dispatch.isVehicleBusy(activeDispatch.vehicleNumber))
                {
                    std::cout << "Simulate the previous dispatch first.\n";
                    break;
                }

                activeDispatch = dispatch.dispatchVehicle(destination);

                if (activeDispatch.success)
                {
                    history.push(
                        "Dispatched vehicle " +
                        activeDispatch.vehicleNumber);
                }
                break;
            }

            case 17:
                simulation.simulateEmergencyRoute(activeDispatch);
                break;

            case 18:
                dispatch.displayVehicleLocations();
                break;

            case 19:
                std::cout << "Exiting system.\n";
                break;

            default:
                std::cout << "Invalid choice.\n";
        }

    } while (choice != 19);

    return 0;
}
