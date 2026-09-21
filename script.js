/* =============================================
   WeatherFlow - script.js
   Uses: Open-Meteo API (no API key required)
         Open-Meteo Geocoding API
   ============================================= */

'use strict';

/* =============================================
   CONSTANTS & API ENDPOINTS
   ============================================= */
const GEO_API    = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';
const MAX_RECENT  = 5;
const STORAGE_KEY_RECENT = 'weatherflow_recent';
const STORAGE_KEY_THEME  = 'weatherflow_theme';
const STORAGE_KEY_UNIT   = 'weatherflow_unit';

/* =============================================
   WMO WEATHER CODE MAP
   Maps WMO code -> { label, emoji }
   ============================================= */
const WMO_CODES = {
  0:  { label: 'Clear Sky',            emoji: '☀️'  },
  1:  { label: 'Mainly Clear',         emoji: '🌤️' },
  2:  { label: 'Partly Cloudy',        emoji: '⛅'  },
  3:  { label: 'Overcast',             emoji: '☁️'  },
  45: { label: 'Foggy',                emoji: '🌫️' },
  48: { label: 'Depositing Rime Fog',  emoji: '🌫️' },
  51: { label: 'Light Drizzle',        emoji: '🌦️' },
  53: { label: 'Moderate Drizzle',     emoji: '🌦️' },
  55: { label: 'Dense Drizzle',        emoji: '🌧️' },
  61: { label: 'Slight Rain',          emoji: '🌧️' },
  63: { label: 'Moderate Rain',        emoji: '🌧️' },
  65: { label: 'Heavy Rain',           emoji: '🌧️' },
  66: { label: 'Light Freezing Rain',  emoji: '🌨️' },
  67: { label: 'Heavy Freezing Rain',  emoji: '🌨️' },
  71: { label: 'Slight Snowfall',      emoji: '❄️'  },
  73: { label: 'Moderate Snowfall',    emoji: '❄️'  },
  75: { label: 'Heavy Snowfall',       emoji: '❄️'  },
  77: { label: 'Snow Grains',          emoji: '🌨️' },
  80: { label: 'Slight Rain Showers',  emoji: '🌦️' },
  81: { label: 'Moderate Rain Showers',emoji: '🌧️' },
  82: { label: 'Violent Rain Showers', emoji: '⛈️'  },
  85: { label: 'Slight Snow Showers',  emoji: '🌨️' },
  86: { label: 'Heavy Snow Showers',   emoji: '🌨️' },
  95: { label: 'Thunderstorm',         emoji: '⛈️'  },
  96: { label: 'Thunderstorm w/ Hail', emoji: '⛈️'  },
  99: { label: 'Thunderstorm w/ Heavy Hail', emoji: '⛈️' },
};

function getWeatherInfo(code) {
  return WMO_CODES[code] || { label: 'Unknown', emoji: '🌡️' };
}

/* =============================================
   WIND DIRECTION HELPER
   ============================================= */
function degreesToCompass(deg) {
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round(deg / 45) % 8];
}

/* =============================================
   TEMPERATURE CONVERSION
   ============================================= */
let currentUnit = 'C'; // 'C' or 'F'

function celsiusToFahrenheit(c) {
  return Math.round(c * 9 / 5 + 32);
}

function formatTemp(celsius) {
  if (currentUnit === 'F') {
    return `${celsiusToFahrenheit(celsius)}°F`;
  }
  return `${Math.round(celsius)}°C`;
}

function formatTempValue(celsius) {
  return currentUnit === 'F' ? celsiusToFahrenheit(celsius) : Math.round(celsius);
}

function unitSymbol() {
  return currentUnit === 'F' ? '°F' : '°C';
}

/* =============================================
   STATE
   ============================================= */
let currentWeatherData = null; // Store last fetched data for unit switching
let isFetching = false;

/* =============================================
   DOM REFERENCES
   ============================================= */
const cityInput       = document.getElementById('city-input');
const searchBtn       = document.getElementById('search-btn');
const locationBtn     = document.getElementById('location-btn');
const themeToggleBtn  = document.getElementById('theme-toggle');
const unitCBtn        = document.getElementById('unit-c');
const unitFBtn        = document.getElementById('unit-f');

const messageBanner   = document.getElementById('message-banner');
const messageText     = document.getElementById('message-text');
const messageClose    = document.getElementById('message-close');

const loadingOverlay  = document.getElementById('loading-overlay');
const welcomeScreen   = document.getElementById('welcome-screen');
const dashboard       = document.getElementById('dashboard');

