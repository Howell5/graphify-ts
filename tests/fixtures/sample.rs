use std::collections::HashMap;
use std::io;

struct Calculator {
    value: f64,
}

impl Calculator {
    fn new(v: f64) -> Self {
        Calculator { value: v }
    }

    fn add(&self, x: f64) -> f64 {
        self.value + x
    }
}

fn main() {
    let calc = Calculator::new(10.0);
    let result = calc.add(5.0);
    let mut map = HashMap::new();
    println!("{}", result);
}
