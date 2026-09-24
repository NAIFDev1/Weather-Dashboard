/* ============================================================
   WeatherFlow — app logic
   Data: Open-Meteo (weather) + Nominatim/OSM (geocoding)
   ============================================================ */
(function () {
  'use strict';

  var OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
  var NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
  var REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
  var NOMINATIM_HEADERS = {
    'User-Agent': 'WeatherFlow/1.0 (weather dashboard demo)',
    'Accept': 'application/json'
  };
  var RECENT_KEY = 'weatherflow_recent';
  var MAX_RECENT = 8;
  // Nominatim usage policy: max 1 req/sec.
  var GEOCODE_DELAY_MS = 1100;
  var lastGeocodeAt = 0;

  /* ---------- State ---------- */
  var state = {
    unit: 'celsius',
    city: null,          // { name, country, lat, lon }
    data: null,          // raw Open-Meteo response
    timezone: 'auto'
  };

  /* ---------- DOM refs ---------- */
  var $ = function (sel) { return document.querySelector(sel); };
  var $all = function (sel) { return document.querySelectorAll(sel); };

  var el = {
    cityInput: $('#city-input'),
    searchBtn: $('#search-btn'),
    locationBtn: $('#location-btn'),
    unitC: $('#unit-c'),
    unitF: $('#unit-f'),
    themeToggle: $('#theme-toggle'),
    iconMoon: $('#theme-toggle .icon-moon'),
    iconSun: $('#theme-toggle .icon-sun'),

    messageBanner: $('#message-banner'),
    messageIcon: $('#message-icon'),
    messageText: $('#message-text'),
    messageClose: $('#message-close'),

    loading: $('#loading-overlay'),
    welcome: $('#welcome-screen'),
    dashboard: $('#dashboard'),

    city: $('#weather-city'),
    country: $('#weather-country'),
    temp: $('#weather-temp'),
    tempUnit: $('#weather-temp-unit'),
    condition: $('#weather-condition'),
    feels: $('#weather-feels'),
    updated: $('#weather-updated'),
    iconLarge: $('#weather-icon-large'),

    humidity: $('#detail-humidity'),
    windSpeed: $('#detail-wind-speed'),
    windDir: $('#detail-wind-dir'),
    pressure: $('#detail-pressure'),
    visibility: $('#detail-visibility'),
    uv: $('#detail-uv'),

    forecastGrid: $('#forecast-grid'),

    sunrise: $('#extra-sunrise'),
    sunset: $('#extra-sunset'),
    extraHumidity: $('#extra-humidity'),
    extraWind: $('#extra-wind'),
    extraPrecip: $('#extra-precip'),

    recentList: $('#recent-list'),
    clearRecentBtn: $('#clear-recent-btn')
  };

  /* ============================================================
     Helpers
     ============================================================ */

  function round1(n) {
    return Math.round(n * 10) / 10;
  }

  function formatTemp(temp) {
    if (typeof temp !== 'number') return '—';
    return String(Math.round(temp));
  }

  function formatPercent(p) {
    if (typeof p !== 'number') return '—';
    return String(Math.round(p)) + '%';
  }

  function formatKmKmh(v) {
    if (typeof v !== 'number') return '—';
    return round1(v) + ' km/h';
  }

  function formatPressure(hPa) {
    if (typeof hPa !== 'number') return '—';
    return round1(hPa) + ' hPa';
  }

  function formatVisibility(km) {
    if (typeof km !== 'number') return '—';
    return km >= 100 ? 'Perfect' : round1(km) + ' km';
  }

  function formatTime(iso /* e.g. 2025-01-31T07:12 */) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d)) return '—';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function formatUpdated(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d)) return '—';
    return 'Updated ' + d.toLocaleString([], {
      hour: '2-digit', minute: '2-digit'
    });
  }

  /* ---------- Icon mapping (WMO weather codes) ---------- */
  var CODE_META = {
    0:   { icon: 'sun',             label: 'Clear sky',                  day: true },
    1:   { icon: 'sun',             label: 'Mainly clear',               day: true },
    2:   { icon: 'cloud-sun',       label: 'Partly cloudy',              day: true },
    3:   { icon: 'cloud',           label: 'Overcast',                   day: false },
    45:  { icon: 'cloud-fog',       label: 'Fog',                        day: false },
    48:  { icon: 'cloud-fog',       label: 'Depositing rime fog',        day: false },
    51:  { icon: 'cloud-drizzle',   label: 'Light drizzle',              day: false },
    53:  { icon: 'cloud-drizzle',   label: 'Drizzle',                    day: false },
    55:  { icon: 'cloud-drizzle',   label: 'Dense drizzle',              day: false },
    56:  { icon: 'cloud-drizzle',   label: 'Light freezing drizzle',     day: false },
    57:  { icon: 'cloud-drizzle',   label: 'Freezing drizzle',           day: false },
    61:  { icon: 'cloud-rain',      label: 'Light rain',                 day: false },
    63:  { icon: 'cloud-rain',      label: 'Rain',                       day: false },
    65:  { icon: 'cloud-rain',      label: 'Heavy rain',                 day: false },
    66:  { icon: 'cloud-drizzle',   label: 'Light freezing rain',        day: false },
    67:  { icon: 'cloud-drizzle',   label: 'Freezing rain',              day: false },
    71:  { icon: 'cloud-snow',      label: 'Light snow',                 day: false },
    73:  { icon: 'cloud-snow',      label: 'Snow',                       day: false },
    75:  { icon: 'cloud-snow',      label: 'Heavy snow',                 day: false },
    77:  { icon: 'cloud-snow',      label: 'Snow grains',                day: false },
    80:  { icon: 'cloud-rain',      label: 'Light rain showers',         day: false },
    81:  { icon: 'cloud-rain',      label: 'Rain showers',               day: false },
    82:  { icon: 'cloud-rain',      label: 'Violent rain showers',       day: false },
    85:  { icon: 'cloud-snow',      label: 'Snow showers',               day: false },
    86:  { icon: 'cloud-snow',      label: 'Heavy snow showers',         day: false },
    95:  { icon: 'cloud-lightning', label: 'Thunderstorm',               day: false },
    96:  { icon: 'cloud-lightning', label: 'Thunderstorm with hail',     day: false },
    99:  { icon: 'cloud-lightning', label: 'Severe thunderstorm with hail', day: false }
  };

  function weatherMeta(code) {
    return CODE_META[code] || { icon: 'cloud', label: 'Unknown' };
  }

  /* ============================================================
     UI state helpers
     ============================================================ */

  function showMessage(text, type) {
    el.messageText.textContent = text;
    if (type === 'info') el.messageBanner.classList.add('info');
    else el.messageBanner.classList.remove('info');
    el.messageBanner.hidden = false;
  }

  function hideMessage() {
    el.messageBanner.hidden = true;
  }

  function showLoading() {
    el.loading.hidden = false;
    el.dashboard.hidden = true;
    el.welcome.hidden = true;
  }

  function hideLoading() {
    el.loading.hidden = true;
  }

  function showWelcome() {
    el.welcome.hidden = false;
    el.dashboard.hidden = true;
  }

  function showDashboard() {
    el.welcome.hidden = true;
    el.dashboard.hidden = false;
  }

  function setIcon(container, iconId, label) {
    container.innerHTML = '';
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'icon');
    var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#icon-' + iconId);
    svg.appendChild(use);
    container.appendChild(svg);
    if (label) container.setAttribute('aria-label', label);
  }

  /* ============================================================
     Weather units
     ============================================================ */

  function isFahrenheit() {
    return state.unit === 'fahrenheit';
  }

  function toDisplayTemp(celsius) {
    if (typeof celsius !== 'number') return null;
    return isFahrenheit() ? celsius * 9 / 5 + 32 : celsius;
  }

  function toDisplayWind(kmh) {
    if (typeof kmh !== 'number') return null;
    return isFahrenheit() ? kmh * 0.621371 : kmh; // ms-1? No: km/h -> mph
  }

  function windUnit() {
    return isFahrenheit() ? ' mph' : ' km/h';
  }

  function tempUnitLabel() {
    return isFahrenheit() ? '°F' : '°C';
  }

  function updateUnitUI() {
    el.unitC.classList.toggle('active', !isFahrenheit());
    el.unitC.setAttribute('aria-pressed', String(!isFahrenheit()));
    el.unitF.classList.toggle('active', isFahrenheit());
    el.unitF.setAttribute('aria-pressed', String(isFahrenheit()));
    el.tempUnit.textContent = tempUnitLabel();
  }

  /* ============================================================
     Rendering
     ============================================================ */

  function degToCompass(deg) {
    var dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    var idx = Math.round(deg / 22.5) % 16;
    return dirs[idx];
  }

  function uvCategory(val) {
    if (val <= 2) return 'Low';
    if (val <= 5) return 'Moderate';
    if (val <= 7) return 'High';
    if (val <= 10) return 'Very high';
    return 'Extreme';
  }

  function renderDashboard() {
    var d = state.data;
    if (!d) return;
    var current = d.current;

    var cityName = state.city ? state.city.name : 'Your location';
    var countryName = state.city ? state.city.country : '';
    el.city.textContent = cityName;
    el.country.textContent = countryName;

    el.temp.textContent = formatTemp(toDisplayTemp(current.temperature_2m));
    el.tempUnit.textContent = tempUnitLabel();

    var currentCode = current.weather_code;
    var meta = weatherMeta(currentCode);
    el.condition.textContent = meta.label;
    el.feels.textContent = 'Feels like ' +
      formatTemp(toDisplayTemp(current.apparent_temperature)) + tempUnitLabel();
    el.updated.textContent = formatUpdated(d.currentTime);

    setIcon(el.iconLarge, meta.icon, meta.label);

    /* Details */
    el.humidity.textContent = formatPercent(current.relative_humidity_2m);
    el.windSpeed.textContent = round1(toDisplayWind(current.wind_speed_10m)) + windUnit();
    var windDir = degToCompass(current.wind_direction_10m || 0);
    el.windDir.textContent = windDir + ' · ' + (current.wind_direction_10m || '—') + '°';
    el.pressure.textContent = formatPressure(current.surface_pressure);
    el.visibility.textContent = formatVisibility(current.visibility);
    el.uv.textContent = uvCategory(current.uv_index);

    /* Extras (today) */
    var dIdx = 0;
    var daily = d.daily;
    el.sunrise.textContent = formatTime(daily.sunrise[dIdx]);
    el.sunset.textContent = formatTime(daily.sunset[dIdx]);
    el.extraHumidity.textContent = formatPercent(daily.relative_humidity_2m_max[dIdx]);
    var maxWind = daily.wind_speed_10m_max[dIdx];
    el.extraWind.textContent = round1(toDisplayWind(maxWind)) + windUnit();
    var precip = daily.precipitation_sum[dIdx];
    var prob = daily.precipitation_probability_max ? daily.precipitation_probability_max[dIdx] : null;
    el.extraPrecip.textContent = prob != null
      ? formatPercent(prob)
      : (precip > 0 ? round1(precip) + ' mm' : '0%');

    renderForecast();
  }

  function renderForecast() {
    var daily = state.data.daily;
    var days = daily.time;
    var fragment = document.createDocumentFragment();

    for (var i = 0; i < Math.min(7, days.length); i++) {
      var item = document.createElement('div');
      item.className = 'forecast-day';
      item.setAttribute('role', 'listitem');

      var name = document.createElement('div');
      name.className = 'forecast-day-name';
      name.textContent = i === 0 ? 'Today' : new Date(days[i] + 'T12:00:00').toLocaleDateString([], { weekday: 'short' });

      var meta = CODE_META[daily.weather_code[i]] || { icon: 'cloud', label: '—' };
      var iconWrap = document.createElement('span');
      iconWrap.setAttribute('aria-hidden', 'true');
      iconWrap.appendChild(renderForecastIcon(meta.icon));

      var precipRow = document.createElement('div');
      precipRow.className = 'forecast-precip';
      if (daily.precipitation_probability_max && daily.precipitation_probability_max[i] > 0) {
        precipRow.appendChild(renderForecastIcon('droplet'));
        var probTxt = document.createElement('span');
        probTxt.textContent = daily.precipitation_probability_max[i] + '%';
        precipRow.appendChild(probTxt);
      }

      var temps = document.createElement('div');
      temps.className = 'forecast-temps';
      var high = document.createElement('span');
      high.className = 'forecast-temp-high';
      high.textContent = formatTemp(toDisplayTemp(daily.temperature_2m_max[i]));
      var low = document.createElement('span');
      low.className = 'forecast-temp-low';
      low.textContent = formatTemp(toDisplayTemp(daily.temperature_2m_min[i]));
      temps.appendChild(high);
      temps.appendChild(low);

      item.appendChild(name);
      item.appendChild(iconWrap);
      item.appendChild(precipRow);
      item.appendChild(temps);
      fragment.appendChild(item);
    }

    el.forecastGrid.innerHTML = '';
    el.forecastGrid.appendChild(fragment);
  }

  /* Fix: rebuild the forecast icon markup properly */
  function renderForecastIcon(iconId) {
    var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#icon-' + iconId);
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'icon');
    svg.appendChild(use);
    return svg;
  }

  /* ============================================================
     API calls
     ============================================================ */

  function throttleGeocode() {
    var now = Date.now();
    var wait = Math.max(0, GEOCODE_DELAY_MS - (now - lastGeocodeAt));
    if (wait) {
      return new Promise(function (resolve) { setTimeout(resolve, wait); }).then(function () {
        lastGeocodeAt = Date.now();
      });
    }
    lastGeocodeAt = now;
    return Promise.resolve();
  }

  function geocodeCity(query) {
    var params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: '1',
      addressdetails: '1'
    });
    return throttleGeocode()
      .then(function () {
        return fetch(NOMINATIM_URL + '?' + params.toString(), { headers: NOMINATIM_HEADERS });
      })
      .then(function (res) {
        if (!res.ok) throw new Error('Geocoding service failed (' + res.status + ').');
        return res.json();
      })
      .then(function (results) {
        if (!results || !results.length) return null;
        var r = results[0];
        var addr = r.address || {};
        var name =
          addr.city || addr.town || addr.village || addr.county || r.display_name.split(',')[0].trim();
        return {
          name: name,
          country: addr.country || '',
          lat: parseFloat(r.lat),
          lon: parseFloat(r.lon)
        };
      });
  }

  function reverseGeocode(lat, lon) {
    var params = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      format: 'json',
      addressdetails: '1'
    });
    return throttleGeocode()
      .then(function () {
        return fetch(REVERSE_URL + '?' + params.toString(), { headers: NOMINATIM_HEADERS });
      })
      .then(function (res) {
        if (!res.ok) throw new Error('Reverse geocoding service failed (' + res.status + ').');
        return res.json();
      })
      .then(function (data) {
        var addr = data.address || {};
        var name =
          addr.city || addr.town || addr.village || addr.county || data.display_name.split(',')[0].trim();
        return {
          name: name,
          country: addr.country || '',
          lat: parseFloat(data.lat || lat),
          lon: parseFloat(data.lon || lon)
        };
      });
  }

  function fetchWeather(lat, lon) {
    var params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      current: [
        'temperature_2m', 'relative_humidity_2m', 'apparent_temperature',
        'is_day', 'precipitation', 'weather_code', 'surface_pressure',
        'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m',
        'visibility', 'uv_index'
      ].join(','),
      daily: [
        'weather_code', 'temperature_2m_max', 'temperature_2m_min',
        'apparent_temperature_max', 'apparent_temperature_min',
        'sunrise', 'sunset', 'uv_index_max',
        'precipitation_probability_max', 'precipitation_sum',
        'relative_humidity_2m_max', 'wind_speed_10m_max'
      ].join(','),
      forecast_days: '7',
      timezone: 'auto'
    });
    return fetch(OPEN_METEO_URL + '?' + params.toString())
      .then(function (res) {
        if (!res.ok) throw new Error('Weather service failed (' + res.status + ').');
        return res.json();
      })
      .then(function (data) {
        if (!data || !data.current) throw new Error('No weather data returned.');
        data.currentTime = new Date().toISOString();
        return data;
      });
  }

  /* ============================================================
     Main flow
     ============================================================ */

  function runWeatherSearch(city) {
    hideMessage();
    showLoading();
    setIcon(el.iconLarge, 'cloud', 'Loading');

    fetchWeather(city.lat, city.lon)
      .then(function (data) {
        state.city = city;
        state.data = data;
        hideLoading();
        showDashboard();
        renderDashboard();
        addRecent(city);
      })
      .catch(function (err) {
        hideLoading();
        showWelcome();
        showMessage('Unable to load weather for "' + (city.name || 'this location') + '". ' + err.message);
      });
  }

  function handleSearch(query) {
    var q = (query || '').trim();
    if (!q) {
      showMessage('Please enter a city name first.');
      el.cityInput.focus();
      return;
    }
    hideMessage();
    showLoading();

    geocodeCity(q)
      .then(function (city) {
        if (!city) {
          hideLoading();
          showWelcome();
          showMessage('City "' + q + '" was not found. Try a different spelling.');
          return null;
        }
        return city;
      })
      .then(function (city) {
        if (city) runWeatherSearch(city);
      })
      .catch(function (err) {
        hideLoading();
        showWelcome();
        showMessage('Search failed. ' + err.message);
      });
  }

  function handleMyLocation() {
    if (!('geolocation' in navigator)) {
      showMessage('Geolocation is not supported by this browser.');
      return;
    }
    hideMessage();
    showLoading();

    navigator.geolocation.getCurrentPosition(
      function (pos) {
        var lat = pos.coords.latitude;
        var lon = pos.coords.longitude;
        setIcon(el.iconLarge, 'cloud', 'Loading');

        reverseGeocode(lat, lon)
          .then(function (city) {
            if (!city) city = { name: 'My location', country: '', lat: lat, lon: lon };
            return city;
          })
          .then(function (city) {
            return fetchWeather(city.lat, city.lon).then(function (data) {
              return { city: city, data: data };
            });
          })
          .then(function (result) {
            state.city = result.city;
            state.data = result.data;
            hideLoading();
            showDashboard();
            renderDashboard();
            addRecent(result.city);
          })
          .catch(function (err) {
            hideLoading();
            showWelcome();
            showMessage('Could not load weather for your location. ' + err.message);
          });
      },
      function () {
        hideLoading();
        showWelcome();
        showMessage('Location access was denied or unavailable. Try searching a city instead.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  /* ============================================================
     Recent searches
     ============================================================ */

  function getRecent() {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function addRecent(city) {
    var recent = getRecent().filter(function (c) {
      return c.name !== city.name || c.country !== city.country;
    });
    recent.unshift({
      name: city.name,
      country: city.country,
      lat: city.lat,
      lon: city.lon,
      at: Date.now()
    });
    if (recent.length > MAX_RECENT) recent = recent.slice(0, MAX_RECENT);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
    } catch (e) { /* quota / private mode — ignore */ }
    renderRecent();
    el.cityInput.value = '';
  }

  function renderRecent() {
    var recent = getRecent();
    el.recentList.innerHTML = '';

    if (!recent.length) {
      var empty = document.createElement('li');
      empty.className = 'recent-empty';
      empty.setAttribute('role', 'listitem');
      empty.textContent = 'No recent searches yet.';
      el.recentList.appendChild(empty);
      el.clearRecentBtn.hidden = true;
      return;
    }

    el.clearRecentBtn.hidden = false;
    recent.forEach(function (c) {
      var li = document.createElement('li');
      li.setAttribute('role', 'listitem');

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'recent-item';

      var info = document.createElement('span');
      info.className = 'recent-item-name';
      var label = c.name + (c.country ? ', ' + c.country : '');
      info.textContent = label;

      var time = document.createElement('span');
      time.className = 'recent-item-time';
      time.textContent = new Date(c.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      btn.appendChild(info);
      btn.appendChild(time);
      btn.addEventListener('click', function () {
        runWeatherSearch({ name: c.name, country: c.country, lat: c.lat, lon: c.lon });
      });

      li.appendChild(btn);
      el.recentList.appendChild(li);
    });
  }

  function clearRecent() {
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch (e) { /* ignore */ }
    renderRecent();
  }

  /* ============================================================
     Theme toggle
     ============================================================ */

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    var isDark = theme === 'dark';
    el.themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    el.themeToggle.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    el.iconMoon.hidden = isDark;
    el.iconSun.hidden = !isDark;
    try {
      localStorage.setItem('weatherflow_theme', theme);
    } catch (e) { /* ignore */ }
  }

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function toggleTheme() {
    applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  }

  /* ============================================================
     Events
     ============================================================ */

  function bindEvents() {
    // Search
    el.searchBtn.addEventListener('click', function () { handleSearch(el.cityInput.value); });
    el.cityInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') handleSearch(el.cityInput.value);
    });
    el.locationBtn.addEventListener('click', handleMyLocation);

    // Units
    el.unitC.addEventListener('click', function () {
      state.unit = 'celsius';
      updateUnitUI();
      if (state.data) renderDashboard();
    });
    el.unitF.addEventListener('click', function () {
      state.unit = 'fahrenheit';
      updateUnitUI();
      if (state.data) renderDashboard();
    });

    // Theme
    el.themeToggle.addEventListener('click', toggleTheme);

    // Message close
    el.messageClose.addEventListener('click', hideMessage);

    // Recent
    el.clearRecentBtn.addEventListener('click', clearRecent);

    // Keyboard: '/' focuses search
    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && document.activeElement !== el.cityInput) {
        e.preventDefault();
        el.cityInput.focus();
      }
    });
  }

  /* ============================================================
     Init
     ============================================================ */

  function init() {
    bindEvents();
    updateUnitUI();
    applyTheme(currentTheme());
    renderRecent();

    // Load saved location if present (stored under a small flag).
    try {
      var savedLoc = JSON.parse(localStorage.getItem('weatherflow_last_city') || 'null');
      if (savedLoc && savedLoc.lat && savedLoc.lon) {
        runWeatherSearch(savedLoc);
      }
    } catch (e) { /* ignore */ }
  }

  // Persist last viewed city.
  var _addRecent = addRecent;
  addRecent = function (city) {
    _addRecent(city);
    try {
      localStorage.setItem('weatherflow_last_city', JSON.stringify(city));
    } catch (e) { /* ignore */ }
  };

  document.addEventListener('DOMContentLoaded', init);
})();