// Main card
const elCity          = document.getElementById('weather-city');
const elCountry       = document.getElementById('weather-country');
const elTemp          = document.getElementById('weather-temp');
const elTempUnit      = document.getElementById('weather-temp-unit');
const elCondition     = document.getElementById('weather-condition');
const elIcon          = document.getElementById('weather-icon');
const elFeels         = document.getElementById('weather-feels');
const elUpdated       = document.getElementById('weather-updated');

// Detail cards
const elHumidity      = document.getElementById('detail-humidity');
const elWindSpeed     = document.getElementById('detail-wind-speed');
const elWindDir       = document.getElementById('detail-wind-dir');
const elPressure      = document.getElementById('detail-pressure');
const elVisibility    = document.getElementById('detail-visibility');
const elUV            = document.getElementById('detail-uv');

// Forecast
const forecastGrid    = document.getElementById('forecast-grid');

// Extra info
const elSunrise       = document.getElementById('extra-sunrise');
const elSunset        = document.getElementById('extra-sunset');
const elExtraHumidity = document.getElementById('extra-humidity');
const elExtraWind     = document.getElementById('extra-wind');
const elPrecip        = document.getElementById('extra-precip');

// Recent
const recentList      = document.getElementById('recent-list');
const clearRecentBtn  = document.getElementById('clear-recent-btn');

/* =============================================
   SHOW / HIDE LOADING
   ============================================= */
function showLoading() {
  loadingOverlay.classList.add('show');
  welcomeScreen.style.display = 'none';
  dashboard.classList.remove('show');
  searchBtn.disabled = true;
  isFetching = true;
}

function hideLoading() {
  loadingOverlay.classList.remove('show');
  searchBtn.disabled = false;
  isFetching = false;
}

/* =============================================
   SHOW / HIDE MESSAGES
   ============================================= */
function showMessage(text, type = 'error') {
  messageText.textContent = text;
  messageBanner.className = `message-banner show ${type}`;
}

function hideMessage() {
  messageBanner.classList.remove('show');
}

/* =============================================
   FETCH WEATHER DATA  (main function)
   ============================================= */
async function fetchWeather(lat, lon, cityName, countryName) {
  showLoading();
  hideMessage();

  const params = new URLSearchParams({
    latitude:  lat,
    longitude: lon,
    current: [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m',
      'pressure_msl',
      'visibility',
      'uv_index',
      'is_day',
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'sunrise',
      'sunset',
      'precipitation_probability_max',
      'wind_speed_10m_max',
      'relative_humidity_2m_max',
      'uv_index_max',
    ].join(','),
    timezone: 'auto',
    forecast_days: 7,
  });

  try {
    const response = await fetch(`${WEATHER_API}?${params}`);
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const data = await response.json();

    // Store for unit toggling
    currentWeatherData = { data, cityName, countryName };

    displayWeather(data, cityName, countryName);
    displayForecast(data);
    displayExtra(data);

    // Show dashboard
    hideLoading();
    welcomeScreen.style.display = 'none';
    dashboard.classList.add('show');

    // Save to recent searches
    saveRecentSearch(cityName);

  } catch (err) {
    hideLoading();
    console.error(err);
    if (!navigator.onLine) {
      showMessage('No internet connection. Please check your network and try again.');
    } else {
      showMessage('Failed to fetch weather data. Please try again later.');
    }
  }
}

/* =============================================
   SEARCH CITY  (geocoding + weather)
   ============================================= */
async function searchCity(query) {
  if (isFetching) return;

  query = query.trim();
  if (!query) {
    showMessage('Please enter a city name to search.');
    return;
  }
  if (query.length < 2) {
    showMessage('City name must be at least 2 characters.');
    return;
  }

  hideMessage();
  showLoading();

  try {
    const geoResp = await fetch(`${GEO_API}?name=${encodeURIComponent(query)}&count=1&language=en`);
    if (!geoResp.ok) throw new Error('Geocoding API failed');
    const geoData = await geoResp.json();

    if (!geoData.results || geoData.results.length === 0) {
      hideLoading();
      showMessage(`City "${query}" not found. Please check the spelling and try again.`);
      return;
    }

    const { latitude, longitude, name, country } = geoData.results[0];
    cityInput.value = '';
    await fetchWeather(latitude, longitude, name, country);

  } catch (err) {
    hideLoading();
    console.error(err);
    if (!navigator.onLine) {
      showMessage('No internet connection. Please check your network.');
    } else {
      showMessage('Failed to search for city. Please try again.');
    }
  }
}

