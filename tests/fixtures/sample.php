<?php

use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\DB;

class Calculator
{
    private float $value;

    public function __construct(float $value)
    {
        $this->value = $value;
    }

    public function add(float $x): float
    {
        return $this->value + $x;
    }

    public function subtract(float $x): float
    {
        return $this->value - $x;
    }
}

$calc = new Calculator(10.0);
$result = $calc->add(5.0);
echo $result;
