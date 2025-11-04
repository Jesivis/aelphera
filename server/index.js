const express = require('express');
const path = require('path');

const app = express();

// serve static frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// mount API
const api = require('./api');
app.use('/api', api);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`aelphera-server listening on ${port}`));
