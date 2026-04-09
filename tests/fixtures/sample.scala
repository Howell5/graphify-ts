import scala.collection.mutable.ListBuffer
import scala.util.Try

class Calculator(val value: Double) {
  def add(x: Double): Double = value + x

  def subtract(x: Double): Double = value - x
}

object Main {
  def main(args: Array[String]): Unit = {
    val calc = new Calculator(10.0)
    val result = calc.add(5.0)
    println(result)
  }
}
