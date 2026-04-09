#include <stdio.h>
#include <stdlib.h>

double add(double a, double b) {
    return a + b;
}

double multiply(double a, double b) {
    return a * b;
}

int main(void) {
    double result = add(3.0, 4.0);
    printf("%f\n", result);
    return 0;
}
