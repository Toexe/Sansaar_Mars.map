// ============================================================================
// MARTIAN MAP — THREE-STAGE EXPERIENCE WITH INTERACTIVE TRANSITIONS
// ============================================================================

const SIMULATED_LOADING_DURATION_MS = 5500; // Simulated loading duration (ms)
const FACT_ROTATION_INTERVAL_MS = 1800;     // Rotate scientific facts interval (ms)

let missionFacts = [];
let factHistory = [];
let factRotationTimer = null;
let loadingProgressTimer = null;

let mapInitialized = false;
let currentMap = null;
let DATA = {};
const MAP_MAX_ZOOM = 7;

// ----------------------------------------------------------------------------
// FACT DATABASE RETRIEVAL & RUNTIME RANDOM SELECTION (fact.json)
// ----------------------------------------------------------------------------
async function fetchFactDatabase() {
  try {
    const res = await fetch('./fact.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    if (data && Array.isArray(data.facts) && data.facts.length > 0) {
      missionFacts = data.facts;
      console.log(`[Fact Archive] Loaded ${missionFacts.length} facts from fact.json`);
    } else {
      throw new Error('fact.json contains no valid facts array');
    }
  } catch (err) {
    console.warn('[Fact Archive] Using fallback or handling missing fact.json gracefully:', err);
    if (typeof FALLBACK_FACTS_DATA !== 'undefined' && FALLBACK_FACTS_DATA && Array.isArray(FALLBACK_FACTS_DATA.facts)) {
      missionFacts = FALLBACK_FACTS_DATA.facts;
    } else {
      missionFacts = [];
    }
  }
}

function getNextRandomFact() {
  if (!missionFacts || missionFacts.length === 0) {
    return {
      id: 0,
     category: 'FILE MISSING',
      fact: 'file not found or empty: fact.json',
    };
  }

  if (missionFacts.length === 1) return missionFacts[0];

  // Avoid immediately displaying recently shown facts
  let candidates = missionFacts.filter(item => !factHistory.includes(item.id));
  if (candidates.length === 0) {
    const lastId = factHistory[factHistory.length - 1];
    factHistory = [lastId];
    candidates = missionFacts.filter(item => item.id !== lastId);
  }

  const selectedIndex = Math.floor(Math.random() * candidates.length);
  const selectedFact = candidates[selectedIndex];

  factHistory.push(selectedFact.id);
  const maxHistory = Math.min(missionFacts.length - 1, 5);
  while (factHistory.length > maxHistory) {
    factHistory.shift();
  }

  return selectedFact;
}

function displayRandomFact(animate = true) {
  const fact = getNextRandomFact();
  const categoryEl = document.getElementById('fact-category');
  const textEl = document.getElementById('fact-text');
  const containerEl = document.getElementById('fact-container');

  if (!categoryEl || !textEl) return;

  if (animate && containerEl) {
    containerEl.classList.add('fact-fade-out');
    setTimeout(() => {
      categoryEl.textContent = (fact.category || 'SCIENCE ARCHIVE').toUpperCase();
      textEl.textContent = fact.fact;
      containerEl.classList.remove('fact-fade-out');
      containerEl.classList.add('fact-fade-in');
      setTimeout(() => {
        containerEl.classList.remove('fact-fade-in');
      }, 300);
    }, 200);
  } else {
    categoryEl.textContent = (fact.category || 'SCIENCE ARCHIVE').toUpperCase();
    textEl.textContent = fact.fact;
  }
}

// ----------------------------------------------------------------------------
// SIMULATED LOADING PROCESS & TIMER CLEANUP
// ----------------------------------------------------------------------------
function stopSimulatedLoading() {
  if (loadingProgressTimer) {
    clearInterval(loadingProgressTimer);
    loadingProgressTimer = null;
  }
  if (factRotationTimer) {
    clearInterval(factRotationTimer);
    factRotationTimer = null;
  }
}

