using System;
using System.Collections.Generic;

namespace MyApp
{
    public class Calculator
    {
        private double value;

        public Calculator(double value)
        {
            this.value = value;
        }

        public double Add(double x)
        {
            return this.value + x;
        }

        public static void Main(string[] args)
        {
            var calc = new Calculator(10.0);
            double result = calc.Add(5.0);
            Console.WriteLine(result);
        }
    }
}
