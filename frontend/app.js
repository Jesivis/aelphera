(async function () {
  const map = L.map('map').setView([37.779, -122.419], 15);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  function styleNeighborhood(feature) {
    return {
      color: '#444',
      weight: 1,
      fillColor: feature.properties.color || '#eee',
      fillOpacity: 0.4
    };
  }

  function styleLot(feature) {
    return {
      color: feature.properties.status === 'claimed' ? '#c0392b' : '#2ecc71',
      weight: 1,
      fillOpacity: 0.6
    };
  }

  let lotLayer;

  async function loadGeoJSON(url, styleFn, onEach) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load ' + url);
    const data = await res.json();
    return L.geoJSON(data, { style: styleFn, onEachFeature: onEach });
  }

  // neighbourhoods
  const nLayer = await loadGeoJSON('/api/neighborhoods', styleNeighborhood, (f, layer) => {
    layer.bindPopup(`<strong>${f.properties.name}</strong>`);
  });
  nLayer.addTo(map);

  // lots
  lotLayer = await loadGeoJSON('/api/lots', styleLot, (f, layer) => {
    layer.on({
      mouseover(e) {
        e.target.setStyle({ weight: 3, fillOpacity: 0.9 });
      },
      mouseout(e) {
        lotLayer.resetStyle(e.target);
      },
      click(e) {
        const p = f.properties;
        const html = `<strong>Lot ${p.id}</strong><br/>status: ${p.status}<br/>owner: ${p.owner || '—'}<br/>price: ${p.price || '—'}`;
        layer.bindPopup(html).openPopup();
        document.getElementById('info').innerHTML = html;
      }
    });
  });
  lotLayer.addTo(map);
})();