function startSimulatedLoading() {
  stopSimulatedLoading();

  const progressBar = document.getElementById('loading-progress-bar');
  const percentText = document.getElementById('loading-percent');
  const statusTicker = document.getElementById('loading-status-text');
  const bg1 = document.getElementById('loading-bg-1');
  const bg2 = document.getElementById('loading-bg-2');

  if (progressBar) progressBar.style.width = '0%';
  if (percentText) percentText.textContent = '0%';
  if (statusTicker) statusTicker.textContent = 'CALIBRATING ORBITAL SENSORS...';
  if (bg1) bg1.classList.add('active-bg');
  if (bg2) bg2.classList.remove('active-bg');

  // Display initial fact immediately
  displayRandomFact(false);

  // Set up rotating facts at configured interval
  factRotationTimer = setInterval(() => {
    displayRandomFact(true);
  }, FACT_ROTATION_INTERVAL_MS);

  // Start progress bar timer
  const startTime = performance.now();
  const tickIntervalMs = 35;

  loadingProgressTimer = setInterval(() => {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(100, Math.floor((elapsed / SIMULATED_LOADING_DURATION_MS) * 100));

    if (progressBar) {
      progressBar.style.width = `${progress}%`;
      progressBar.setAttribute('aria-valuenow', progress);
    }
    if (percentText) {
      percentText.textContent = `${progress}%`;
    }

    // Crossfade space background image midway through buffering
    if (progress >= 50 && bg1 && bg2 && !bg2.classList.contains('active-bg')) {
      bg1.classList.remove('active-bg');
      bg2.classList.add('active-bg');
    }

    if (statusTicker) {
      if (progress < 25) {
        statusTicker.textContent = 'CALIBRATING ORBITAL TELEMETRY & ATTITUDE SENSORS...';
      } else if (progress < 50) {
        statusTicker.textContent = 'ESTABLISHING SECURE DEEP SPACE NETWORK LINK...';
      } else if (progress < 75) {
        statusTicker.textContent = 'DOWNLINKING TOPOGRAPHIC & SURFACE ELEVATION DATA...';
      } else if (progress < 95) {
        statusTicker.textContent = 'SYNCHRONIZING 250 MARTIAN GEOSPATIAL VECTORS...';
      } else {
        statusTicker.textContent = 'MISSION INITIALIZATION COMPLETE · ACCESSING ATLAS';
      }
    }

    if (progress >= 100) {
      stopSimulatedLoading();
      setTimeout(() => {
        navigateToPage('page-map');
      }, 400);
    }
  }, tickIntervalMs);
}

// ----------------------------------------------------------------------------
// INTERACTIVE TRANSITION & NAVIGATION CONTROLLER
// ----------------------------------------------------------------------------
function initiateInteractiveLaunch() {
  const introPage = document.getElementById('page-intro');
  const portal = document.getElementById('transit-portal');

  if (introPage) introPage.classList.add('transit-active');
  if (portal) portal.classList.add('active');

  setTimeout(() => {
    navigateToPage('page-loading');
    startSimulatedLoading();
    if (portal) {
      setTimeout(() => portal.classList.remove('active'), 250);
    }
  }, 480);
}

