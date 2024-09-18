const axios = require('axios');

const ZAP_BASE_URL = 'http://localhost:8080'; // Default ZAP URL
const ZAP_API_KEY = 'vfphq02n2ju24cmcg9j827djt6'; // Your ZAP API key
const targetUrl = process.argv[2]; // Get the target URL from command line arguments

if (!targetUrl) {
    console.error('No target URL provided');
    process.exit(1);
}

// Function to spider (crawl) the target URL
async function spiderTarget() {
    try {
        const spiderResponse = await axios.get(`${ZAP_BASE_URL}/JSON/spider/action/scan/`, {
            params: {
                url: targetUrl,
                apikey: ZAP_API_KEY,
                maxChildren: 2
            }
        });
        return spiderResponse.data.scan;
    } catch (error) {
        console.error('Error during spidering:', error.message);
        throw error;
    }
}

// Function to check the progress of the spidering process
async function checkSpiderStatus(spiderId) {
    try {
        const spiderStatusResponse = await axios.get(`${ZAP_BASE_URL}/JSON/spider/view/status/`, {
            params: {
                scanId: spiderId,
                apikey: ZAP_API_KEY
            }
        });
        return spiderStatusResponse.data.status;
    } catch (error) {
        console.error('Error checking spider status:', error.message);
        throw error;
    }
}

// Function to check passive scan status
async function checkPassiveScanStatus() {
    try {
        const statusResponse = await axios.get(`${ZAP_BASE_URL}/JSON/pscan/view/recordsToScan/`, {
            params: {
                apikey: ZAP_API_KEY
            }
        });
        return statusResponse.data.recordsToScan;
    } catch (error) {
        console.error('Error checking passive scan status:', error.message);
        throw error;
    }
}

// Function to print scan results
async function printScanResults() {
    try {
        const alertsResponse = await axios.get(`${ZAP_BASE_URL}/JSON/core/view/alerts/`, {
            params: {
                baseurl: targetUrl,
                apikey: ZAP_API_KEY
            }
        });
        const alerts = alertsResponse.data.alerts;

        let result = "\n--- Vulnerabilities Found ---\n";
        alerts.forEach(alert => {
            result += `URL: ${alert.url}\n`;
            result += `Risk: ${alert.risk}\n`;
            result += `Description: ${alert.name}\n`;
            result += `Solution: ${alert.solution}\n`;
            result += '-----------------------------\n';
        });

        if (alerts.length === 0) {
            result += 'No vulnerabilities found.';
        }

        console.log(result);
    } catch (error) {
        console.error('Error fetching scan results:', error.message);
    }
}

// Main function to execute spidering and check passive scanning results
async function runLightScan() {
    try {
        const spiderId = await spiderTarget();

        let spiderStatus = 0;
        while (spiderStatus < 100) {
            spiderStatus = await checkSpiderStatus(spiderId);
            console.log(`Spider progress: ${spiderStatus}%`);
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        console.log('Spidering complete! Checking passive scan status...');

        let recordsToScan = await checkPassiveScanStatus();
        while (recordsToScan > 0) {
            console.log(`Passive scan progress: ${recordsToScan} records left to scan`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            recordsToScan = await checkPassiveScanStatus();
        }

        console.log('Passive scan complete!');
        console.log('Fetching scan results...');

        await printScanResults();

    } catch (error) {
        console.error('Error during the light scan process:', error.message);
    }
}

// Run the light scanning process
runLightScan();
