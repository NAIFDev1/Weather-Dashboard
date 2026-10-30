# WeatherFlow overview

Mode: Operate. Target: index.html, style.css, script.js, weather.js.
User delegated design and implementation after confirming the English weather-tool brief. This overrides further concept approval rounds.

## Direction contract

THESIS: Understand the shape of the coming day, then choose a day to inspect. The hourly timeline and seven daily temperature intervals replace a stack of identical tiles.

OWN-WORLD: Restrained daylight palette: warm ivory, white, charcoal, burnt-orange data and pale apricot selection. DM Sans with tabular numerals, flat 16px panels, native web controls. Light suits a quick outdoor phone check; dark is an equal user preference.

STORY: Search a precise city, read conditions at its local time, inspect hourly temperature/rain/wind, and choose one of seven days. Recent places remain one click away.

FIRST VIEWPORT: Brand/search/controls header, horizontal recent-city strip, city heading and refresh. Two columns: current conditions left, hourly timeline right. Beneath: seven-day interval list opposite divided conditions and daylight panels. No sidebar or marketing hero. Signature: selecting a day's interval switches the hourly forecast and date-scoped highlights together.

FORM: Grounded candidate 4, Daylight horizon, seed:8eacb554aff67202. Ordered candidates: coastal field notes; station observation; weather atlas; daylight horizon; printed almanac; cloud classification; seasonal calendar. Challengers declined: split-flap imposes departure semantics; lexicon adds reading apparatus; cassette imposes unrelated sequencing; slide-rack and Crouwel emphasize grids over weather clarity; zoo map prioritizes geography over hourly decisions. Retained discipline: stable rows, explicit units, time sequence, grouping, exact alignment, wayfinding. No motifs borrowed. Taste accent-ladder seed 1559007672 retained with weather orange instead of raspberry. No-sidebar exception: no destinations warrant permanent navigation; cities are scope. Code-led under Operate, no comp.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Quality bar

City disambiguation, measured forecast chart plus keyboard-readable hourly values, timezone-correct times, consistent conversion, seven day-scoped forecasts, honest loading/error/cached/missing states. Verify 320–1440px, both themes, real API and deterministic edge cases. Current temperature intentionally exceeds generic KPI sizing: it is the weather tool's primary reading.
