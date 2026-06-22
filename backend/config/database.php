<?php

class Database
{
    private string $host = 'localhost';
    private int $port = 3306;
    private string $database = 'u486198171_catering';
    private string $username = 'u486198171_catering';
    private string $password = 'U486198171_u486198171';

    public function connect(): mysqli
    {
        mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

        $connection = new mysqli(
            $this->host,
            $this->username,
            $this->password,
            $this->database,
            $this->port
        );

        $connection->set_charset('utf8mb4');

        return $connection;
    }
}
