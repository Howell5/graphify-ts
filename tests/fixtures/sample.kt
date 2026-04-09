import kotlin.math.sqrt
import kotlin.collections.List

class Calculator(private val value: Double) {
    fun add(x: Double): Double {
        return value + x
    }

    fun subtract(x: Double): Double {
        return value - x
    }
}

fun main() {
    val calc = Calculator(10.0)
    val result = calc.add(5.0)
    println(result)
}
