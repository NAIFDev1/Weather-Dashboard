// Domain functions are shared by the interface and the invariant tests.
export const DEFAULT_CITY = {
  name: "Riyadh",
  country: "Saudi Arabia",
  region: "Riyadh Region",
  lat: 24.7136,
  lon: 46.6753,
};
export const STARTER_CITIES = [
  DEFAULT_CITY,
  { name: "London", country: "United Kingdom", lat: 51.5085, lon: -0.1257 },
  { name: "Tokyo", country: "Japan", lat: 35.6895, lon: 139.6917 },
];
export const finite = (value) =>
  typeof value === "number" && Number.isFinite(value);
export const number = (value, digits = 0) =>
  finite(value)
    ? new Intl.NumberFormat("en", {
        maximumFractionDigits: digits,
        minimumFractionDigits: digits,
      }).format(value)
    : "—";
export const temperature = (value, unit) =>
  finite(value) ? (unit === "f" ? (value * 9) / 5 + 32 : value) : null;
export const speed = (value, unit) =>
  finite(value) ? (unit === "f" ? value * 0.621371192 : value) : null;
export const pressure = (value, unit) =>
  finite(value) ? (unit === "f" ? value * 0.029529983 : value) : null;
export const distance = (metres, unit) =>
  finite(metres) ? metres / (unit === "f" ? 1609.344 : 1000) : null;
export const percent = (value) => (finite(value) ? `${number(value)}%` : "—");
export function validCity(city) {
  return (
    !!city &&
    typeof city.name === "string" &&
    city.name.trim().length > 0 &&
    city.name.length <= 120 &&
    finite(city.lat) &&
    Math.abs(city.lat) <= 90 &&
    finite(city.lon) &&
    Math.abs(city.lon) <= 180
  );
}
export const cityKey = (city) =>
  `${city.lat.toFixed(3)},${city.lon.toFixed(3)}`;
