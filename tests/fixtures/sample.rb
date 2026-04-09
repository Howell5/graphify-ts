class Calculator
  def initialize(value)
    @value = value
  end

  def add(x)
    @value + x
  end

  def subtract(x)
    @value - x
  end
end

calc = Calculator.new(10)
result = calc.add(5)
puts result
