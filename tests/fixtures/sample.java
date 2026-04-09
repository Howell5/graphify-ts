import java.util.List;
import java.util.ArrayList;

public class Calculator {
    private double value;

    public Calculator(double value) {
        this.value = value;
    }

    public double add(double x) {
        return this.value + x;
    }

    public static void main(String[] args) {
        Calculator calc = new Calculator(10.0);
        double result = calc.add(5.0);
        List<String> list = new ArrayList<>();
        System.out.println(result);
    }
}
