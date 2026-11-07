let DATA = {};
const MAP_MAX_ZOOM = 7;

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

let currentTileLayer = null;
let pendingTileLayer = null;
let currentBasemapKey = null;
let loadToken = 0;
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

function setBasemap(key) {
  const config = BASEMAPS[key];
  if (!config) return;

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

  const nextLayer = L.tileLayer(config.url, {
    minZoom: config.minZoom,
    maxNativeZoom: config.maxZoom,
    maxZoom: MAP_MAX_ZOOM,
    attribution: config.attribution,
    tms: config.tms === true,
    noWrap: true
  });
  pendingTileLayer = nextLayer;

  nextLayer.on('tileload', () => { loadedTiles++; });
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
    mapLoading.querySelector('.loading-title').textContent = 'MAP LOADING FAILED';
    mapLoading.querySelector('.loading-subtitle').textContent = message;
    if (layerSelect && currentBasemapKey) layerSelect.value = currentBasemapKey;
    setTimeout(() => {
      if (token === loadToken) hideMapLoading();
    }, 2500);
  }

  nextLayer.once('load', () => {
    if (finished || token !== loadToken) return;
    if (loadedTiles === 0) {
      failLoading('No map tiles were received. Previous surface retained.');
      return;
    }

    finished = true;
    clearTimeout(timeout);
    const previousLayer = currentTileLayer;
    currentTileLayer = nextLayer;
    currentBasemapKey = key;
    pendingTileLayer = null;

    if (previousLayer) map.removeLayer(previousLayer);
    if (mapNote) {
      mapNote.textContent = config.note + ' · FEATURES ARE APPROXIMATE CENTERS';
    }
    if (errorTiles > 0) {
      console.warn(`${config.name}: ${loadedTiles} tiles loaded, ${errorTiles} tiles failed.`);
    }
    if (layerSelect) layerSelect.value = key;
    hideMapLoading();
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
  
const quoteSlider = document.getElementById('quote-slider');
const sliderBadge = document.getElementById('slider-badge');
const sliderMemberName = document.getElementById('slider-member-name');
const sliderLocation = document.getElementById('slider-location');
const sliderQuote = document.getElementById('slider-quote');
const sliderClose = document.getElementById('slider-close');

function getMemberInfo(rawMember) {
  if (!rawMember) return null;
  if (typeof rawMember === 'object') {
    const id = String(rawMember.id || 1).replace(/\D/g, '') || '1';
    return { id, name: rawMember.name || ('Member ' + id) };
  }
  const str = String(rawMember);
  const match = str.match(/\d/);
  const id = match ? match[0] : '1';
  const name = str.includes('-') ? str.split('-')[1].trim() : (str.startsWith('Member') ? str : ('Member ' + id + ': ' + str));
  return { id, name };
}

function showQuoteSlider(point) {
  if (!quoteSlider || !point.extra) {
    if (quoteSlider) quoteSlider.classList.remove('open');
    return;
  }
  const member = getMemberInfo(point.member) || { id: '1', name: 'Member 1' };

  quoteSlider.setAttribute('data-member', member.id);
  sliderBadge.textContent = 'MEMBER ' + member.id;
  sliderMemberName.textContent = member.name;
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
function markerIcon(color){return L.divIcon({className:'custom-marker',html:`<span class="marker-core ${color}"></span>`,iconSize: [18,18],iconAnchor:[9,9]});}
function popupHtml(p){
 const desc=p.details || `Approximate center of the named ${p.category || 'Mars'} feature. Coordinates are a map reference estimate, not a surveyed boundary.`;
 return `<div class="popup-title">${p.name}</div><div class="popup-kind" style="color:${p.color==='green'?'#4ee28a':'#ff963d'}">${p.category||p.group}</div><div class="popup-desc">${desc}</div><div class="popup-coord">Approx. ${p.lat.toFixed(2)}°, ${p.lon.toFixed(2)}°</div>`;
}
all.forEach((p, i) => {
  const m = L.marker([p.lat, p.lon], {
    icon: markerIcon(p.color),
    title: p.name
  }).bindPopup(popupHtml(p));

  m.on('click', () => {
    if (p.extra) {
      showQuoteSlider(p);
    } else {
      hideQuoteSlider();
    }
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
  if (p.extra) {
    showQuoteSlider(p);
    
    } else {
    
    hideQuoteSlider();
    }
  });
  list.appendChild(b);
 });
 markers.forEach(({marker,data})=>{
  const show=`${data.name} ${data.category||''}`.toLowerCase().includes(q.toLowerCase());
  if(show){if(!map.hasLayer(marker))marker.addTo(map);}else map.removeLayer(marker);
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
  if(matchingPlaces.length&&fullscreenSuggestions.getAttribute('aria-expanded')!=='false')goToPlace(matchingPlaces[activeSuggestion]);
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
document.getElementById('reset').addEventListener('click',()=>{searchInputs.forEach(input=>input.value='');renderList();map.setView([8,0],2);});

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

}

fetch('./locations.json')
  .then(response => {
    if (!response.ok) throw new Error('Could not load locations.json');
    return response.json();
  })
  .then(data => {
    if (!data || !Array.isArray(data.green) || !Array.isArray(data.orange)) {
      throw new Error('locations.json must contain green and orange arrays');
    }
    DATA = data;
    initializeMap();
  })
  .catch(error => {
    console.error('Location data error:', error);
    const loading = document.getElementById('map-loading');
    if (loading) {
      loading.classList.add('active');
      loading.querySelector('.loading-title').textContent = 'LOCATION DATA ERROR';
      loading.querySelector('.loading-subtitle').textContent = 'Check locations.json and run this site using a local server.';
    }
  });