function navigateToPage(targetPageId) {
  const pages = ['page-intro', 'page-loading', 'page-map'];
  pages.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (id === targetPageId) {
      el.hidden = false;
      el.classList.add('active');
    } else {
      el.hidden = true;
      el.classList.remove('active');
    }
  });

  const introPage = document.getElementById('page-intro');
  if (targetPageId === 'page-intro' && introPage) {
    introPage.classList.remove('transit-active');
  }

  if (targetPageId !== 'page-loading') {
    stopSimulatedLoading();
  }

  if (targetPageId === 'page-map') {
    onEnterMapPage();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function onEnterMapPage() {
  if (!mapInitialized && Object.keys(DATA).length > 0) {
    initializeMap();
    mapInitialized = true;
  }
  if (currentMap) {
    setTimeout(() => {
      currentMap.invalidateSize({ pan: false });
    }, 150);
  }
}


const BASEMAPS = {
  celestia: {
    name: 'Mars Shaded Surface (Celestia 16K)',
    url: 'https://s3-eu-west-1.amazonaws.com/whereonmars.cartodb.net/celestia_mars-shaded-16k_global/{z}/{x}/{y}.png',
    attribution: 'Tiles © WhereOnMars / Celestia / NASA',
    minZoom: 1,
    maxZoom: 5,
    tms: true,
    note: 'BASEMAP: CELESTIA 16K SHADED SURFACE (S3 CDN)'
  },
  opm: {
    name: 'OpenPlanetaryMap Basemap',
    url: 'https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm-mars-basemap-v0-2/all/{z}/{x}/{y}.png',
    urls: [
      'https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm-mars-basemap-v0-2/all/{z}/{x}/{y}.png',
      'https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm-mars-basemap-v0-1/all/{z}/{x}/{y}.png'
    ],
    attribution: 'Tiles © <a href="https://openplanetarymap.org/">OpenPlanetaryMap</a>',
    minZoom: 1,
    maxZoom: 7,
    tms: false,
    note: 'BASEMAP: OPENPLANETARYMAP (CARTO CDN)'
  },
  mola: {
    name: 'MOLA Color Elevation (Topography)',
    url: 'https://s3-eu-west-1.amazonaws.com/whereonmars.cartodb.net/mola-color/{z}/{x}/{y}.png',
    attribution: 'Tiles © WhereOnMars / NASA MOLA',
    minZoom: 1,
    maxZoom: 5,
    tms: true,
    note: 'BASEMAP: NASA MOLA COLOR ELEVATION (S3 CDN)'
  },
  hillshade: {
    name: 'Mars Hillshade (Monochrome)',
    url: 'https://s3.us-east-2.amazonaws.com/opmmarstiles/hillshade-tiles/{z}/{x}/{y}.png',
    attribution: 'Tiles © OpenPlanetaryMap / USGS',
    minZoom: 1,
    maxZoom: 6,
    tms: true,
    note: 'BASEMAP: MARS HILLSHADE (OPM S3 CDN)'
  }
};

// Each member's "notes" in locations.json are attached to the place whose name matches.
function applyMemberNotes(data) {
  const places = [...data.green, ...data.orange];
  const norm = s => String(s).trim().toLowerCase();
  Object.entries(data.members || {}).forEach(([id, m]) => {
    ((m && m.notes) || []).forEach(n => {
      if (!n || !n.location || !n.note) return;
      const q = norm(n.location);
      let hits = places.filter(p => norm(p.name) === q);
      if (!hits.length) hits = places.filter(p => norm(p.name).includes(q));
      if (hits.length !== 1) {
        console.warn(`Member ${id}: location "${n.location}" ` + (hits.length ? 'matches several places, be more specific.' : 'was not found.'));
        return;
      }
      if (hits[0].extra) console.warn(`"${hits[0].name}" already has a note; Member ${id}'s note replaces it.`);
      hits[0].member = Number(id);
      hits[0].extra = n.note;
    });
  });
  return data;
}

function initializeMap() {
  const map = L.map('map', {
  zoomControl: false,
  preferCanvas: true,
  worldCopyJump: false,
  minZoom: 1,
  maxZoom: MAP_MAX_ZOOM,
  maxBounds: [[-85, -180], [85, 180]],
  maxBoundsViscosity: 0.8,
  zoomSnap: 1,
  zoomDelta: 1
}).setView([8, 0], 2);
L.control.zoom({ position: 'bottomleft' }).addTo(map);
currentMap = map;

let currentTileLayer = null;
let pendingTileLayer = null;
let currentBasemapKey = null;
let loadToken = 0;
const failedKeys = new Set();
const FALLBACK_ORDER = ['celestia', 'opm', 'mola', 'hillshade'];
 const mapNote = document.querySelector('.map-note');
 const mapLoading = document.getElementById('map-loading');
 const layerSelect = document.getElementById('layer-select');

function showMapLoading(name) {
  mapLoading.classList.add('active');
  mapLoading.setAttribute('aria-busy', 'true');
  mapLoading.querySelector('.loading-title').textContent = 'LOADING ' + name.toUpperCase();
  mapLoading.querySelector('.loading-subtitle').textContent = 'Waiting for map tiles...';
}

function hideMapLoading() {
  mapLoading.classList.remove('active');
  mapLoading.setAttribute('aria-busy', 'false');
}

// OpenPlanetaryMap only: free horizontal dragging, the world repeats (3 copies),
// blinking lines mark the seams between copies, and every point is drawn on each copy.
let opmMode = false;
let pendingRoute = null;   // route waiting for OpenPlanetaryMap to finish loading
let lastRoute = null;
let drawRouteFn = null;
let seamLayer = null;
const seamRenderer = L.svg();
function wrapCenter() {
  const c = map.getCenter();
  if (c.lng < -180 || c.lng > 180) {
    const lng = ((c.lng + 180) % 360 + 360) % 360 - 180;   // identical copy, so the jump is invisible
    map.setView([c.lat, lng], map.getZoom(), { animate: false });
  } else if (opmMode && Math.abs(c.lat) > 85) {
    map.panTo([Math.sign(c.lat) * 85, c.lng]);              // ease back if dragged far past a pole
  }
}
function syncEntry(entry) {
  const set = (m, on) => {
    if (on) { if (!map.hasLayer(m)) m.addTo(map); }
    else if (map.hasLayer(m)) map.removeLayer(m);
  };
  const visible = entry.visible !== false;
  set(entry.marker, visible);
  entry.copies.forEach(c => set(c, visible && opmMode));
}
function applyBasemapMode(key) {
  const on = key === 'opm';
  if (on === opmMode) return;
  opmMode = on;
  if (on) {
    map.setMinZoom(2);   // two maps side by side are wide enough to fill the screen from zoom 2
    map.setMaxBounds([[-85, -180], [85, 540]]);   // map 1 = -180..180, map 2 = 180..540 (no overlap)
    map.setView([map.getCenter().lat, 180], map.getZoom(), { animate: false });   // start on the seam
    seamLayer = L.layerGroup([180].map(lng => L.polyline([[-85.05, lng], [85.05, lng]], {
      renderer: seamRenderer, className: 'seam-line', color: '#ff963d', weight: 2, dashArray: '8 8', interactive: false
    }))).addTo(map);
  } else {
    wrapCenter();   // bring the view back onto the first map
    map.setMaxBounds([[-85, -180], [85, 180]]);
    map.setMinZoom(1);
    if (seamLayer) { map.removeLayer(seamLayer); seamLayer = null; }
  }
  markers.forEach(syncEntry);
  if (drawRouteFn) {
    if (on) {
      const r = pendingRoute || lastRoute;
      if (r) { drawRouteFn(r, false, !pendingRoute); pendingRoute = null; }
    } else if (lastRoute) {
      drawRouteFn(lastRoute, true, true);   // other basemaps have a single world: draw it directly
    }
  }
}

function setBasemap(key, urlIndex = 0) {
  const config = BASEMAPS[key];
  if (!config) return;
  const tileUrl = (config.urls && config.urls[urlIndex]) || config.url;

  // Selecting the already-active layer cancels an unfinished switch.
  if (key === currentBasemapKey && currentTileLayer) {
    if (pendingTileLayer) {
      ++loadToken;
      map.removeLayer(pendingTileLayer);
      pendingTileLayer = null;
      hideMapLoading();
      if (layerSelect) layerSelect.value = currentBasemapKey;
    }
    return;
  }

  const token = ++loadToken;
  if (pendingTileLayer) {
    map.removeLayer(pendingTileLayer);
    pendingTileLayer = null;
  }

  showMapLoading(config.name);

  let loadedTiles = 0;
  let errorTiles = 0;
  let finished = false;

  const nextLayer = L.tileLayer(tileUrl, {
    minZoom: config.minZoom,
    maxNativeZoom: config.maxZoom,
    maxZoom: MAP_MAX_ZOOM,
    attribution: config.attribution,
    tms: config.tms === true,
    noWrap: key !== 'opm'
  });
  pendingTileLayer = nextLayer;

  nextLayer.on('tileload', () => {
    loadedTiles++;
    completeLoading();
  });
  nextLayer.on('tileerror', () => { errorTiles++; });

  const timeout = setTimeout(() => {
    failLoading('The map provider took too long. Previous surface retained.');
  }, 30000);

  function failLoading(message) {
    if (finished || token !== loadToken) return;
    finished = true;
    clearTimeout(timeout);
    map.removeLayer(nextLayer);
    if (pendingTileLayer === nextLayer) pendingTileLayer = null;
    console.warn('Basemap failed:', config.name, tileUrl);
    if (config.urls && urlIndex + 1 < config.urls.length) {   // try the next address for this basemap
      setBasemap(key, urlIndex + 1);
      return;
    }
    if (key === 'opm' && pendingRoute && drawRouteFn) { const r = pendingRoute; pendingRoute = null; drawRouteFn(r, true); }
    mapLoading.querySelector('.loading-title').textContent = 'MAP LOADING FAILED';
    mapLoading.querySelector('.loading-subtitle').textContent = message;
    if (layerSelect && currentBasemapKey) layerSelect.value = currentBasemapKey;
    failedKeys.add(key);
    // Nothing is showing yet (first load failed): try the next provider automatically.
    if (!currentTileLayer) {
      const next = FALLBACK_ORDER.find(k => !failedKeys.has(k));
      if (next) {
        mapLoading.querySelector('.loading-subtitle').textContent = message + ' Trying ' + BASEMAPS[next].name + '...';
        setTimeout(() => { if (token === loadToken) setBasemap(next); }, 1500);
        return;
      }
    }
    setTimeout(() => {
      if (token === loadToken) hideMapLoading();
    }, 2500);
  }

  function completeLoading() {
    if (finished || token !== loadToken) return;
    finished = true;
    clearTimeout(timeout);
    const previousLayer = currentTileLayer;
    currentTileLayer = nextLayer;
    currentBasemapKey = key;
    pendingTileLayer = null;

    if (previousLayer) map.removeLayer(previousLayer);
    if (mapNote) {
      mapNote.textContent = config.note + ' · FEATURES ARE APPROXIMATE CENTERS' + (key === 'opm' ? ' · 2 MAPS SIDE BY SIDE · BLINKING LINE = MAP EDGE' : '');
    }
    if (layerSelect) layerSelect.value = key;
    try { applyBasemapMode(key); } catch (err) { console.error('OpenPlanetaryMap free-drag mode failed:', err); }
    hideMapLoading();
  }

  nextLayer.once('load', () => {
    if (token !== loadToken) return;
    if (loadedTiles === 0) {
      failLoading('No map tiles were received. Previous surface retained.');
      return;
    }

    if (errorTiles > 0) {
      console.warn(`${config.name}: ${loadedTiles} tiles loaded, ${errorTiles} tiles failed.`);
    }
    completeLoading();
  });

  nextLayer.addTo(map);
}

setBasemap('celestia');
if (layerSelect) {
  layerSelect.addEventListener('change', e => setBasemap(e.target.value));
}

const all = [
 ...DATA.green.map(x=>({...x,color:'green',group:'Environmental site'})),
 ...DATA.orange.map(x=>({...x,color:'orange',group:'Named feature'}))
];
const markers = new Map();
const legendGreen = document.getElementById('legend-green');
const legendOrange = document.getElementById('legend-orange');
if (legendGreen) legendGreen.textContent = DATA.green.length;
if (legendOrange) legendOrange.textContent = DATA.orange.length + ' LIST ENTRIES';
const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const quoteSlider = document.getElementById('quote-slider');
const sliderBadge = document.getElementById('slider-badge');
const sliderMemberName = document.getElementById('slider-member-name');
const sliderLocation = document.getElementById('slider-location');
const sliderQuote = document.getElementById('slider-quote');
const sliderClose = document.getElementById('slider-close');

function getMemberInfo(rawMember) {
  if (rawMember === null || rawMember === undefined || rawMember === '') return null;
  const members = DATA.members || {};
  const names = new Proxy(members, { get: (t, id) => { const m = t[id]; return m && (typeof m === 'string' ? m : m.name); } });
  // Preferred: "member": 2  -> name comes from the "members" list in locations.json
  // Also accepted: {"id": 2, "name": "..."} or "Member 2 - Name" (older formats)
  if (typeof rawMember === 'number' || /^\d+$/.test(String(rawMember).trim())) {
    const id = String(rawMember).trim();
    return { id, name: names[id] || ('Member ') };
  }
  if (typeof rawMember === 'object') {
    const id = String(rawMember.id || 1).replace(/\D/g, '') || '1';
    return { id, name: names[id] || rawMember.name || ('Member ' ) };
  }
  const str = String(rawMember);
  const match = str.match(/\d+/);
  const id = match ? match[0] : '1';
  const name = names[id] || (str.includes('-') ? str.split('-')[1].trim() : (str.startsWith('Member') ? str : ('Member ' + id + ': ' + str)));
  return { id, name };
}

function showQuoteSlider(point) {
  if (!quoteSlider) return;
  if (!point.extra) { quoteSlider.classList.remove('open'); return; }
  const member = getMemberInfo(point.member) || { id: '1', name: 'Member 1' };

  quoteSlider.setAttribute('data-member', member.id);
  sliderBadge.textContent = 'MEMBER ';
  sliderMemberName.textContent = member.name;
  sliderMemberName.hidden = /^member\s*\d+$/i.test(member.name.trim());
  sliderLocation.textContent = point.name;
  sliderQuote.textContent = point.extra;

  quoteSlider.classList.add('open');
  quoteSlider.setAttribute('aria-hidden', 'false');
}

function hideQuoteSlider() {
  if (!quoteSlider) return;
  quoteSlider.classList.remove('open');
  quoteSlider.setAttribute('aria-hidden', 'true');
}

if (sliderClose) {
  sliderClose.addEventListener('click', hideQuoteSlider);
}
map.on('popupclose', hideQuoteSlider);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && quoteSlider && quoteSlider.classList.contains('open')) hideQuoteSlider();
});

