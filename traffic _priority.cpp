#include <iostream>
using namespace std;

class TrafficSignal
{
private:
    string signal;
    bool emergency;

public:
    TrafficSignal()
    {
        signal = "RED";
        emergency = false;
    }

    void setEmergency(bool status)
    {
        emergency = status;
    }

    void givePriority()
    {
        if (emergency)
        {
            signal = "GREEN";
            cout << "Emergency priority activated.\n";
            cout << "Signal changed to GREEN.\n";
        }
        else
        {
            cout << "Normal signal operation.\n";
        }
    }

    void displaySignal()
    {
        cout << "Current Signal: " << signal << endl;
    }
};

int main()
{
    TrafficSignal signal;

    int emergency;

    cout << "Is emergency vehicle approaching? (1/0): ";
    cin >> emergency;

    signal.setEmergency(emergency);

    signal.givePriority();
    signal.displaySignal();

    return 0;
}
