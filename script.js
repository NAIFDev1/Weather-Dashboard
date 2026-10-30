import {
  DEFAULT_CITY,
  STARTER_CITIES,
  finite,
  number,
  temperature,
  speed,
  pressure,
  distance,
  percent,
  cleanCity,
  cleanRecent,
  cityKey,
  recentDescriptor,
  clock,
  dateLabel,
  dateKey,
  compass,
  uvLabel,
  weatherMeta,
  normalizeWeather,
  hoursFor,
  rangePosition,
  daylightInfo,
  forecastURL,
  fetchJSON,
} from "./weather.js";

const $ = (id) => document.getElementById(id);
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const icon = (name) =>
  `<svg class="icon" aria-hidden="true"><use href="assets/icons.svg#icon-${name}"/></svg>`;
const storage = {
  get(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* Preferences are visit-only when browser storage is unavailable. */
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};
let savedUnit = storage.get("weatherflow_unit", "c");
const state = {
  unit: savedUnit === "f" ? "f" : "c",
  city: null,
  data: null,
  raw: null,
  day: 0,
  metric: "temperature",
  recent: cleanRecent(storage.get("weatherflow_recent", [])),
  results: [],
  operation: 0,
  controller: null,
  updated: null,
  saved: false,
};
const units = () => ({
  temp: state.unit === "f" ? "°F" : "°C",
  wind: state.unit === "f" ? "mph" : "km/h",
  pressure: state.unit === "f" ? "inHg" : "hPa",
  distance: state.unit === "f" ? "mi" : "km",
});
const temp = (value) =>
  finite(value) ? `${number(temperature(value, state.unit))}°` : "—";
const info = (text, retry = null) => {
  $("notice-text").textContent = text;
  $("notice").hidden = false;
  $("retry-btn").hidden = !retry;
  $("retry-btn").onclick = retry;
};
const hideNotice = () => {
  $("notice").hidden = true;
};
function status(text) {
  $("status").textContent = text;
}
function syncUnits() {
  $("unit-c").setAttribute("aria-pressed", state.unit === "c");
  $("unit-f").setAttribute("aria-pressed", state.unit === "f");
  $("current-unit").textContent = units().temp;
  $("forecast-unit").textContent = `Low / High · ${units().temp}`;
}
function syncTheme() {
  const dark = document.documentElement.dataset.theme === "dark";
  $("theme-toggle").innerHTML = icon(dark ? "sun" : "moon");
  $("theme-toggle").setAttribute(
    "aria-label",
    `Switch to ${dark ? "light" : "dark"} theme`,
  );
  document.querySelector('meta[name="theme-color"]').content = getComputedStyle(
    document.documentElement,
  )
    .getPropertyValue("--ground")
    .trim();
}
function setBusy(value) {
  $("weather-content").setAttribute("aria-busy", value);
  $("refresh-btn").setAttribute("aria-busy", value);
  $("refresh-btn").disabled = value;
}
function begin() {
  state.controller?.abort();
  state.controller = new AbortController();
  state.operation++;
  return { id: state.operation, signal: state.controller.signal };
}
function errorText(error) {
  return error.name === "TimeoutError"
    ? "The request took too long. Check your connection and try again."
    : error instanceof TypeError
      ? "Could not connect. Check your internet connection and try again."
      : error.message || "Could not load this forecast. Please try again.";
}
function closeResults(focus = false) {
  $("search-results").hidden = true;
  $("city-input").setAttribute("aria-expanded", "false");
  if (focus) $("city-input").focus();
}
function renderRecent() {
  const cities = state.recent.length ? state.recent : STARTER_CITIES;
  $("recent-list").innerHTML = cities
    .map((city, i) => {
      const { qualifier, full } = recentDescriptor(city, cities);
      return `<button class="recent-city" data-recent="${i}" title="${esc(full)}" aria-label="Weather for ${esc(full)}" ${state.city && cityKey(city) === cityKey(state.city) ? 'aria-current="true"' : ""}><span class="recent-name">${esc(city.name)}</span>${qualifier ? `<span class="recent-qualifier"> · ${esc(qualifier)}</span>` : ""}</button>`;
    })
    .join("");
  $("clear-recent").hidden = !state.recent.length;
}
function addRecent(city) {
  state.recent = [
    city,
    ...state.recent.filter((c) => cityKey(c) !== cityKey(city)),
  ].slice(0, 8);
  storage.set("weatherflow_recent", state.recent);
  renderRecent();
}
async function loadCity(city, { focus = false, operation = null } = {}) {
  city = cleanCity(city);
  if (!city) return;
  const { id, signal } = operation || begin();
  closeResults();
  hideNotice();
  setBusy(true);
  status(`Loading weather for ${city.name}.`);
  if (!state.data) {
    $("city-name").textContent = city.name;
    $("city-context").textContent = city.country || "Your selected location";
  }
  $("updated-time").textContent = state.data
    ? "Refreshing forecast…"
    : "Getting the latest forecast…";
  try {
    const raw = await fetchJSON(forecastURL(city), signal);
    const data = normalizeWeather(raw);
    if (id !== state.operation) return;
    Object.assign(state, {
      city,
      data,
      raw,
      day: 0,
      updated: Date.now(),
      saved: false,
    });
    storage.set("weatherflow_last_city", city);
    storage.set("weatherflow_snapshot_v2", {
      city,
      raw,
      updated: state.updated,
    });
    addRecent(city);
    render();
    status(`Forecast loaded for ${city.name}.`);
    if (focus) $("city-name").focus({ preventScroll: true });
  } catch (error) {
    if (id !== state.operation || error.name === "AbortError") return;
    const retry = () => loadCity(city, { focus });
    info(
      `${errorText(error)}${state.data ? ` Still showing ${state.city.name}'s forecast.` : ""}`,
      retry,
    );
    if (!state.data) {
      $("condition").textContent = "Forecast unavailable";
      $("feels-like").textContent = "Try again or search another city.";
      $("hourly-chart").innerHTML =
        '<p class="chart-loading">No forecast loaded. Try again above.</p>';
      $("forecast-list").innerHTML =
        '<p class="empty-copy">A forecast will appear after a successful search.</p>';
    }
    $("updated-time").textContent = state.data
      ? freshnessText()
      : "Not updated";
    status("Could not update the forecast.");
  } finally {
    if (id === state.operation) setBusy(false);
  }
}
function freshnessText() {
  if (!state.updated) return "Not updated";
  const date = dateLabel(state.updated / 1000, state.data.timezone, {
    day: "numeric",
    month: "short",
  });
  return `${state.saved ? "Saved forecast" : "Fetched"} ${date}, ${clock(state.updated / 1000, state.data.timezone)}`;
}
function render() {
  if (!state.data) return;
  syncUnits();
  $("city-name").textContent = state.city.name;
  $("city-context").textContent = [
    state.city.country,
    state.city.region && state.city.region !== state.city.name
      ? state.city.region
      : null,
    state.data.timezone.replaceAll("_", " "),
  ]
    .filter(Boolean)
    .join(" · ");
  $("updated-time").textContent = freshnessText();
  renderCurrent();
  renderForecast();
  renderDay();
  renderRecent();
}
function renderCurrent() {
  const { current: c, days, timezone } = state.data;
  $("current-title").textContent = state.saved
    ? "Saved conditions"
    : "Current weather";
  const meta = weatherMeta(c.weather_code, c.is_day);
  $("current-temp").textContent = number(
    temperature(c.temperature_2m, state.unit),
  );
  $("current-icon").innerHTML = icon(meta.icon);
  $("condition").textContent = meta.label;
  $("feels-like").textContent =
    `Feels like ${temp(c.apparent_temperature)}${units().temp.slice(1)}`;
  $("local-time").textContent = `${clock(c.time, timezone)} local`;
  $("today-range").textContent =
    `High ${temp(days[0]?.high)} / Low ${temp(days[0]?.low)}`;
  $("observation-time").textContent =
    `Conditions at ${clock(c.time, timezone)}`;
  const ahead = hoursFor(state.data, 0).filter((h) => finite(h.temp));
  const coolest = ahead.reduce(
    (low, h) => (!low || h.temp < low.temp ? h : low),
    null,
  );
  $("current-outlook").textContent = coolest
    ? `Coolest ahead: ${temp(coolest.temp)}${units().temp.slice(1)} around ${clock(coolest.time, timezone)}, ${dateLabel(coolest.time, timezone, { weekday: "short" })}.`
    : "The hourly outlook is currently unavailable.";
}
function renderForecast() {
  const { days, timezone } = state.data;
  const values = days.flatMap((d) => [d.low, d.high]).filter(finite);
  const min = Math.min(...values),
    max = Math.max(...values);
  $("forecast-list").innerHTML = days
    .map((d, i) => {
      const label =
        i === 0
          ? "Today"
          : i === 1
            ? "Tomorrow"
            : dateLabel(d.time, timezone, { weekday: "short" });
      const meta = weatherMeta(d.code);
      const range = rangePosition(d.low, d.high, min, max);
      const accessible = `${dateLabel(d.time, timezone)}, ${meta.label}, low ${temp(d.low)}, high ${temp(d.high)} ${units().temp}, rain chance ${percent(d.rain)}`;
      return `<button class="forecast-row" data-day="${i}" aria-pressed="${i === state.day}" aria-label="${esc(accessible)}"><span class="forecast-day">${label}</span>${icon(meta.icon)}<span class="forecast-rain" title="Rain chance">${percent(d.rain)}</span><span class="range"><span class="range-number">${temp(d.low)}</span><span class="range-track" aria-hidden="true"><span class="range-fill" style="--start:${range.start}%;--span:${range.span}%"></span></span><span class="range-number">${temp(d.high)}</span></span><svg class="row-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button>`;
    })
    .join("");
}
function renderDay() {
  renderHourly();
  renderDetails();
  renderDaylight();
}
function renderHourly() {
  const hours = hoursFor(state.data, state.day),
    day = state.data.days[state.day];
  $("hourly-date").textContent =
    `${state.day === 0 ? "Next 24 hours" : dateLabel(day.time, state.data.timezone)} · Local time`;
  $("hourly-title").textContent =
    state.day === 0 ? "The hours ahead" : "A look at the day";
  const { metric } = state;
  document
    .querySelectorAll("[data-metric]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", b.dataset.metric === metric),
    );
  const values = hours.map((h) =>
    metric === "rain"
      ? h.rain
      : metric === "wind"
        ? speed(h.wind, state.unit)
        : temperature(h.temp, state.unit),
  );
  const valid = values.filter(finite),
    unit =
      metric === "rain" ? "%" : metric === "wind" ? units().wind : units().temp;
  $("hourly-summary").textContent = valid.length
    ? metric === "rain"
      ? `Rain chance peaks at ${number(Math.max(...valid))}%.`
      : metric === "wind"
        ? `Winds up to ${number(Math.max(...valid), 1)} ${unit}.`
        : `From ${number(Math.min(...valid))}${unit} to ${number(Math.max(...valid))}${unit} across the forecast.`
    : "Hourly values are unavailable for this period.";
  $("hourly-chart").replaceChildren();
  if (valid.length && window.Charts) {
    window.Charts.line($("hourly-chart"), {
      labels: hours.map((h) => clock(h.time, state.data.timezone)),
      series: [
        {
          name: `${metric === "rain" ? "Rain chance" : metric === "wind" ? "Wind speed" : "Temperature"} forecast`,
          values,
        },
      ],
      height: 144,
      ...(metric === "temperature"
        ? { min: Math.min(...valid) - 2 }
        : { min: 0 }),
      format: (v) =>
        `${number(v, metric === "wind" ? 1 : 0)}${metric === "wind" ? " " : ""}${unit}`,
      tickFormat: (v) =>
        `${number(v)}${metric === "rain" ? "%" : metric === "temperature" ? "°" : ""}`,
      today: 0,
      todayLabel: "",
      ...(metric === "rain" ? { yTicks: [0, 25, 50, 75, 100] } : {}),
    });
    $("hourly-chart")
      .querySelector("svg")
      ?.setAttribute("aria-describedby", "hourly-summary");
  } else {
    $("hourly-chart").innerHTML =
      '<p class="chart-loading">No hourly values available.</p>';
  }
  const indices =
    hours.length <= 6
      ? hours.map((_, i) => i)
      : [
          0,
          Math.floor((hours.length - 1) / 5),
          Math.floor(((hours.length - 1) * 2) / 5),
          Math.floor(((hours.length - 1) * 3) / 5),
          Math.floor(((hours.length - 1) * 4) / 5),
          hours.length - 1,
        ];
  $("hourly-strip").innerHTML = indices
    .map((i) => {
      const h = hours[i];
      const meta = weatherMeta(h.code, h.isDay);
      return `<div class="hour-item"><span>${clock(h.time, state.data.timezone)}</span><span title="${esc(meta.label)}">${icon(meta.icon)}</span><strong>${temp(h.temp)}</strong></div>`;
    })
    .join("");
  $("hourly-caption").textContent =
    `Times in ${state.data.timezone.replaceAll("_", " ")}. All values are forecasts.`;
  $("hourly-values").innerHTML = hours
    .map(
      (h) =>
        `<tr><th scope="row">${dateLabel(h.time, state.data.timezone, { weekday: "short", day: "numeric", month: "short" })} · ${clock(h.time, state.data.timezone)}</th><td>${temp(h.temp)}${units().temp.slice(1)}</td><td>${percent(h.rain)}</td><td>${number(speed(h.wind, state.unit), 1)} ${units().wind}</td></tr>`,
    )
    .join("");
}
function renderDetails() {
  const { current: c, timezone, hours, days } = state.data,
    d = days[state.day],
    today = state.day === 0,
    dayHours = hours.filter((h) => h.key === d.key);
  const max = (key) => {
    const vals = dayHours.map((h) => h[key]).filter(finite);
    return vals.length ? Math.max(...vals) : null;
  };
  const mean = (key) => {
    const vals = dayHours.map((h) => h[key]).filter(finite);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };
  const nearest = hours.reduce(
    (prev, h) =>
      Math.abs(h.time - c.time) < Math.abs((prev?.time ?? Infinity) - c.time)
        ? h
        : prev,
    null,
  );
  $("details-title").textContent = today
    ? "Today's details"
    : dateLabel(d.time, timezone, { weekday: "long" }) + "'s details";
  $("details-scope").textContent = today
    ? "Current + daily forecast"
    : "Daily forecast";
  const rows = [
    [
      "Humidity",
      "droplet",
      percent(today ? c.relative_humidity_2m : max("humidity")),
      "",
      today ? "Current" : "Daily maximum",
    ],
    [
      "Wind",
      "wind",
      number(speed(today ? c.wind_speed_10m : d.wind, state.unit), 1),
      units().wind,
      today ? `From ${compass(c.wind_direction_10m)}` : "Daily maximum",
    ],
    ["Rain chance", "cloud-drizzle", percent(d.rain), "", "Daily maximum"],
    [
      "Visibility",
      "eye",
      number(
        distance(today ? nearest?.visibility : mean("visibility"), state.unit),
        1,
      ),
      units().distance,
      today ? "Hourly estimate" : "Daily average",
    ],
    [
      "Pressure",
      "gauge",
      number(
        pressure(today ? c.surface_pressure : mean("pressure"), state.unit),
        state.unit === "f" ? 2 : 0,
      ),
      units().pressure,
      today ? "Surface pressure" : "Daily average",
    ],
    ["UV index", "sun", number(d.uv, 1), "", `${uvLabel(d.uv)} · Daily max`],
  ];
  $("weather-details").innerHTML = rows
    .map(
      ([label, name, value, unit, caption]) =>
        `<div><dt>${icon(name)}${label}</dt><dd>${esc(value)}${unit ? ` <small>${unit}</small>` : ""}</dd><span class="detail-caption">${esc(caption)}</span></div>`,
    )
    .join("");
}
function renderDaylight() {
  const day = state.data.days[state.day],
    info = daylightInfo(day, state.data.current.time);
  $("sunrise").textContent = clock(day.sunrise, state.data.timezone);
  $("sunset").textContent = clock(day.sunset, state.data.timezone);
  const duration = finite(day.daylight)
    ? day.daylight
    : finite(day.sunset) && finite(day.sunrise)
      ? day.sunset - day.sunrise
      : null;
  const minutes = finite(duration) ? Math.round(duration / 60) : null;
  $("daylight-duration").textContent =
    minutes === null
      ? "Unavailable"
      : `${Math.floor(minutes / 60)}h ${minutes % 60}m of daylight`;
  $("sun-note").textContent = info.label;
  $("sun-position").hidden = state.day !== 0 || info.position === null;
  $("sun-position").style.setProperty("--sun", `${info.position ?? 0}%`);
  $("daylight-track").setAttribute(
    "aria-label",
    `Sunrise ${clock(day.sunrise, state.data.timezone)}, sunset ${clock(day.sunset, state.data.timezone)}`,
  );
}
async function search(query) {
  query = query.trim();
  if (query.length < 2) {
    info("Enter at least two characters to find a city.");
    $("city-input").focus();
    return;
  }
  const { id, signal } = begin();
  setBusy(false);
  hideNotice();
  $("results-list").innerHTML =
    '<p class="results-empty">Searching for places…</p>';
  $("search-results").hidden = false;
  $("city-input").setAttribute("aria-expanded", "true");
  status("Searching cities.");
  try {
    const response = await fetchJSON(
      `https://geocoding-api.open-meteo.com/v1/search?${new URLSearchParams({ name: query, count: "6", language: "en", format: "json" })}`,
      signal,
    );
    if (id !== state.operation) return;
    state.results = (response.results || [])
      .map((c) =>
        cleanCity({
          name: c.name,
          country: c.country,
          region: c.admin1,
          lat: c.latitude,
          lon: c.longitude,
        }),
      )
      .filter(Boolean);
    $("results-list").innerHTML = state.results.length
      ? state.results
          .map(
            (city, i) =>
              `<button class="result-button" data-result="${i}"><span><strong>${esc(city.name)}</strong><small>${esc([city.region, city.country].filter(Boolean).join(", "))}</small></span><span class="result-coords">${city.lat.toFixed(2)}°, ${city.lon.toFixed(2)}°</span></button>`,
          )
          .join("")
      : '<p class="results-empty">No matching cities. Try a nearby city or include the country.</p>';
    status(`${state.results.length} locations found.`);
  } catch (error) {
    if (id !== state.operation || error.name === "AbortError") return;
    closeResults();
    info(errorText(error), () => search(query));
    status("City search failed.");
  } finally {
    if (state.data) $("updated-time").textContent = freshnessText();
  }
}
async function locate() {
  if (!navigator.geolocation) {
    info(
      "Location is not available in this browser. Search for your city instead.",
    );
    return;
  }
  const op = begin();
  setBusy(false);
  closeResults();
  hideNotice();
  status("Waiting for location permission.");
  $("location-btn").disabled = true;
  const timer = setTimeout(() => {
    if (op.id === state.operation) {
      state.operation++;
      state.controller.abort();
      $("location-btn").disabled = false;
      info("Location took too long. Try again or search for your city.");
    }
  }, 16000);
  try {
    const pos = await new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 10000,
        maximumAge: 300000,
        enableHighAccuracy: false,
      }),
    );
    if (op.id !== state.operation) return;
    let city = {
      name: "Your location",
      country: `${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°`,
      lat: pos.coords.latitude,
      lon: pos.coords.longitude,
    };
    try {
      const place = await fetchJSON(
        `https://nominatim.openstreetmap.org/reverse?${new URLSearchParams({ format: "jsonv2", lat: city.lat, lon: city.lon, zoom: "10", "accept-language": "en" })}`,
        op.signal,
        4000,
      );
      const a = place.address || {};
      city = {
        ...city,
        name: a.city || a.town || a.village || a.municipality || city.name,
        country: a.country || city.country,
      };
    } catch {
      /* Coordinates still identify the requested place when naming is unavailable. */
    }
    if (op.id === state.operation)
      await loadCity(city, { focus: true, operation: op });
  } catch (error) {
    if (op.id !== state.operation) return;
    info(
      error.code === 1
        ? "Location permission was denied. Allow it in your browser or search for your city."
        : error.code === 3
          ? "Location took too long. Try again or search for your city."
          : "Could not determine your location. Search for your city instead.",
    );
    status("Location unavailable.");
  } finally {
    clearTimeout(timer);
    $("location-btn").disabled = false;
  }
}

