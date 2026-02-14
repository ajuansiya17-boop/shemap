/* ═══════════════════════════════════════════════
   SheMap — Application Logic
   ═══════════════════════════════════════════════ */

/* ─── STATE ─────────────────────────────────── */
let map, userMarker, markersLayer;
let userLat = null, userLng = null;
let activeFilter = 'all';

/* ─── SAMPLE DATA ───────────────────────────── */
const sampleToilets = [
  {
    id: 1, name: "City Mall Restroom", dLat: 0.003, dLng: 0.004,
    cleanliness: 4.5, hygiene: 4.2,
    water: true, dustbin: true, tissue: true, breastfeeding: true,
    ratings: [5, 4, 5, 4, 5]
  },
  {
    id: 2, name: "Metro Station Facility", dLat: -0.002, dLng: 0.005,
    cleanliness: 3.2, hygiene: 2.8,
    water: true, dustbin: false, tissue: false, breastfeeding: false,
    ratings: [3, 4, 3, 3, 3]
  },
  {
    id: 3, name: "Central Park Washroom", dLat: 0.005, dLng: -0.003,
    cleanliness: 4.8, hygiene: 4.7,
    water: true, dustbin: true, tissue: true, breastfeeding: false,
    ratings: [5, 5, 5, 4, 5]
  },
  {
    id: 4, name: "Bus Stand Public Toilet", dLat: -0.004, dLng: -0.002,
    cleanliness: 2.1, hygiene: 1.9,
    water: false, dustbin: false, tissue: false, breastfeeding: false,
    ratings: [2, 3, 2, 1, 2]
  },
  {
    id: 5, name: "Galaxy Shopping Center", dLat: 0.001, dLng: -0.006,
    cleanliness: 4.0, hygiene: 3.8,
    water: true, dustbin: true, tissue: false, breastfeeding: true,
    ratings: [4, 4, 4, 4, 4]
  },
  {
    id: 6, name: "Railway Station Restroom", dLat: -0.006, dLng: 0.001,
    cleanliness: 3.7, hygiene: 3.4,
    water: true, dustbin: true, tissue: false, breastfeeding: false,
    ratings: [4, 3, 4, 4, 3]
  },
  {
    id: 7, name: "Sunrise Hospital Washroom", dLat: 0.004, dLng: 0.002,
    cleanliness: 4.9, hygiene: 4.8,
    water: true, dustbin: true, tissue: true, breastfeeding: true,
    ratings: [5, 5, 5, 5, 4]
  },
  {
    id: 8, name: "Night Market Toilet", dLat: -0.001, dLng: -0.005,
    cleanliness: 1.8, hygiene: 1.5,
    water: false, dustbin: false, tissue: false, breastfeeding: false,
    ratings: [2, 2, 1, 2, 2]
  },
  {
    id: 9, name: "Community Health Center", dLat: 0.006, dLng: 0.003,
    cleanliness: 4.2, hygiene: 4.0,
    water: true, dustbin: true, tissue: true, breastfeeding: true,
    ratings: [4, 4, 5, 4, 4]
  },
  {
    id: 10, name: "Public Library Restroom", dLat: -0.003, dLng: 0.006,
    cleanliness: 3.5, hygiene: 3.3,
    water: true, dustbin: false, tissue: true, breastfeeding: false,
    ratings: [3, 4, 3, 4, 3]
  },
  {
    id: 11, name: "Heritage Museum Washroom", dLat: 0.002, dLng: -0.004,
    cleanliness: 4.6, hygiene: 4.5,
    water: true, dustbin: true, tissue: true, breastfeeding: false,
    ratings: [5, 5, 4, 5, 4]
  },
  {
    id: 12, name: "Stadium East Wing Restroom", dLat: -0.005, dLng: -0.004,
    cleanliness: 2.9, hygiene: 2.6,
    water: true, dustbin: false, tissue: false, breastfeeding: false,
    ratings: [3, 3, 3, 2, 3]
  }
];

