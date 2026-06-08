<?php

declare(strict_types=1);

use PDO;

require __DIR__ . '/../vendor/autoload.php';

$host = '127.0.0.1';
$port = 3306;
$db = 'edustor_db';
$user = 'root';
$pass = '';

$pdo = new PDO("mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4", $user, $pass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
]);

$stmt = $pdo->query("SELECT email, role, mot_de_passe FROM utilisateurs WHERE email IN ('admin@admin.com','test@example.com')");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (!$rows) {
    echo "NO_MATCHING_USERS\n";
    exit(0);
}

foreach ($rows as $row) {
    echo $row['email'] . '|' . $row['role'] . '|hash_len=' . strlen((string) $row['mot_de_passe']) . "\n";
}

