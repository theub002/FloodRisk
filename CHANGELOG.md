# Changelog

User-facing changes to FloodRisk are recorded here, newest release first.
Version numbers use MAJOR.MINOR.PATCH: breaking changes, new features, and fixes.

## Unreleased

Later changes have not yet been summarized here. The v1.0.1 entry is pending;
v1.0.2 below is prepared for publication.
Before the next release, summarize the verified changes under Added, Changed,
and Fixed, then replace this heading with the version and release date.

## v1.0.2 - 2026-06-17 (prepared, not published)

Historical snapshot ending at commit 9528948. The date is the endpoint commit
date; the GitHub Release publication date may differ.

### Fixed

- Replaced the empty backend SQLite database with a populated dataset for the GIS dashboard.

### Data

- Included 3 cities, 251 wards, and 11,000 ward-year statistics records.
- Included 132 rainfall statistics records, 132 rainfall intensity records,
  and terrain statistics for 3 cities.

### Maintenance

- Updated database ignore rules so the backend database could be tracked in Git.

### Validation

- Checked the database bundled at 9528948: SQLite integrity check passed.
- This historical application snapshot has not been run or tested end to end.

## v1.0.0 - 2026-06-13

This entry describes the initial code snapshot tagged v1.0.0 (commit 41ca9cc).
The date above is the tagged commit date. The tag was created retrospectively;
the GitHub Release publication date may differ.

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
[v1.0.0]: https://github.com/theub002/FloodRisk/tree/v1.0.0