function selectPoint(p) {
  if (p.extra) showQuoteSlider(p);
  else hideQuoteSlider();
}

function markerIcon(color){return L.divIcon({className:'custom-marker',html:`<span class="marker-core ${color}"></span>`,iconSize: [18,18],iconAnchor:[9,9]});}
function popupHtml(p){
 const desc=p.details || `Approximate center of the named ${p.category || 'Mars'} feature. Coordinates are a map reference estimate, not a surveyed boundary.`;
 return `<div class="popup-title">${escapeHtml(p.name)}</div><div class="popup-kind" style="color:${p.color==='green'?'#4ee28a':'#ff963d'}">${escapeHtml(p.category||p.group)}</div><div class="popup-desc">${escapeHtml(desc)}</div><div class="popup-coord">Approx. ${p.lat.toFixed(2)}°, ${p.lon.toFixed(2)}°</div>`;
}
function makeMarker(p, dx) {
  const m = L.marker([p.lat, p.lon + dx], {
    icon: markerIcon(p.color),
    title: p.name
  }).bindPopup(popupHtml(p), p.extra ? {
    autoPanPaddingTopLeft: L.point(20, 70),
    autoPanPaddingBottomRight: window.innerWidth > 640 ? L.point(400, 20) : L.point(20, 300)
  } : {});
  m.on('click', () => selectPoint(p));
  return m;
}
all.forEach(p => {
  const m = makeMarker(p, 0);
  const copies = [360].map(dx => makeMarker(p, dx));   // second map, shown only on OpenPlanetaryMap
  m.addTo(map);
  markers.set(p.name + (p.color === 'green' ? ' [environment]' : ' [named]'), { marker: m, copies, data: p });
});
const list=document.getElementById('results-list'), search=document.getElementById('search'), count=document.getElementById('count');
const fullscreenSearch=document.getElementById('fullscreen-search');
const fullscreenSuggestions=document.getElementById('fullscreen-suggestions');
let matchingPlaces=[];
let activeSuggestion=0;
const searchInputs=[search,fullscreenSearch];
function renderList(q=''){
 list.innerHTML='';
 const filtered=all.filter(p=>`${p.name} ${p.category||''}`.toLowerCase().includes(q.toLowerCase()));
 count.textContent=`${filtered.length} locations`;
 filtered.forEach(p=>{
  const b=document.createElement('button'); b.className='result';
  const dot=document.createElement('i'); dot.className='dot '+p.color;
  const wrap=document.createElement('span'); wrap.style.minWidth='0';
  const name=document.createElement('span'); name.className='label'; name.textContent=p.name;
  const small=document.createElement('small'); small.textContent=p.color==='green'?'ENVIRONMENT DATA':'MARS FEATURE';
  wrap.append(name,small); b.append(dot,wrap);
  b.addEventListener('click', () => {
  map.setView([p.lat, p.lon], Math.max(map.getZoom(), 4), { animate: true });
  const entry = [...markers.values()].find(x => x.data === p);
  if (entry) entry.marker.openPopup();
  selectPoint(p);
});
  list.appendChild(b);
 });
 markers.forEach(entry=>{
  entry.visible=`${entry.data.name} ${entry.data.category||''}`.toLowerCase().includes(q.toLowerCase());
  syncEntry(entry);
 });
}
function goToPlace(place){
 if(!place)return;
 searchInputs.forEach(input=>input.value=place.name);
 renderList(place.name);
 fullscreenSuggestions.hidden=true;
 fullscreenSearch.setAttribute('aria-expanded','false');
 map.setView([place.lat,place.lon],Math.max(map.getZoom(),4),{animate:true});
 const entry=[...markers.values()].find(item=>item.data===place);
 if(entry)entry.marker.openPopup();
 selectPoint(place);
}
function renderSuggestions(query){
 const normalizedQuery=query.trim().toLowerCase();
 activeSuggestion=0;
 fullscreenSuggestions.replaceChildren();
 const seenNames=new Set();
 matchingPlaces=normalizedQuery?all.filter(place=>{
  const name=place.name.toLowerCase();
  if(!`${place.name} ${place.category||''}`.toLowerCase().includes(normalizedQuery)||seenNames.has(name))return false;
  seenNames.add(name);
  return true;
 }).slice(0,8):[];
 matchingPlaces.forEach((place,index)=>{
  const option=document.createElement('button');
  option.type='button';
  option.className='fullscreen-suggestion';
  option.setAttribute('role','option');
  option.setAttribute('aria-selected',index===activeSuggestion?'true':'false');
  option.textContent=place.name;
  option.addEventListener('click',()=>goToPlace(place));
  fullscreenSuggestions.appendChild(option);
 });
 fullscreenSuggestions.hidden=matchingPlaces.length===0;
 fullscreenSearch.setAttribute('aria-expanded',String(matchingPlaces.length>0));
}
function submitFullscreenSearch(){
 const query=fullscreenSearch.value.trim().toLowerCase();
 if(!query)return;
 const place=all.find(item=>item.name.toLowerCase()===query)||matchingPlaces[0]||all.find(item=>item.name.toLowerCase().includes(query));
 goToPlace(place);
}
searchInputs.forEach(input=>input.addEventListener('input',()=>{
 searchInputs.forEach(otherInput=>{if(otherInput!==input)otherInput.value=input.value;});
 renderList(input.value);
 if(input===fullscreenSearch)renderSuggestions(input.value);
}));
fullscreenSearch.addEventListener('keydown',event=>{
 if(event.key==='ArrowDown'||event.key==='ArrowUp'){
  if(!matchingPlaces.length)return;
  event.preventDefault();
  activeSuggestion=(activeSuggestion+(event.key==='ArrowDown'?1:-1)+matchingPlaces.length)%matchingPlaces.length;
  fullscreenSuggestions.querySelectorAll('.fullscreen-suggestion').forEach((option,index)=>option.setAttribute('aria-selected',String(index===activeSuggestion)));
 }else if(event.key==='Enter'){
  event.preventDefault();
  if(matchingPlaces.length&&!fullscreenSuggestions.hidden)goToPlace(matchingPlaces[activeSuggestion]);
  else submitFullscreenSearch();
 }else if(event.key==='Escape'){
  fullscreenSuggestions.hidden=true;
  fullscreenSearch.setAttribute('aria-expanded','false');
 }
});
document.getElementById('fullscreen-submit').addEventListener('click',submitFullscreenSearch);
function clearSearch(input){searchInputs.forEach(searchInput=>searchInput.value='');renderList();renderSuggestions('');input.focus();}
document.getElementById('clear').addEventListener('click',()=>clearSearch(search));
document.getElementById('fullscreen-clear').addEventListener('click',()=>clearSearch(fullscreenSearch));
document.getElementById('reset').addEventListener('click',()=>{searchInputs.forEach(input=>input.value='');renderList();renderSuggestions('');map.closePopup();hideQuoteSlider();map.setView([8,0],2);});

