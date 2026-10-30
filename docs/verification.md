# WeatherFlow verification

Verified 2026-10-30 against the rebuilt static application. Local preview: `http://127.0.0.1:4200/`.

## Automated checks

- `npm run check`: entry and domain module syntax.
- `npm test`: 10 passing domain invariants. Includes full region/country/coordinate identity for duplicate recent places, unit conversions, null versus zero, device-independent city dates, DST, forward hours across midnight, chosen-day scoping, response validation, range/daylight geometry, polar conditions, weather codes, API query construction and abort/error behavior.
- 47 browser assertions passed in the main interaction run. Five additional checks passed for the review correction and offline startup, for 52 browser checks total. Browser scripts and machine evidence remain outside the repository in the sibling `weatherflow-evidence` directory; these checks are not claimed as CI tests.
- API data was fetched from Open-Meteo and rendered successfully in Chrome with seven days and 168 hourly samples. Current conditions and sunrise/sunset were checked against the returned epoch times. Actual live searches returned multiple Londons with geographic qualifiers.

## Browser coverage

Main checks cover current temperature, city-local time, unit conversion across all measurements, the bounded rain scale, wind units, future-day hourly/detail/daylight changes, preserving current readings, selected chart retention after resize, blank search, geographic disambiguation, native Enter/ArrowDown/Escape keyboard interaction, coordinate reuse, no results, untrusted labels, retry, 429 response, offline refresh, missing values, geolocation denied/granted, request races, preference restoration, corrupt/denied storage and no uncaught app errors.

Long names fit without page overflow at 320, 375, 390, 540, 600, 768, 900, 1024, 1280 and 1440px. Duplicate Londons are distinguished by England/Ontario and same-country Ohio/Kentucky; mobile recent controls scroll without collapsing. Offline startup was checked both with no snapshot and with a valid same-day snapshot clearly labeled Saved conditions/Saved forecast.

The reproducible interaction run uses a captured real API response with simulated search labels and injected failures. The final light/dark desktop, tablet, mobile, selected-day and search captures use live API responses. Offline refresh was then simulated while retaining that live response. No fixture or fake weather data ships in the application.

## Visual review

The two build-thread inspection rounds captured 1440px, 768px and 390px; both themes, future-day selection, search, offline refresh and overlong names were opened and inspected. The review correction recaptured the named duplicate-city stress states. Final deliverable screenshots in `screenshots/` are actual application captures with embedded provenance.

Impeccable detection ran once. Its tiny-text warning was addressed by raising 11px text to 12px and data labels to 13px. The em-dash advisory is retained: those marks primarily denote unavailable data, not prose punctuation. Taste source lint had zero failures; its shadow warning describes the floating search results overlay. Taste browser inspection had zero failures; its warnings were a warm low-chroma palette, compact metadata (subsequently enlarged), excess blank space in current conditions (subsequently filled with a computed coolest-ahead finding) and the large primary temperature reading. That temperature is intentionally prominent for the weather task. The inspector report predates those final readability refinements; no claim of a second detector/inspector run is made.

The independent finish review and disposition are recorded in `docs/design-review.md`.

## Limits

Geolocation grant/denial and delayed-request races are deterministic browser simulations, not tests of a user's physical GPS. No manual screen-reader session or cross-engine Safari/Firefox certification was performed. Public service uptime and forecast accuracy are external. The snapshot is same-day saved-data recovery; application assets are not cached by a service worker. Publication is a separate action from this implementation.
