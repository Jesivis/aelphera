const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const router = express.Router();

const dataDir = path.join(__dirname, '..', 'data');

async function loadJSON(filename) {
  const full = path.join(dataDir, filename);
  const content = await fs.readFile(full, 'utf8');
  return JSON.parse(content);
}

router.get('/neighborhoods', async (req, res) => {
  try {
    const data = await loadJSON('neighborhoods.geojson');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get('/lots', async (req, res) => {
  try {
    const data = await loadJSON('lots.geojson');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get('/lot/:id', async (req, res) => {
  try {
    const data = await loadJSON('lots.geojson');
    const feature = data.features.find(f => f.properties && f.properties.id === req.params.id);
    if (!feature) return res.status(404).json({ error: 'not found' });
    res.json(feature);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

module.exports = router;
