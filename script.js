const map = L.map('map', {
  zoomControl: true
}).setView([16.0, -15.0], 8);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let geoLayer;
let features = [];

const labels = {
  Nom_de_l_e: "Nom de l'entreprise",
  Arrondisse: "Arrondissement",
  Commune: "Commune",
  Latitude: "Latitude",
  Longitude: "Longitude"
};

function popupContent(p) {
  let rows = '';
  Object.keys(labels).forEach(k => {
    if (p[k] !== null && p[k] !== undefined && p[k] !== '') {
      rows += `<tr><td>${labels[k]}</td><td>${escapeHtml(String(p[k]))}</td></tr>`;
    }
  });
  return `<table class="popup-table">${rows}</table>`;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;'
  }[c]));
}

function draw(data) {
  if (geoLayer) map.removeLayer(geoLayer);

  geoLayer = L.geoJSON(data, {
    pointToLayer: (feature, latlng) => L.circleMarker(latlng, {
      radius: 7,
      weight: 1,
      fillOpacity: 0.8
    }),
    onEachFeature: (feature, layer) => {
      layer.bindPopup(popupContent(feature.properties));
    }
  }).addTo(map);

  const bounds = geoLayer.getBounds();
  if (bounds.isValid()) map.fitBounds(bounds.pad(0.05));

  features = data.features;
  updateResults(features);
}

function updateResults(list) {
  const results = document.getElementById('results');
  const count = document.getElementById('result-count');
  count.textContent = `${list.length} entreprise(s)`;

  results.innerHTML = '';
  list.slice(0, 100).forEach((feature) => {
    const div = document.createElement('div');
    div.className = 'result';
    const p = feature.properties;
    div.innerHTML = `<strong>${escapeHtml(String(p.Nom_de_l_e ?? 'Sans nom'))}</strong>
      ${escapeHtml(String(p.Commune ?? ''))} ${p.Arrondisse ? '— ' + escapeHtml(String(p.Arrondisse)) : ''}`;
    div.onclick = () => {
      const [lng, lat] = feature.geometry.coordinates;
      map.setView([lat, lng], 15);
      const layer = geoLayer.getLayers().find(l =>
        l.feature === feature
      );
      if (layer) layer.openPopup();
    };
    results.appendChild(div);
  });
}

document.getElementById('search').addEventListener('input', e => {
  const q = e.target.value.trim().toLowerCase();
  const filtered = features.filter(f =>
    Object.values(f.properties).some(v =>
      String(v ?? '').toLowerCase().includes(q)
    )
  );
  updateResults(filtered);
});

document.getElementById('clear').onclick = () => {
  document.getElementById('search').value = '';
  updateResults(features);
};

document.getElementById('panel-toggle').onclick = () => {
  document.querySelector('.panel').classList.toggle('open');
};

fetch('data/entreprises.geojson')
  .then(r => r.json())
  .then(draw)
  .catch(err => {
    console.error(err);
    alert("Impossible de charger les données cartographiques.");
  });
