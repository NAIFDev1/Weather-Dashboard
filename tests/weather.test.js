import test from "node:test";
import assert from "node:assert/strict";
import {
  temperature,
  speed,
  pressure,
  distance,
  finite,
  clock,
  dateKey,
  normalizeWeather,
  hoursFor,
  rangePosition,
  daylightInfo,
  cleanRecent,
  recentDescriptor,
  validCity,
  forecastURL,
  weatherMeta,
  compass,
  fetchJSON,
} from "../weather.js";

test("duplicate recent cities retain visible regional and accessible coordinate identity", () => {
  const cities = [
    {
      name: "London",
      region: "England",
      country: "United Kingdom",
      lat: 51.5,
      lon: -0.12,
    },
    { name: "London", region: "Ontario", country: "Canada", lat: 43, lon: -81 },
    {
      name: "London",
      region: "Ohio",
      country: "United States",
      lat: 39,
      lon: -83,
    },
    {
      name: "London",
      region: "Kentucky",
      country: "United States",
      lat: 37,
      lon: -84,
    },
  ];
  assert.deepEqual(
    cities.map((c) => recentDescriptor(c, cities).qualifier),
    ["England", "Ontario", "Ohio", "Kentucky"],
  );
  assert.match(
    recentDescriptor(cities[2], cities).full,
    /London, Ohio, United States, 39.00°, -83.00°/,
  );
  const unnamed = cities.slice(2).map((c) => ({ ...c, region: "" }));
  assert.equal(
    recentDescriptor(unnamed[0], unnamed).qualifier,
    "39.00°, -83.00°",
  );
  assert.equal(recentDescriptor(cities[0], [cities[0]]).qualifier, "");
});

test("metric and imperial conversions keep zeros and missing values distinct", () => {
  assert.equal(temperature(0, "f"), 32);
  assert.equal(temperature(-40, "f"), -40);
  assert.ok(Math.abs(speed(100, "f") - 62.1371192) < 0.00001);
  assert.ok(Math.abs(pressure(1013.25, "f") - 29.92125) < 0.001);
  assert.ok(Math.abs(distance(1609.344, "f") - 1) < 0.00001);
  for (const value of [null, undefined, NaN, Infinity, "0"]) {
    assert.equal(temperature(value, "f"), null);
    assert.equal(finite(value), false);
  }
});
test("city time is independent of the device timezone and handles DST", () => {
  const epoch = Date.parse("2026-10-30T23:30:00Z") / 1000;
  assert.equal(clock(epoch, "Asia/Riyadh"), "02:30");
  assert.equal(dateKey(epoch, "Asia/Riyadh"), "2026-10-31");
  assert.equal(
    clock(Date.parse("2026-03-29T00:30:00Z") / 1000, "Europe/London"),
    "00:30",
  );
  assert.equal(
    clock(Date.parse("2026-03-29T01:30:00Z") / 1000, "Europe/London"),
    "02:30",
  );
  assert.equal(clock(null, "Asia/Riyadh"), "—");
  assert.equal(clock(epoch, undefined), "23:30");
});
test("storage restoration validates coordinates and deduplicates places", () => {
  const city = { name: "London", lat: 51.5, lon: -0.12, country: "UK" };
  assert.equal(validCity({ ...city, lat: 91 }), false);
  assert.equal(validCity({ ...city, lon: "0" }), false);
  assert.equal(
    cleanRecent([null, city, city, { name: "x", lat: 0, lon: 0 }]).length,
    2,
  );
  assert.deepEqual(cleanRecent("corrupt"), []);
});
function forecast() {
  const start = Date.parse("2026-10-30T00:00Z") / 1000;
  const times = Array.from({ length: 72 }, (_, i) => start + i * 3600);
  return {
    timezone: "UTC",
    current: { time: start + 23.25 * 3600, temperature_2m: 0 },
    daily: {
      time: [start, start + 86400, start + 172800],
      temperature_2m_min: [0, -2, -3],
      temperature_2m_max: [7, 8, 9],
    },
    hourly: {
      time: times,
      temperature_2m: times.map((_, i) => (i === 0 ? null : 0)),
      precipitation_probability: times.map(() => 0),
    },
  };
}
test("today has 24 forward hours across midnight; another day stays inside its date", () => {
  const data = normalizeWeather(forecast());
  const today = hoursFor(data, 0),
    tomorrow = hoursFor(data, 1);
  assert.equal(today.length, 24);
  assert.equal(clock(today[0].time, "UTC"), "23:00");
  assert.equal(clock(today.at(-1).time, "UTC"), "22:00");
  assert.equal(tomorrow.length, 24);
  assert.ok(tomorrow.every((h) => h.key === data.days[1].key));
  assert.deepEqual(hoursFor(data, 99), []);
  assert.equal(data.hours[0].temp, null);
  assert.equal(data.hours[1].temp, 0);
  assert.equal(data.hours[0].rain, 0);
});
test("incomplete responses cannot become a seemingly successful forecast", () => {
  for (const raw of [
    null,
    {},
    { current: { time: 123 }, daily: { time: [] }, hourly: { time: [] } },
    { current: { time: 123 }, daily: { time: [null] }, hourly: { time: [] } },
  ])
    assert.throws(() => normalizeWeather(raw), /incomplete/);
});
test("range and daylight geometry reflect actual data, including polar conditions", () => {
  assert.deepEqual(rangePosition(0, 10, -10, 30), { start: 25, span: 25 });
  assert.deepEqual(rangePosition(5, 5, 5, 5), { start: 0, span: 0 });
  assert.equal(daylightInfo({ sunrise: 100, sunset: 200 }, 150).position, 50);
  assert.equal(daylightInfo({ sunrise: 100, sunset: 200 }, 250).position, null);
  assert.equal(
    daylightInfo({ sunrise: null, sunset: null, daylight: 86400 }, 150).label,
    "Midnight sun",
  );
  assert.equal(
    daylightInfo({ sunrise: null, sunset: null, daylight: 0 }, 150).label,
    "Polar night",
  );
});
test("weather codes cover night, rain, snow, storm and unknown; bearings wrap", () => {
  assert.equal(weatherMeta(0, 0).icon, "moon");
  assert.equal(weatherMeta(63).icon, "cloud-rain");
  assert.equal(weatherMeta(75).icon, "cloud-snow");
  assert.equal(weatherMeta(99).icon, "cloud-lightning");
  assert.equal(weatherMeta(null).label, "Conditions unavailable");
  assert.equal(compass(360), "N");
  assert.equal(compass(90), "E");
});
test("forecast requests use epoch times, native base units and seven days", () => {
  const url = new URL(forecastURL({ lat: 0, lon: 0 }));
  assert.equal(url.searchParams.get("timeformat"), "unixtime");
  assert.equal(url.searchParams.get("forecast_days"), "7");
  assert.equal(url.searchParams.get("temperature_unit"), null);
  assert.equal(url.searchParams.get("timezone"), "auto");
});
test("HTTP failures, timeouts and cancellation surface instead of masquerading as data", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ ok: false, status: 429 });
    await assert.rejects(fetchJSON("https://example.invalid"), /busy/);
    globalThis.fetch = async (_url, { signal }) =>
      new Promise((resolve, reject) => {
        signal.addEventListener("abort", () => reject(signal.reason), {
          once: true,
        });
      });
    const controller = new AbortController();
    const pending = fetchJSON("https://example.invalid", controller.signal);
    controller.abort();
    await assert.rejects(pending, { name: "AbortError" });
  } finally {
    globalThis.fetch = original;
  }
});