const mapWrap=document.querySelector('.map-wrap');
const fullscreenToggle=document.getElementById('fullscreen-toggle');
function syncFullscreenUi(){
 const isFullscreen=document.fullscreenElement===mapWrap||mapWrap.classList.contains('fullscreen-fallback');
 document.body.classList.toggle('map-is-fullscreen',isFullscreen);
 fullscreenToggle.textContent=isFullscreen?'EXIT FULLSCREEN':'FULLSCREEN';
 fullscreenToggle.setAttribute('aria-label',isFullscreen?'Exit fullscreen map':'Enter fullscreen map');
 requestAnimationFrame(()=>map.invalidateSize({pan:false}));
}
function exitFallbackFullscreen(){
 mapWrap.classList.remove('fullscreen-fallback');
 syncFullscreenUi();
}
fullscreenToggle.addEventListener('click',async()=>{
 try{
  if(document.fullscreenElement===mapWrap)await document.exitFullscreen();
  else if(mapWrap.classList.contains('fullscreen-fallback'))exitFallbackFullscreen();
  else if(document.fullscreenEnabled&&mapWrap.requestFullscreen)await mapWrap.requestFullscreen();
  else{
   mapWrap.classList.add('fullscreen-fallback');
   syncFullscreenUi();
  }
 }catch(error){
  console.warn('Using fullscreen fallback:',error);
  mapWrap.classList.add('fullscreen-fallback');
  syncFullscreenUi();
 }
});
document.addEventListener('fullscreenchange',syncFullscreenUi);
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&mapWrap.classList.contains('fullscreen-fallback'))exitFallbackFullscreen();
});
renderList();