/* =============================================
   DISPLAY WEATHER
   ============================================= */
function displayWeather(data, cityName, countryName) {
  const c = data.current;
  const info = getWeatherInfo(c.weather_code);

  elCity.textContent     = cityName;
  elCountry.textContent  = countryName;
  elTemp.textContent     = formatTempValue(c.temperature_2m);
  elTempUnit.textContent = unitSymbol();
  elCondition.textContent = info.label;
  elIcon.textContent     = info.emoji;
  elIcon.setAttribute('aria-label', info.label);
  elFeels.textContent    = `Feels like ${formatTemp(c.apparent_temperature)}`;
  elUpdated.textContent  = `Updated: ${formatTime(c.time ?? new Date().toISOString())}`;

  // Detail cards
  elHumidity.textContent  = `${c.relative_humidity_2m}%`;
  elWindSpeed.textContent = `${Math.round(c.wind_speed_10m)} km/h`;
  elWindDir.textContent   = degreesToCompass(c.wind_direction_10m);
  elPressure.textContent  = `${Math.round(c.pressure_msl)} hPa`;
  elVisibility.textContent = formatVisibility(c.visibility);
  elUV.textContent        = formatUV(c.uv_index);
}

/* =============================================
   DISPLAY FORECAST
   ============================================= */
function displayForecast(data) {
  const { daily } = data;
  forecastGrid.innerHTML = '';

  const days = daily.time.slice(0, 7);

  days.forEach((dateStr, i) => {
    const info = getWeatherInfo(daily.weather_code[i]);
    const maxC = daily.temperature_2m_max[i];
    const minC = daily.temperature_2m_min[i];

    const card = document.createElement('article');
    card.className = 'forecast-card';
    card.setAttribute('aria-label', `Forecast for ${formatDay(dateStr, i)}`);

    card.innerHTML = `
      <div class="forecast-day">${formatDay(dateStr, i)}</div>
      <div class="forecast-icon" role="img" aria-label="${info.label}">${info.emoji}</div>
      <div class="forecast-condition">${info.label}</div>
      <div class="forecast-temps">
        <span class="forecast-max" data-max="${maxC}">${formatTemp(maxC)}</span>
        <span class="forecast-min" data-min="${minC}">${formatTemp(minC)}</span>
      </div>
    `;

    forecastGrid.appendChild(card);
  });
}

/* =============================================
   DISPLAY EXTRA INFO
   ============================================= */
function displayExtra(data) {
  const { daily } = data;

  elSunrise.textContent       = formatTime(daily.sunrise[0]);
  elSunset.textContent        = formatTime(daily.sunset[0]);
  elExtraHumidity.textContent = `${daily.relative_humidity_2m_max[0]}%`;
  elExtraWind.textContent     = `${Math.round(daily.wind_speed_10m_max[0])} km/h`;
  elPrecip.textContent        = `${daily.precipitation_probability_max[0] ?? 0}%`;
}

/* =============================================
   FORMAT HELPERS
   ============================================= */
