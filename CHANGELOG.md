# Changelog

User-facing changes to FloodRisk are recorded here, newest release first.
Version numbers use MAJOR.MINOR.PATCH: breaking changes, new features, and fixes.

## Unreleased

Changes after the prepared v1.1.5 snapshot have not yet been summarized here.
Before the next release, summarize the verified changes under Added, Changed,
and Fixed, then replace this heading with the version and release date.

## v1.1.5 - 2026-10-31 (prepared, not published)

### Fixed

- Saved light/dark theme choices in browser local storage and restored them on the landing page and dashboard.
- Applied the selected or saved theme to full-page loading screens, including their background colors.

### Changed

- Replaced the translucent, blurred map loading overlay with a solid theme-colored background.

### Validation

- This historical application snapshot has not been run or tested end to end.

## v1.1.4 - 2026-10-25 (prepared, not published)

### Fixed

- Updated ward import logic to combine duplicate ward-number geometries into one MultiPolygon, including Bhopal ward 76, and updated the bundled database.
- Disabled launching GIS analytics while cities are loading or when no cities are available.
- Added HTTP response checks to city, terrain, rainfall, and ward requests.

### Changed

- Added full-page and map-overlay loading feedback for city lists, dashboard startup, and data requests.
- Improved map initialization animations and loading messages.
- Updated dashboard ward selection and presentation, and corrected interface wording.
- Clarified assumptions about stormwater drainage and updated limitations text.

### Validation

- This historical application snapshot has not been run or tested end to end.
- An unrelated WaterAudit planning document in this historical snapshot is excluded from the FloodRisk release notes.

## v1.1.3 - 2026-10-16 (prepared, not published)

### Changed

- Updated the bundled GIS database for the 24-city dataset.
- No application code changes are included in this release range.

### Data

- The resulting database contains 24 cities, 640 wards, and 28,116 ward-year statistics records.
- Includes 1,056 rainfall statistics records, 1,056 rainfall intensity records,
  and terrain statistics for 24 cities.
- These totals describe the complete snapshot, not the number of newly added records.

### Validation

- SQLite database integrity check passed.
- This historical application snapshot has not been run or tested end to end.

## v1.1.2 - 2026-09-07 (prepared, not published)

### Changed

- Added support for `NEXT_PUBLIC_CARTO_API_KEY` in CARTO basemap tile requests for both light and dark themes.
- Retained the CARTO Voyager light basemap and Dark Matter dark basemap in the final snapshot.

### Configuration

- Configure `NEXT_PUBLIC_CARTO_API_KEY` in the frontend build environment for this snapshot; its value is included in browser-visible tile requests.

### Validation

- Map loading in this historical application snapshot has not been tested live.

## v1.1.1 - 2026-08-22 (prepared, not published)

### Fixed

- Corrected landing-page dropdown layering and stopped city-option clicks from reopening the dropdown.
- Updated dashboard URL synchronization to use the Next.js router without scrolling or adding a history entry for each selection change.
- Included a populated backend database for Render deployment.

### Changed

- Updated the bundled GIS database and added Barwani to the data-import configuration.
- Replaced the default site favicon with the IIT Indore logo.

### Data and maintenance

- Added exported GeoJSON map snapshots for multiple cities and selected years.
- Updated ignore rules for database files, map exports, archives, and local export scripts, while explicitly retaining the backend database.

### Validation

- This historical application snapshot has not been run or tested end to end.

## v1.1.0 - 2026-06-19 (prepared, not published)

### Added

- City summary statistics for population, ward count, mean flood risk, and high-risk wards.
- Ward filtering by risk category and minimum/maximum FRI, with sorting by ward number, population, or rank.
- Dedicated terrain, rainfall, assumptions, and limitations windows.
- Mobile dashboard controls for switching between the map and sidebar.
- IIT Indore logo and updated platform branding.
- Year-specific population values in ward data and historical trend API responses.

### Changed

- Reorganized dashboard navigation into City Overview and Ward Overview.
- Updated dashboard theme styling and map interaction behavior.
- Expanded and corrected the bundled dataset and data-import logic, including Bhopal ward mappings.

### Validation

- This historical application snapshot has not been run or tested end to end.

## v1.0.2 - 2026-06-17 (prepared, not published)

### Fixed

- Replaced the empty backend SQLite database with a populated dataset for the GIS dashboard.

### Data

- Included 3 cities, 251 wards, and 11,000 ward-year statistics records.
- Included 132 rainfall statistics records, 132 rainfall intensity records,
  and terrain statistics for 3 cities.

### Maintenance

- Updated database ignore rules so the backend database could be tracked in Git.

### Validation

- SQLite database integrity check passed.
- This historical application snapshot has not been run or tested end to end.

## v1.0.1 - 2026-06-15

### Changed

- Moved city and year selection to a dedicated landing page, with the GIS dashboard available at `/dashboard`.
- Included the selected city and year in dashboard URLs so specific views can be shared and reopened.
- Added synchronization between dashboard selections and browser back/forward navigation.
- Made light mode the default appearance.
- Added support for configuring the backend address through `NEXT_PUBLIC_API_URL`, with a localhost fallback, for the dashboard, landing page, and ward trends.

### Fixed

- Adjusted map layer refresh logic to account for changes in city data, year, theme, and selected ward.
- Prevented the initial city-list response from overriding a city specified in the dashboard URL.

### Maintenance

- Adjusted repository ignore rules.

## v1.0.0 - 2026-06-13

### Added

- Interactive GIS dashboard for exploring urban flood risk by city and year.
- Ward-level map visualization of flood risk, hazard, exposure, and vulnerability indicators.
- Searchable ward list with risk categories and rankings.
- Ward details and historical trend charts.
- City terrain statistics and rainfall history visualizations.
- City and year selection, with a year selector covering 1981-2024 where data is available.
- Light and dark themes.
- Backend API endpoints for cities, terrain, rainfall, wards, and ward trends.

[Unreleased]: https://github.com/theub002/FloodRisk/compare/v1.0.0...HEAD
[v1.0.2]: https://github.com/theub002/FloodRisk/compare/v1.0.1...v1.0.2
[v1.1.0]: https://github.com/theub002/FloodRisk/compare/v1.0.2...v1.1.0
[v1.1.1]: https://github.com/theub002/FloodRisk/compare/v1.1.0...v1.1.1
[v1.1.2]: https://github.com/theub002/FloodRisk/compare/v1.1.1...v1.1.2
[v1.1.3]: https://github.com/theub002/FloodRisk/compare/v1.1.2...v1.1.3
[v1.1.4]: https://github.com/theub002/FloodRisk/compare/v1.1.3...v1.1.4
[v1.1.5]: https://github.com/theub002/FloodRisk/compare/v1.1.4...v1.1.5
[v1.0.1]: https://github.com/theub002/FloodRisk/compare/v1.0.0...v1.0.1
[v1.0.0]: https://github.com/theub002/FloodRisk/tree/v1.0.0
