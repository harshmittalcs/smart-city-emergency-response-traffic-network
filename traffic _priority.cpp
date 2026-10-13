#include <iostream>
using namespace std;

class Traffic_Signal
{
private:
    string signal;
    bool emergency;

public:
    Traffic_Signal()
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
    Traffic_Signal signal;

    int emergency;

    cout << "Is emergency vehicle approaching? (1/0): ";
    cin >> emergency;

    signal.setEmergency(emergency);

    signal.givePriority();
    signal.displaySignal();

    return 0;
}