// ---------- Distance tool: haversine, radius = 3,500 km ----------
const MARS_RADIUS_KM = 3501.99;
const rad = d => d * Math.PI / 180;
function haversineKm(lat1, lon1, lat2, lon2) {
  const dLat = rad(lat2 - lat1), dLon = rad(lon2 - lon1);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * MARS_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}
const fmtKm = n => n.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' km';
const crossesEdge = r => Math.abs(r.to.lon - r.from.lon) > 180;

const routeLayer = L.layerGroup().addTo(map);
function drawRoute(r, flat = false, noFit = false) {
  routeLayer.clearLayers();
  lastRoute = r;
  let toLon = r.to.lon, base = 0;
  const wrapped = !flat && crossesEdge(r);
  if (wrapped) {
    toLon += r.to.lon < r.from.lon ? 360 : -360;                 // go the short way, over the map edge
    if (Math.min(r.from.lon, toLon) < -180) base = 360;          // keep it on the two-map strip, across the seam
  }
  const text = fmtKm(r.km);
  (opmMode && !flat ? (wrapped ? [base] : [0, 360]) : [0]).forEach(dx => {
    const a = [r.from.lat, r.from.lon + dx], b = [r.to.lat, toLon + dx];
    L.polyline([a, b], { color: '#4dd2ff', weight: 3, className: 'route-line', interactive: false }).addTo(routeLayer);
    [a, b].forEach(pt => L.circleMarker(pt, { radius: 5, color: '#fff', weight: 2, fillColor: '#4dd2ff', fillOpacity: 1, interactive: false }).addTo(routeLayer));
    L.marker([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], {
      icon: L.divIcon({ className: 'route-label', html: '<span>' + text + '</span>', iconSize: [0, 0] }),
      interactive: false, keyboard: false
    }).addTo(routeLayer);
  });
  if (!noFit) map.fitBounds([[r.from.lat, r.from.lon + base], [r.to.lat, toLon + base]], { padding: [80, 80], maxZoom: 4 });
}
drawRouteFn = drawRoute;