function formatDay(dateStr, index) {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function formatTime(isoStr) {
  const date = new Date(isoStr);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatVisibility(meters) {
  if (meters == null) return '—';
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${meters} m`;
}

function formatUV(uv) {
  if (uv == null) return '—';
  const val = Math.round(uv);
  if (val <= 2)  return `${val} (Low)`;
  if (val <= 5)  return `${val} (Moderate)`;
  if (val <= 7)  return `${val} (High)`;
  if (val <= 10) return `${val} (Very High)`;
  return `${val} (Extreme)`;
}

/* =============================================
   TEMPERATURE UNIT TOGGLE
   ============================================= */
function toggleTemperatureUnit(unit) {
  if (currentUnit === unit) return;
  currentUnit = unit;

  // Update button states
  unitCBtn.classList.toggle('active', unit === 'C');
  unitFBtn.classList.toggle('active', unit === 'F');

  // Save preference
  localStorage.setItem(STORAGE_KEY_UNIT, unit);

  // Re-render weather if data is available
  if (currentWeatherData) {
    const { data, cityName, countryName } = currentWeatherData;
    displayWeather(data, cityName, countryName);
    displayForecast(data);
  }
}

/* =============================================
   CURRENT LOCATION
   ============================================= */
async function getCurrentLocation() {
  if (!navigator.geolocation) {
    showMessage('Geolocation is not supported by your browser.', 'info');
    return;
  }

  showLoading();
  hideMessage();

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        // Reverse geocode using Open-Meteo geocoding (not available), 
        // use a fallback: fetch weather directly and label as "My Location"
        // For better city name: use a free reverse geocoding
        const reverseResp = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
          { headers: { 'Accept-Language': 'en' } }
        );
        let cityName = 'My Location';
        let countryName = '';

        if (reverseResp.ok) {
          const reverseData = await reverseResp.json();
          const addr = reverseData.address || {};
          cityName = addr.city || addr.town || addr.village || addr.county || 'My Location';
          countryName = addr.country || '';
        }

        await fetchWeather(latitude, longitude, cityName, countryName);

      } catch (err) {
        // If reverse geocoding fails, still show weather
        await fetchWeather(latitude, longitude, 'My Location', '');
      }
    },
    (err) => {
      hideLoading();
      if (err.code === err.PERMISSION_DENIED) {
        showMessage(
          'Location access was denied. Please allow location permission in your browser settings to use this feature.',
          'info'
        );
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        showMessage('Location information is unavailable. Please try again.');
      } else if (err.code === err.TIMEOUT) {
        showMessage('Location request timed out. Please try again.');
      } else {
        showMessage('Unable to retrieve your location. Please search manually.');
      }
    },
    { timeout: 10000, maximumAge: 60000 }
  );
}

/* =============================================
   RECENT SEARCHES
   ============================================= */
function saveRecentSearch(cityName) {
  let recent = loadRecentSearches();

  // Remove duplicate (case-insensitive)
  recent = recent.filter(c => c.toLowerCase() !== cityName.toLowerCase());

  // Add to front
  recent.unshift(cityName);

  // Keep only last MAX_RECENT
  recent = recent.slice(0, MAX_RECENT);

  localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(recent));
  renderRecentSearches(recent);
}

function loadRecentSearches() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_RECENT);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function renderRecentSearches(recent) {
  recentList.innerHTML = '';

  if (!recent || recent.length === 0) {
    recentList.innerHTML = '<span class="recent-empty">No recent searches yet.</span>';
    return;
  }

  recent.forEach(cityName => {
    const li = document.createElement('li');
    li.innerHTML = `
      <button class="recent-item" aria-label="Search for ${cityName}" tabindex="0">
        🕐 ${cityName}
      </button>
    `;
    li.querySelector('button').addEventListener('click', () => searchCity(cityName));
    recentList.appendChild(li);
  });
}

function clearRecentSearches() {
  localStorage.removeItem(STORAGE_KEY_RECENT);
  renderRecentSearches([]);
}

/* =============================================
   DARK / LIGHT THEME TOGGLE
   ============================================= */
function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const newTheme = isDark ? 'light' : 'dark';
  applyTheme(newTheme);
  localStorage.setItem(STORAGE_KEY_THEME, newTheme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
  themeToggleBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
}

function restoreTheme() {
  const saved = localStorage.getItem(STORAGE_KEY_THEME);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  applyTheme(theme);
}

/* =============================================
   RESTORE UNIT PREFERENCE
   ============================================= */
function restoreUnit() {
  const saved = localStorage.getItem(STORAGE_KEY_UNIT);
  if (saved === 'F') {
    currentUnit = 'F';
    unitFBtn.classList.add('active');
    unitCBtn.classList.remove('active');
  } else {
    currentUnit = 'C';
    unitCBtn.classList.add('active');
    unitFBtn.classList.remove('active');
  }
}

/* =============================================
   EVENT LISTENERS
   ============================================= */
function initEventListeners() {
  // Search button
  searchBtn.addEventListener('click', () => searchCity(cityInput.value));

  // Enter key in input
  cityInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchCity(cityInput.value);
  });

  // Location button
  locationBtn.addEventListener('click', getCurrentLocation);

  // Theme toggle
  themeToggleBtn.addEventListener('click', toggleTheme);

  // Unit toggle
  unitCBtn.addEventListener('click', () => toggleTemperatureUnit('C'));
  unitFBtn.addEventListener('click', () => toggleTemperatureUnit('F'));

  // Message close
  messageClose.addEventListener('click', hideMessage);

  // Clear recent
  clearRecentBtn.addEventListener('click', clearRecentSearches);
}

/* =============================================
   INIT
   ============================================= */
function init() {
  restoreTheme();
  restoreUnit();
  initEventListeners();

  const recent = loadRecentSearches();
  renderRecentSearches(recent);
}

document.addEventListener('DOMContentLoaded', init);
