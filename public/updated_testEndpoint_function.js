// UPDATED testEndpoint function - USE THIS TO REPLACE THE OLD ONE

// Test a single endpoint
async function testEndpoint(endpoint) {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    // PROXY METHOD - Bypasses CORS
    const proxyUrl = 'https://churchwebglobal.com/duda-proxy.php';
    
    try {
        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                endpoint: endpoint.endpoint,
                method: endpoint.method,
                payload: endpoint.payload || null
            })
        });
        
        const elapsed = Date.now() - startTime;
        
        let responseBody;
        const contentType = response.headers.get('content-type');
        
        try {
            if (contentType && contentType.includes('application/json')) {
                responseBody = await response.json();
            } else {
                responseBody = await response.text();
            }
        } catch (e) {
            responseBody = 'Unable to parse response';
        }

        return {
            timestamp_utc: timestamp,
            priority: endpoint.priority,
            description: endpoint.description,
            method: endpoint.method,
            url: `${BASE_URL}${endpoint.endpoint}`,
            source_ip: currentIP,
            status_code: response.status,
            status_text: response.statusText,
            response_time_ms: elapsed,
            response_body: responseBody,
            request_payload: endpoint.payload || null,
            success: response.status < 400
        };

    } catch (error) {
        return {
            timestamp_utc: timestamp,
            priority: endpoint.priority,
            description: endpoint.description,
            method: endpoint.method,
            url: `${BASE_URL}${endpoint.endpoint}`,
            source_ip: currentIP,
            status_code: 0,
            status_text: 'REQUEST FAILED',
            error: error.message,
            success: false
        };
    }
}
