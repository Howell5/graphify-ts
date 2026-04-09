package main

import (
	"fmt"
	"os"
)

type Calculator struct {
	value float64
}

func NewCalculator(v float64) *Calculator {
	return &Calculator{value: v}
}

func (c *Calculator) Add(x float64) float64 {
	fmt.Println("adding")
	return c.value + x
}

func main() {
	calc := NewCalculator(10.0)
	result := calc.Add(5.0)
	_ = os.Stdout
	fmt.Println(result)
}
