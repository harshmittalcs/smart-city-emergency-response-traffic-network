#include <bits/stdc++.h>
using namespace std;

struct Vehicle
{
    string number;
    string type;
    Vehicle *next;
};

class TrafficQueue
{
private:
    Vehicle *front;
    Vehicle *rear;

public:
    TrafficQueue()
    {
        front = NULL;
        rear = NULL;
    }

    void enqueue(string number, string type)
    {

        Vehicle *newVehicle = new Vehicle;

        newVehicle->number = number;
        newVehicle->type = type;
        newVehicle->next = NULL;

        if (front == NULL)
        {
            front = newVehicle;
            rear = newVehicle;
        }
        else
        {
            rear->next = newVehicle;
            rear = newVehicle;
        }

        cout << "Vehicle added successfully.\n";
    }

    void dequeue()
    {
        if (front == NULL)
        {
            cout << "No vehicles in the queue.\n";
            return;
        }

        Vehicle *temp = front;

        cout << temp->number << " has passed the signal.\n";

        front = front->next;

        if (front == NULL)
        {
            rear = NULL;
        }

        delete temp;
    }

    void display()
    {

        if (front == NULL)
        {
            cout << "Queue is empty.\n";
            return;
        }

        Vehicle *temp = front;

        cout << "\nVehicles waiting:\n";

        while (temp != NULL)
        {
            cout << temp->number << " - " << temp->type << endl;
            temp = temp->next;
        }
    }

    int queueSize()
    {
        int count = 0;
        Vehicle *temp = front;

        while (temp != NULL)
        {
            count++;
            temp = temp->next;
        }

        return count;
    }
};

int main()
{

    TrafficQueue q;

    int choice;

    do
    {

        cout << "\n===== TRAFFIC QUEUE MANAGEMENT =====\n";
        cout << "1. Add Vehicle\n";
        cout << "2. Allow Vehicle to Pass\n";
        cout << "3. Display Waiting Vehicles\n";
        cout << "4. Show Queue Size\n";
        cout << "5. Exit\n";

        cout << "Enter your choice: ";
        cin >> choice;

        switch (choice)
        {

        case 1:
        {
            string number, type;

            cout << "Enter vehicle number: ";

            cin.ignore();
            getline(cin, number);

            cout << "Enter vehicle type: ";
            cin >> type;

            q.enqueue(number, type);

            break;
        }

        case 2:
            q.dequeue();
            break;

        case 3:
            q.display();
            break;

        case 4:
            cout << "Vehicles waiting: "
                 << q.queueSize() << endl;
            break;

        case 5:
            cout << "Exiting...\n";
            break;

        default:
            cout << "Invalid choice.\n";
        }

    } while (choice != 5);

    return 0;
}