const distForm = document.getElementById('distance-form');
if (distForm) {
  const $ = id => document.getElementById(id);
  const modeBtns = { name: $('mode-name'), coord: $('mode-coord') };
  const fieldsName = $('fields-name'), fieldsCoord = $('fields-coord');
  const box = $('distance-result');
  let mode = null;

  const byName = new Map();
  all.forEach(p => { if (!byName.has(p.name.toLowerCase())) byName.set(p.name.toLowerCase(), p); });
  const dl = $('place-names');
  byName.forEach(p => { const o = document.createElement('option'); o.value = p.name; dl.appendChild(o); });

  function setMode(m) {
    mode = mode === m ? null : m;
    Object.entries(modeBtns).forEach(([k, b]) => b.setAttribute('aria-pressed', String(k === mode)));
    distForm.hidden = !mode;
    fieldsName.hidden = mode !== 'name';
    fieldsCoord.hidden = mode !== 'coord';
    box.hidden = true;
  }
  modeBtns.name.addEventListener('click', () => setMode('name'));
  modeBtns.coord.addEventListener('click', () => setMode('coord'));

  function showError(msg) {
    box.hidden = false; box.classList.add('error');
    $('dr-title').textContent = 'CHECK YOUR INPUT';
    $('dr-route').textContent = ''; $('dr-coords').textContent = ''; $('dr-note').textContent = msg;
  }
  function showResult(r) {
    box.hidden = false; box.classList.remove('error');
    $('dr-title').textContent = 'SHORTEST DISTANCE';
    $('dr-value').textContent = fmtKm(r.km);
    $('dr-route').textContent = r.from.name + '  →  ' + r.to.name;
    $('dr-coords').textContent = `${r.from.lat.toFixed(2)}°, ${r.from.lon.toFixed(2)}°  →  ${r.to.lat.toFixed(2)}°, ${r.to.lon.toFixed(2)}°`;
    $('dr-note').textContent = r.km === 0 ? 'FROM and TO are the same point.'
      : crossesEdge(r) ? 'The shortest path crosses the map edge (east ↔ west), so the line is drawn across two maps on OpenPlanetaryMap.'
      : 'Great-circle distance (haversine, radius 3,500 km), shown on OpenPlanetaryMap.';
  }

  distForm.addEventListener('submit', e => {
    e.preventDefault();
    let from, to;
    if (mode === 'name') {
      const fi = $('from-name'), ti = $('to-name');
      from = byName.get(fi.value.trim().toLowerCase());
      to = byName.get(ti.value.trim().toLowerCase());
      fi.classList.toggle('invalid', !from); ti.classList.toggle('invalid', !to);
      if (!from || !to) return showError('FROM and TO must be locations from the Location Index. Pick them from the suggestions.');
    } else {
      const ids = ['from-lat', 'from-lon', 'to-lat', 'to-lon'];
      const v = ids.map(id => { const t = $(id).value.trim(); return t === '' ? NaN : Number(t); });
      const ok = [Math.abs(v[0]) <= 90, Math.abs(v[1]) <= 180, Math.abs(v[2]) <= 90, Math.abs(v[3]) <= 180];
      ids.forEach((id, i) => $(id).classList.toggle('invalid', !ok[i]));
      if (!ok.every(Boolean)) return showError('Latitude must be between -90 and 90, longitude between -180 and 180.');
      from = { name: 'Custom point A', lat: v[0], lon: v[1] };
      to = { name: 'Custom point B', lat: v[2], lon: v[3] };
    }
    document.querySelectorAll('.distance-fields input.invalid').forEach(i => i.classList.remove('invalid'));
    const r = { from, to, km: haversineKm(from.lat, from.lon, to.lat, to.lon) };
    showResult(r);
    if (r.km === 0) { routeLayer.clearLayers(); lastRoute = null; return; }
    document.getElementById('map').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (opmMode) drawRoute(r);
    else { pendingRoute = r; setBasemap('opm'); }   // visualise on OpenPlanetaryMap
  });

  $('distance-clear').addEventListener('click', () => {
    distForm.reset();
    distForm.querySelectorAll('input.invalid').forEach(i => i.classList.remove('invalid'));
    box.hidden = true;
    routeLayer.clearLayers(); lastRoute = null; pendingRoute = null;
  });
}

}