$("search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  search($("city-input").value);
});
$("results-list").addEventListener("click", (event) => {
  const button = event.target.closest("[data-result]");
  if (button) {
    loadCity(state.results[Number(button.dataset.result)], { focus: true });
    $("city-input").value = "";
  }
});
$("close-results").addEventListener("click", () => closeResults(true));
document.addEventListener("click", (event) => {
  if (!event.target.closest(".search-region")) closeResults();
});
document.addEventListener("keydown", (event) => {
  if (
    event.key === "/" &&
    !["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName) &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey
  ) {
    event.preventDefault();
    $("city-input").focus();
  }
  if (event.key === "Escape" && !$("search-results").hidden) {
    state.controller?.abort();
    closeResults(true);
  }
  if (
    event.key === "ArrowDown" &&
    event.target === $("city-input") &&
    !$("search-results").hidden
  ) {
    event.preventDefault();
    $("results-list").querySelector("button")?.focus();
  }
});
$("recent-list").addEventListener("click", (event) => {
  const b = event.target.closest("[data-recent]");
  if (b)
    loadCity(
      (state.recent.length ? state.recent : STARTER_CITIES)[
        Number(b.dataset.recent)
      ],
      { focus: true },
    );
});
$("clear-recent").addEventListener("click", () => {
  state.recent = [];
  storage.remove("weatherflow_recent");
  renderRecent();
  $("recent-list").querySelector("button")?.focus();
  status("Recent cities cleared.");
});
$("forecast-list").addEventListener("click", (event) => {
  const b = event.target.closest("[data-day]");
  if (!b || !state.data) return;
  state.day = Number(b.dataset.day);
  $("forecast-list")
    .querySelectorAll("button")
    .forEach((x) => x.setAttribute("aria-pressed", x === b));
  renderDay();
  status(
    `Showing ${dateLabel(state.data.days[state.day].time, state.data.timezone)} forecast.`,
  );
});
document.querySelectorAll("[data-metric]").forEach((b) =>
  b.addEventListener("click", () => {
    state.metric = b.dataset.metric;
    if (state.data) renderHourly();
  }),
);
for (const unit of ["c", "f"])
  $("unit-" + unit).addEventListener("click", () => {
    state.unit = unit;
    storage.set("weatherflow_unit", unit);
    syncUnits();
    render();
    status(`Using ${unit === "f" ? "imperial" : "metric"} units.`);
  });
$("theme-toggle").addEventListener("click", () => {
  const theme =
    document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem("weatherflow_theme", theme);
  } catch {}
  syncTheme();
  if (state.data) renderHourly();
});
$("refresh-btn").addEventListener("click", () =>
  loadCity(
    state.city ||
      cleanCity(storage.get("weatherflow_last_city", null)) ||
      DEFAULT_CITY,
  ),
);
$("location-btn").addEventListener("click", locate);
$("dismiss-notice").addEventListener("click", hideNotice);
syncUnits();
syncTheme();
renderRecent();
const last =
  cleanCity(storage.get("weatherflow_last_city", null)) || DEFAULT_CITY;
const snapshot = storage.get("weatherflow_snapshot_v2", null);
if (
  snapshot &&
  finite(snapshot.updated) &&
  snapshot.updated <= Date.now() &&
  Date.now() - snapshot.updated < 86400000 &&
  cleanCity(snapshot.city) &&
  cityKey(snapshot.city) === cityKey(last) &&
  dateKey(snapshot.raw?.daily?.time?.[0], snapshot.raw?.timezone) ===
    dateKey(Date.now() / 1000, snapshot.raw?.timezone)
) {
  try {
    Object.assign(state, {
      city: last,
      data: normalizeWeather(snapshot.raw),
      raw: snapshot.raw,
      updated: snapshot.updated,
      saved: true,
    });
    render();
  } catch {
    storage.remove("weatherflow_snapshot_v2");
  }
}
loadCity(last);
