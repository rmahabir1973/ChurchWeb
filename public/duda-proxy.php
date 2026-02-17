<?php
/**
 * Duda API Proxy - Bypasses CORS
 * Upload this to: churchwebglobal.com/duda-proxy.php
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get request details from POST body
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['endpoint']) || !isset($input['method'])) {
    echo json_encode(['error' => 'Missing endpoint or method']);
    exit;
}

$endpoint = $input['endpoint'];
$method = $input['method'];
$payload = $input['payload'] ?? null;

// Your Duda API credentials (KEEP THESE SECURE!)
$API_USER = 'f7ba1c1754';
$API_PASSWORD = '8WQT31JBFHXD';
$BASE_URL = 'https://api.duda.co';

// Build full URL
$url = $BASE_URL . $endpoint;

// Initialize cURL
$ch = curl_init();

// Set cURL options
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
curl_setopt($ch, CURLOPT_USERPWD, "$API_USER:$API_PASSWORD");
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

// Add payload for POST requests
if ($method === 'POST' && $payload) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
}

// Get response info
curl_setopt($ch, CURLOPT_HEADER, false);
curl_setopt($ch, CURLINFO_HEADER_OUT, true);

// Execute request
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);

curl_close($ch);

// Return response
if ($error) {
    http_response_code(500);
    echo json_encode([
        'error' => $error,
        'status_code' => 0
    ]);
} else {
    http_response_code($httpCode);
    echo $response;
}
?>