// ----------------------------------------------------------------------------
// LOCATION DATA FETCHING & MAP STARTUP
// ----------------------------------------------------------------------------
function fetchLocationsData() {
  fetch('./locations.json', { cache: 'no-store' })
    .then(response => {
      if (!response.ok) throw new Error('Could not load locations.json: ' + response.status);
      return response.json();
    })
    .then(data => {
      if (!data || !Array.isArray(data.green) || !Array.isArray(data.orange)) {
        throw new Error('locations.json must contain green and orange arrays');
      }
      DATA = applyMemberNotes(data);
      const pageMap = document.getElementById('page-map');
      if (pageMap && !pageMap.hidden && !mapInitialized) {
        initializeMap();
        mapInitialized = true;
      }
    })
    .catch(error => {
      console.warn('Location data fetch note:', error);
      if (typeof FALLBACK_LOCATIONS_DATA !== 'undefined' && FALLBACK_LOCATIONS_DATA && FALLBACK_LOCATIONS_DATA.green) {
        DATA = applyMemberNotes(FALLBACK_LOCATIONS_DATA);
        const pageMap = document.getElementById('page-map');
        if (pageMap && !pageMap.hidden && !mapInitialized) {
          initializeMap();
          mapInitialized = true;
        }
        return;
      }
      const loading = document.getElementById('map-loading');
      if (loading) {
        loading.classList.add('active');
        loading.querySelector('.loading-title').textContent = 'LOCATION DATA ERROR';
        loading.querySelector('.loading-subtitle').textContent = 'Check locations.json and run this site using a local server.';
      }
    });
}

// ----------------------------------------------------------------------------
// DOM EVENT WIRING & INITIALIZATION
// ----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Pre-load fact database from fact.json
  fetchFactDatabase();

  // Pre-load location data from locations.json
  fetchLocationsData();

  // Primary Interaction Button: START
  const getStartedBtn = document.getElementById('btn-get-started');
  if (getStartedBtn) {
    getStartedBtn.addEventListener('click', () => {
      initiateInteractiveLaunch();
    });
  }

  // Subtle interactive desktop parallax on the Mars intro hero
  const heroWrapper = document.getElementById('intro-hero-wrapper');
  const backdropImg = document.getElementById('intro-backdrop-img');
  if (heroWrapper && backdropImg) {
    heroWrapper.addEventListener('mousemove', (e) => {
      const rect = heroWrapper.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * -18;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * -12;
      backdropImg.style.setProperty('--parallax-x', `${x.toFixed(1)}px`);
      backdropImg.style.setProperty('--parallax-y', `${y.toFixed(1)}px`);
    });
    heroWrapper.addEventListener('mouseleave', () => {
      backdropImg.style.setProperty('--parallax-x', '0px');
      backdropImg.style.setProperty('--parallax-y', '0px');
    });
  }
});