/* ─── HELPERS ───────────────────────────────── */
function overallScore(t) {
  return ((t.cleanliness + t.hygiene) / 2).toFixed(1);
}

function starsHTML(score, cls) {
  let s = '';
  for (let i = 1; i <= 5; i++) {
    s += `<span class="${cls}${i <= Math.round(score) ? ' filled' : ''}">★</span>`;
  }
  return s;
}

function statusLabel(score, cls) {
  if (score >= 4) return `<span class="${cls} clean">✓ Clean & Usable</span>`;
  return `<span class="${cls} dirty">✗ Not Recommended</span>`;
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function distLabel(km) {
  return km < 1 ? (km * 1000).toFixed(0) + ' m' : km.toFixed(1) + ' km';
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function amenityTag(available, icon, label) {
  return `<span class="amenity-tag ${available ? 'available' : 'unavailable'}">${icon} ${label}</span>`;
}

function popupAmenity(available, label) {
  return `<span class="popup-amenity ${available ? 'yes' : ''}">${available ? '✓' : '✗'} ${label}</span>`;
}

/* ─── CUSTOM ICONS ──────────────────────────── */
function toiletIcon(score) {
  const color = score >= 4 ? '#34D399' : '#F87171';
  return L.divIcon({
    className: '',
    html: `<div style="
      width:36px;height:36px;border-radius:50%;
      background:${color};display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 10px ${color}88;border:3px solid #fff;">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="#fff"><path d="M8 1a3 3 0 0 0-3 3v1H4a1 1 0 0 0-1 1v7a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6a1 1 0 0 0-1-1h-1V4a3 3 0 0 0-3-3zm0 1.5A1.5 1.5 0 0 1 9.5 4v1h-3V4A1.5 1.5 0 0 1 8 2.5z"/></svg>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });
}

const userIconMarker = L.divIcon({
  className: '',
  html: `<div style="
    width:22px;height:22px;border-radius:50%;
    background:#7C3AED;border:4px solid #fff;
    box-shadow:0 0 0 6px rgba(124,58,237,.3), 0 2px 12px rgba(0,0,0,.4);
  "></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

/* ─── INIT MAP ──────────────────────────────── */
function initMap(lat, lng) {
  if (!map) {
    map = L.map('map', { zoomControl: false }).setView([lat, lng], 15);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    markersLayer = L.layerGroup().addTo(map);
  } else {
    map.setView([lat, lng], 15);
  }
}

/* ─── PLACE MARKERS ─────────────────────────── */
function placeMarkers(lat, lng) {
  markersLayer.clearLayers();

  // User marker
  userMarker = L.marker([lat, lng], { icon: userIconMarker })
    .bindPopup('<div style="font-family:Inter,sans-serif;color:#F0ECF9;"><strong>📍 You are here</strong></div>')
    .addTo(markersLayer);

  const toilets = resolveToilets(lat, lng);
  const filtered = applyFilter(toilets);

  filtered.forEach(t => {
    const score = parseFloat(overallScore(t));
    const dist = haversine(lat, lng, t.lat, t.lng);
    const popup = `
      <div class="popup-name">${t.name}</div>
      <div class="popup-stars">${starsHTML(score, 'star')}</div>
      <div style="font-size:.78rem;color:#A09BB5;margin-bottom:6px;">
        Overall: ${overallScore(t)} · ${distLabel(dist)}
      </div>
      ${statusLabel(score, 'popup-status')}
      <div style="font-size:.72rem;color:#A09BB5;margin-top:6px;">
        🧹 Cleanliness: ${t.cleanliness.toFixed(1)} · 🧼 Hygiene: ${t.hygiene.toFixed(1)}
      </div>
      <div class="popup-amenities">
        ${popupAmenity(t.water, 'Water')}
        ${popupAmenity(t.dustbin, 'Pad Bin')}
        ${popupAmenity(t.tissue, 'Tissue')}
        ${popupAmenity(t.breastfeeding, 'Nursing')}
      </div>
    `;
    L.marker([t.lat, t.lng], { icon: toiletIcon(score) })
      .bindPopup(popup)
      .addTo(markersLayer);
  });

  updateStats(filtered);
  buildCards(filtered, lat, lng);
}

/* ─── RESOLVE & FILTER ──────────────────────── */
function resolveToilets(lat, lng) {
  return sampleToilets.map(t => ({
    ...t,
    lat: lat + t.dLat,
    lng: lng + t.dLng
  }));
}

function applyFilter(toilets) {
  if (activeFilter === 'all') return toilets;
  if (activeFilter === 'clean') return toilets.filter(t => parseFloat(overallScore(t)) >= 4);
  if (activeFilter === 'water') return toilets.filter(t => t.water);
  if (activeFilter === 'dustbin') return toilets.filter(t => t.dustbin);
  if (activeFilter === 'tissue') return toilets.filter(t => t.tissue);
  if (activeFilter === 'breastfeeding') return toilets.filter(t => t.breastfeeding);
  return toilets;
}

/* ─── UPDATE STATS ──────────────────────────── */
function updateStats(toilets) {
  const clean = toilets.filter(t => parseFloat(overallScore(t)) >= 4).length;
  const avg = toilets.length > 0
    ? (toilets.reduce((s, t) => s + parseFloat(overallScore(t)), 0) / toilets.length).toFixed(1)
    : '—';
  document.getElementById('statTotal').textContent = toilets.length;
  document.getElementById('statClean').textContent = clean;
  document.getElementById('statAvg').textContent = avg + ' ★';
}

/* ─── BUILD CARDS ───────────────────────────── */
function buildCards(toilets, uLat, uLng) {
  const grid = document.getElementById('cardsGrid');
  grid.innerHTML = '';

  const sorted = toilets.map(t => ({
    ...t,
    dist: haversine(uLat, uLng, t.lat, t.lng)
  })).sort((a, b) => a.dist - b.dist);

  sorted.forEach(t => {
    const score = parseFloat(overallScore(t));
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-header">
        <span class="card-name">${t.name}</span>
        ${statusLabel(score, 'card-status')}
      </div>
      <div class="card-stars">${starsHTML(score, 'star')}</div>
      <div class="card-dist">
        📍 ${distLabel(t.dist)} away · Overall: ${overallScore(t)} · 🧹${t.cleanliness.toFixed(1)} · 🧼${t.hygiene.toFixed(1)}
      </div>
      <div class="amenity-tags">
        ${amenityTag(t.water, '💧', 'Water')}
        ${amenityTag(t.dustbin, '🗑️', 'Pad Disposal')}
        ${amenityTag(t.tissue, '🧻', 'Tissue')}
        ${amenityTag(t.breastfeeding, '🤱', 'Nursing Room')}
      </div>
      <div class="card-actions">
        <button class="btn-rate" onclick="event.stopPropagation(); openRatingModal(${t.id})">⭐ Rate This</button>
      </div>
    `;
    card.addEventListener('click', () => {
      map.setView([t.lat, t.lng], 17);
      window.scrollTo({ top: document.querySelector('.map-wrapper').offsetTop - 70, behavior: 'smooth' });
    });
    grid.appendChild(card);
  });

  document.getElementById('cardsSection').style.display = '';
}

/* ─── FILTER CHIPS ──────────────────────────── */
function setFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll('.filter-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.filter === filter);
  });
  if (userLat !== null) {
    placeMarkers(userLat, userLng);
  }
}

// Initialize filter chip listeners
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => setFilter(chip.dataset.filter));
  });
});

/* ─── RATING MODAL ──────────────────────────── */
let currentRatingToiletId = null;
let modalRatings = { cleanliness: 0, hygiene: 0, overall: 0 };
let modalToggles = { water: false, dustbin: false, tissue: false, breastfeeding: false };

function openRatingModal(toiletId) {
  currentRatingToiletId = toiletId;
  const t = sampleToilets.find(x => x.id === toiletId);
  if (!t) return;

  document.getElementById('modalToiletName').textContent = t.name;

  // Reset ratings
  modalRatings = { cleanliness: 0, hygiene: 0, overall: 0 };
  modalToggles = { water: false, dustbin: false, tissue: false, breastfeeding: false };
  renderModalStars();
  renderModalToggles();

  document.getElementById('ratingModal').classList.add('show');
}

function closeRatingModal() {
  document.getElementById('ratingModal').classList.remove('show');
  currentRatingToiletId = null;
}

function setModalRating(category, value) {
  modalRatings[category] = value;
  renderModalStars();
}

function renderModalStars() {
  ['cleanliness', 'hygiene', 'overall'].forEach(cat => {
    const container = document.getElementById(`stars-${cat}`);
    if (!container) return;
    container.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
      const btn = document.createElement('button');
      btn.className = `star-btn${i <= modalRatings[cat] ? ' filled' : ''}`;
      btn.textContent = '★';
      btn.onclick = () => setModalRating(cat, i);
      container.appendChild(btn);
    }
  });
}

function toggleModalAmenity(key) {
  modalToggles[key] = !modalToggles[key];
  renderModalToggles();
}

function renderModalToggles() {
  ['water', 'dustbin', 'tissue', 'breastfeeding'].forEach(key => {
    const el = document.getElementById(`toggle-${key}`);
    if (el) el.classList.toggle('on', modalToggles[key]);
  });
}

function submitRating() {
  const t = sampleToilets.find(x => x.id === currentRatingToiletId);
  if (!t) return;

  // Apply ratings
  if (modalRatings.cleanliness > 0) {
    t.cleanliness = +((t.cleanliness + modalRatings.cleanliness) / 2).toFixed(1);
  }
  if (modalRatings.hygiene > 0) {
    t.hygiene = +((t.hygiene + modalRatings.hygiene) / 2).toFixed(1);
  }
  if (modalRatings.overall > 0) {
    t.ratings.push(modalRatings.overall);
  }

  // Apply toggle reports
  if (modalToggles.water) t.water = true;
  if (modalToggles.dustbin) t.dustbin = true;
  if (modalToggles.tissue) t.tissue = true;
  if (modalToggles.breastfeeding) t.breastfeeding = true;

  closeRatingModal();
  toast('✅ Thank you! Your rating has been submitted.');

  // Refresh map & cards
  if (userLat !== null) {
    placeMarkers(userLat, userLng);
  }
}

// Close modal on backdrop click
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('ratingModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('ratingModal')) {
      closeRatingModal();
    }
  });
});

/* ─── MAIN ACTION ───────────────────────────── */
function findToilets() {
  const overlay = document.getElementById('mapOverlay');
  overlay.innerHTML = '<div class="spinner"></div><p>Detecting your location…</p>';
  overlay.classList.remove('hidden');

  if (!navigator.geolocation) {
    toast('Geolocation is not supported by your browser.');
    fallback();
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      userLat = pos.coords.latitude;
      userLng = pos.coords.longitude;
      initMap(userLat, userLng);
      placeMarkers(userLat, userLng);
      overlay.classList.add('hidden');
      toast('📍 Location detected! Showing nearby restrooms.');
    },
    err => {
      console.warn('Geolocation error:', err.message);
      toast('Location access denied. Showing default area.');
      fallback();
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function fallback() {
  userLat = 28.6139;
  userLng = 77.2090;
  initMap(userLat, userLng);
  placeMarkers(userLat, userLng);
  document.getElementById('mapOverlay').classList.add('hidden');
}
