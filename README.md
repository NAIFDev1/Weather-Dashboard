# 🌦️ WeatherFlow — Weather Dashboard

A clean, modern, and fully responsive weather dashboard built with **pure HTML5, CSS3, and Vanilla JavaScript** — no frameworks, no dependencies, no API key required.

---

## 📸 Preview

> _Replace this section with screenshots of your application._

| Light Mode | Dark Mode |
|------------|-----------|
| ![Light Mode Screenshot](screenshots/light.png) | ![Dark Mode Screenshot](screenshots/dark.png) |

---

## ✨ Features

- 🔍 **City Search** — Search for any city worldwide with instant results
- 📍 **Current Location** — Use your browser's Geolocation API to auto-detect weather
- 🌡️ **Current Weather** — Temperature, condition, feels like, weather icon
- 📊 **Weather Details** — Humidity, wind speed & direction, pressure, visibility, UV index
- 📅 **7-Day Forecast** — Daily forecast cards with high/low temperatures and conditions
- 🌅 **Today at a Glance** — Sunrise, sunset, max humidity, max wind, precipitation chance
- 🕐 **Recent Searches** — Saves last 5 cities using LocalStorage; click to reload
- 🌙 **Dark / Light Mode** — Smooth theme toggle with preference saved in LocalStorage
- 🌡️ **°C / °F Toggle** — Switch temperature units dynamically; preference is remembered
- ❌ **Error Handling** — User-friendly messages for all failure scenarios
- ⏳ **Loading State** — Spinner and disabled controls while fetching
- ♿ **Accessible** — Semantic HTML, ARIA labels, keyboard navigation, focus states
- 📱 **Fully Responsive** — Works on mobile, tablet, and desktop

---

## 🛠️ Technologies

| Technology | Purpose |
|------------|---------|
| HTML5 | Semantic structure, accessibility |
| CSS3 | Variables, Grid, Flexbox, animations, responsive design |
| Vanilla JavaScript (ES2020+) | App logic, API calls, state management |
| Fetch API | HTTP requests to weather and geocoding APIs |
| LocalStorage | Persisting theme, unit, and recent searches |
| Geolocation API | Browser-based location detection |
| Open-Meteo API | Free weather data (no key required) |
| Nominatim / OpenStreetMap | Free reverse geocoding for location names |

---

## 🚀 Getting Started

### Option 1 — Open Directly

Since this project uses no build tools, simply open `index.html` in your browser:

```bash
# Clone the repo
git clone https://github.com/your-username/weatherflow.git

# Navigate into the project
cd weatherflow/weather-dashboard

# Open index.html in your default browser (macOS)
open index.html

# Or on Windows
start index.html

# Or on Linux
xdg-open index.html
```

### Option 2 — Live Server (recommended for development)

If you use VS Code, install the **Live Server** extension, right-click `index.html`, and select **"Open with Live Server"**.

### Option 3 — Python HTTP Server

```bash
cd weather-dashboard
python3 -m http.server 8080
# Visit http://localhost:8080
```

---

## 📡 API Information

### Weather Data — Open-Meteo

- **URL:** `https://api.open-meteo.com/v1/forecast`
- **Requires API Key:** ❌ No
- **Free Tier:** ✅ ~10,000 requests/day (non-commercial)
- **Coverage:** 🌍 Worldwide
- **Data:** Current weather, hourly & daily forecasts, UV index, visibility, pressure, and more

### City Search / Geocoding — Open-Meteo Geocoding

- **URL:** `https://geocoding-api.open-meteo.com/v1/search`
- **Requires API Key:** ❌ No
- **Database:** GeoNames (300,000+ cities)

### Reverse Geocoding — Nominatim (OpenStreetMap)

- **URL:** `https://nominatim.openstreetmap.org/reverse`
- **Requires API Key:** ❌ No
- **Used for:** Converting GPS coordinates → City name when using "My Location"
- **Usage Policy:** Must include a valid `User-Agent` or `Referer` header in production apps. Nominatim's [usage policy](https://operations.osmfoundation.org/policies/nominatim/) applies.

---

## 📁 Project Structure

```
weather-dashboard/
│
├── index.html      # Application shell — all HTML structure
├── style.css       # All styles — CSS variables, layout, components
├── script.js       # All JavaScript — API calls, DOM, state
└── README.md       # Project documentation
```

---

## 🧩 JavaScript Architecture

The script is organized into focused, readable functions:

| Function | Purpose |
|----------|---------|
| `fetchWeather(lat, lon, city, country)` | Calls Open-Meteo forecast API |
| `searchCity(query)` | Geocodes a city name then fetches weather |
| `getCurrentLocation()` | Uses Geolocation API + reverse geocoding |
| `displayWeather(data, city, country)` | Renders main weather card |
| `displayForecast(data)` | Renders 7-day forecast cards |
| `displayExtra(data)` | Renders today's at-a-glance stats |
| `toggleTemperatureUnit(unit)` | Switches °C / °F, re-renders temps |
| `toggleTheme()` | Switches dark / light mode |
| `saveRecentSearch(city)` | Writes to LocalStorage |
| `loadRecentSearches()` | Reads from LocalStorage |
| `renderRecentSearches(recent)` | Builds the recent chips in the UI |
| `showLoading()` / `hideLoading()` | Controls loading state |
| `showMessage(text, type)` | Displays error or info banner |
| `init()` | App entry point — restores preferences, binds events |

---

## 🌈 Customization

All colors and design tokens are in `style.css` as CSS variables:

```css
:root {
  --accent-gradient-start: #3b82f6;   /* Change primary accent */
  --accent-gradient-end:   #8b5cf6;   /* Change gradient end */
  --radius-lg: 16px;                  /* Card border radius */
  /* ... and more */
}
```

---

## 🔮 Future Improvements

- [ ] Hourly forecast chart using Canvas API
- [ ] Weather map integration (e.g., OpenLayers)
- [ ] Air quality index section
- [ ] Animated weather backgrounds based on conditions
- [ ] PWA support (Service Worker + Web App Manifest)
- [ ] Share weather card as image
- [ ] Multi-city comparison view
- [ ] Weather alerts / severe weather warnings

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Credits

- Weather data: [Open-Meteo](https://open-meteo.com/) — Free, open-source weather API
- Geocoding: [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api)
- Reverse geocoding: [Nominatim / OpenStreetMap](https://nominatim.openstreetmap.org/)
- Weather icons: Native emoji (universal, no external dependency)

---

> Built as a portfolio project demonstrating clean HTML/CSS/JS skills, API integration, responsive design, and accessibility best practices.
