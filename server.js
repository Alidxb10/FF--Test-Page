const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const app = express();

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// API route to start the scan
app.get('/start-scan', (req, res) => {
    const domain = req.query.domain;

    if (!domain) {
        return res.status(400).json({ error: 'Domain is required' });
    }

    // Call the scanner script
    exec(`node scanner.js ${domain}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing scanner: ${error.message}`);
            return res.status(500).json({ error: 'Failed to start scan' });
        }

        if (stderr) {
            console.error(`Scanner stderr: ${stderr}`);
            return res.status(500).json({ error: 'Scanner encountered an error' });
        }

        // Send the result back to the client
        res.json({ message: stdout });
    });
});

// Serve the HTML file for the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server on port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
