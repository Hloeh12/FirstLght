# Renhuai Ziwei engine integration

Source: https://github.com/Renhuai123/ziwei-doushu
Pinned upstream: a600484a49255039d0725f1ba9e11ca81a948f97.
MIT copyright and license retained in src/renhuai/LICENSE.
Only pure computation, school tables and pattern rules are included; no dataset is imported.
Local adaptation removes Next.js server-only marker from patterns.ts. Other upstream rules remain intact.
Rebuild checked-in ESM with npm run build:ziwei. Runtime dependencies: iztro and lunar-javascript.

/api/ziwei keeps legacy dateStr/timeIndex/gender input. To correct actual clock time, send h/mi,
useSolarTime, city.lon/city.tz and lateZishi (default next-day; current-day supported).
The response exposes raw seven-level brightness, natal sihua, patterns with conditions/sources,
relatedBranches and correction diagnostics. QS is the upstream default brightness school.
Pattern membership is a rule match, not a guarantee about real life.

Geolocation requires permission and HTTPS. Local reverse lookup matches nearby district center,
labels the result approximate, and does not replace the device coordinates. Manual edits invalidate
pending geolocation callbacks. Outside the local geographic dataset, coordinates remain usable.

The full static interpretation database remains disabled. Existing AI report routes remain 501.
