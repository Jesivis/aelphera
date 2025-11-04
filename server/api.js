const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const router = express.Router();

const dataDir = path.join(__dirname, '..', 'data');

async function loadJSON(filename) {
  // Prevent directory traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    throw new Error('Invalid filename');
  }
  const full = path.join(dataDir, filename);
  const content = await fs.readFile(full, 'utf8');
  return JSON.parse(content);
}

router.get('/neighborhoods', async (req, res) => {
  try {
    const data = await loadJSON('neighborhoods.geojson');
    res.json(data);
  } catch (err) {
    console.error('Error loading neighborhoods:', err);
    res.status(500).json({ error: 'Failed to load neighborhoods' });
  }
});

router.get('/lots', async (req, res) => {
  try {
    const data = await loadJSON('lots.geojson');
    res.json(data);
  } catch (err) {
    console.error('Error loading lots:', err);
    res.status(500).json({ error: 'Failed to load lots' });
  }
});

router.get('/lot/:id', async (req, res) => {
  try {
    const data = await loadJSON('lots.geojson');
    const feature = data.features.find(f => f.properties && f.properties.id === req.params.id);
    if (!feature) return res.status(404).json({ error: 'Lot not found' });
    res.json(feature);
  } catch (err) {
    console.error('Error loading lot:', err);
    res.status(500).json({ error: 'Failed to load lot' });
  }
});

module.exports = router;
