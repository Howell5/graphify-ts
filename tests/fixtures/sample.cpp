#include <iostream>
#include <vector>

class Calculator {
public:
    double value;

    Calculator(double v) : value(v) {}

    double add(double x) {
        return value + x;
    }
};

int main() {
    Calculator calc(10.0);
    double result = calc.add(5.0);
    std::cout << result << std::endl;
    return 0;
}