export function recentDescriptor(city, cities) {
  const peers = cities.filter(
    (other) => other.name.toLocaleLowerCase() === city.name.toLocaleLowerCase(),
  );
  const unique = (key) =>
    city[key] &&
    peers.filter((other) => other[key]?.slice(0, 18) === city[key].slice(0, 18))
      .length === 1;
  const coords = `${city.lat.toFixed(2)}°, ${city.lon.toFixed(2)}°`;
  const qualifier =
    peers.length < 2
      ? ""
      : unique("region")
        ? city.region
        : unique("country")
          ? city.country
          : coords;
  return {
    qualifier,
    full: [
      ...new Set([city.name, city.region, city.country].filter(Boolean)),
      coords,
    ].join(", "),
  };
}
export function cleanCity(city) {
  return validCity(city)
    ? {
        name: city.name.trim().slice(0, 120),
        country:
          typeof city.country === "string" ? city.country.slice(0, 120) : "",
        region:
          typeof city.region === "string" ? city.region.slice(0, 120) : "",
        lat: city.lat,
        lon: city.lon,
      }
    : null;
}
export function cleanRecent(value) {
  return Array.isArray(value)
    ? value
        .map(cleanCity)
        .filter(Boolean)
        .filter(
          (c, i, all) => all.findIndex((x) => cityKey(x) === cityKey(c)) === i,
        )
        .slice(0, 8)
    : [];
}
export function zone(value) {
  if (typeof value !== "string" || !value.trim()) return "UTC";
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return value;
  } catch {
    return "UTC";
  }
}
export function clock(epoch, timeZone) {
  if (!finite(epoch)) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: zone(timeZone),
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(epoch * 1000));
}
export function dateLabel(
  epoch,
  timeZone,
  options = { weekday: "long", month: "short", day: "numeric" },
) {
  if (!finite(epoch)) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: zone(timeZone),
    ...options,
  }).format(new Date(epoch * 1000));
}
export function dateKey(epoch, timeZone) {
  if (!finite(epoch)) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: zone(timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(epoch * 1000));
}
export function compass(degrees) {
  return finite(degrees)
    ? [
        "N",
        "NNE",
        "NE",
        "ENE",
        "E",
        "ESE",
        "SE",
        "SSE",
        "S",
        "SSW",
        "SW",
        "WSW",
        "W",
        "WNW",
        "NW",
        "NNW",
      ][Math.round((((degrees % 360) + 360) % 360) / 22.5) % 16]
    : "—";
}
export function uvLabel(value) {
  return !finite(value)
    ? "Unavailable"
    : value < 3
      ? "Low"
      : value < 6
        ? "Moderate"
        : value < 8
          ? "High"
          : value < 11
            ? "Very high"
            : "Extreme";
}
const codes = {
  0: ["sun", "Clear sky"],
  1: ["sun", "Mainly clear"],
  2: ["cloud-sun", "Partly cloudy"],
  3: ["cloud", "Overcast"],
  45: ["cloud-fog", "Fog"],
  48: ["cloud-fog", "Rime fog"],
  51: ["cloud-drizzle", "Light drizzle"],
  53: ["cloud-drizzle", "Drizzle"],
  55: ["cloud-drizzle", "Heavy drizzle"],
  56: ["cloud-drizzle", "Freezing drizzle"],
  57: ["cloud-drizzle", "Freezing drizzle"],
  61: ["cloud-rain", "Light rain"],
  63: ["cloud-rain", "Rain"],
  65: ["cloud-rain", "Heavy rain"],
  66: ["cloud-rain", "Freezing rain"],
  67: ["cloud-rain", "Freezing rain"],
  71: ["cloud-snow", "Light snow"],
  73: ["cloud-snow", "Snow"],
  75: ["cloud-snow", "Heavy snow"],
  77: ["cloud-snow", "Snow grains"],
  80: ["cloud-rain", "Rain showers"],
  81: ["cloud-rain", "Rain showers"],
  82: ["cloud-rain", "Heavy showers"],
  85: ["cloud-snow", "Snow showers"],
  86: ["cloud-snow", "Heavy snow showers"],
  95: ["cloud-lightning", "Thunderstorm"],
  96: ["cloud-lightning", "Thunderstorm with hail"],
  99: ["cloud-lightning", "Thunderstorm with hail"],
};
export function weatherMeta(code, isDay = 1) {
  const [icon, label] = codes[code] || ["cloud", "Conditions unavailable"];
  return {
    icon: !isDay && [0, 1, 2].includes(code) ? "moon" : icon,
    label: !isDay && code === 0 ? "Clear night" : label,
  };
}
export function normalizeWeather(raw) {
  if (
    !raw ||
    !raw.current ||
    !finite(raw.current.time) ||
    !Array.isArray(raw.daily?.time) ||
    !raw.daily.time.length ||
    !raw.daily.time.every(finite) ||
    !Array.isArray(raw.hourly?.time)
  )
    throw new Error(
      "The weather service returned an incomplete forecast. Please try again.",
    );
  const read = (group, key, i) =>
    finite(group?.[key]?.[i]) ? group[key][i] : null;
  const days = raw.daily.time
    .slice(0, 7)
    .filter(finite)
    .map((time, i) => ({
      time,
      key: dateKey(time, raw.timezone),
      code: read(raw.daily, "weather_code", i),
      low: read(raw.daily, "temperature_2m_min", i),
      high: read(raw.daily, "temperature_2m_max", i),
      sunrise: read(raw.daily, "sunrise", i),
      sunset: read(raw.daily, "sunset", i),
      daylight: read(raw.daily, "daylight_duration", i),
      uv: read(raw.daily, "uv_index_max", i),
      rain: read(raw.daily, "precipitation_probability_max", i),
      precipitation: read(raw.daily, "precipitation_sum", i),
      wind: read(raw.daily, "wind_speed_10m_max", i),
    }));
  const hours = raw.hourly.time
    .map((time, i) => ({
      time,
      key: dateKey(time, raw.timezone),
      temp: read(raw.hourly, "temperature_2m", i),
      rain: read(raw.hourly, "precipitation_probability", i),
      wind: read(raw.hourly, "wind_speed_10m", i),
      humidity: read(raw.hourly, "relative_humidity_2m", i),
      pressure: read(raw.hourly, "surface_pressure", i),
      visibility: read(raw.hourly, "visibility", i),
      code: read(raw.hourly, "weather_code", i),
      isDay: read(raw.hourly, "is_day", i),
    }))
    .filter((h) => finite(h.time));
  return { current: raw.current, days, hours, timezone: zone(raw.timezone) };
}
export function hoursFor(data, dayIndex) {
  const day = data.days[dayIndex];
  if (!day) return [];
  if (dayIndex === 0)
    return data.hours
      .filter((h) => h.time > data.current.time - 3600)
      .slice(0, 24);
  return data.hours.filter((h) => h.key === day.key);
}
export function rangePosition(low, high, min, max) {
  if (![low, high, min, max].every(finite)) return { start: 0, span: 0 };
  const delta = max - min;
  if (delta <= 0) return { start: 0, span: 0 };
  return {
    start: Math.max(0, Math.min(100, ((low - min) / delta) * 100)),
    span: Math.max(0, Math.min(100, ((high - low) / delta) * 100)),
  };
}
export function daylightInfo(day, now) {
  if (!finite(day.sunrise) || !finite(day.sunset) || day.sunset <= day.sunrise)
    return {
      position: null,
      label: finite(day.daylight)
        ? day.daylight > 82800
          ? "Midnight sun"
          : day.daylight < 3600
            ? "Polar night"
            : "Sun times unavailable"
        : "Sun times unavailable",
    };
  return {
    position:
      finite(now) && now >= day.sunrise && now <= day.sunset
        ? ((now - day.sunrise) / (day.sunset - day.sunrise)) * 100
        : null,
    label: "Times in the selected city",
  };
}
export function forecastURL(city) {
  const p = new URLSearchParams({
    latitude: city.lat,
    longitude: city.lon,
    timezone: "auto",
    timeformat: "unixtime",
    forecast_days: "7",
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m",
    hourly:
      "temperature_2m,precipitation_probability,weather_code,wind_speed_10m,relative_humidity_2m,surface_pressure,visibility,is_day",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,daylight_duration,uv_index_max,precipitation_probability_max,precipitation_sum,wind_speed_10m_max",
  });
  return `https://api.open-meteo.com/v1/forecast?${p}`;
}
export async function fetchJSON(url, signal, timeout = 14000) {
  const response = await fetch(url, {
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(timeout)])
      : AbortSignal.timeout(timeout),
    headers: { Accept: "application/json" },
  });
  if (!response.ok)
    throw new Error(
      response.status === 429
        ? "The weather service is busy. Wait a moment and try again."
        : "The weather service could not respond. Please try again.",
    );
  return response.json();
}
