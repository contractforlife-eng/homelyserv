# Family Tracking map provider gate

Family Tracking does not contact a public tile server by default. Recorded GPS
geometry remains interactive in Leaflet without basemap tiles.

A production basemap may be enabled only after HomelyServ approves a provider's
terms, capacity, data-processing terms, retention, regional availability, cost,
and required privacy-policy disclosures. Public OpenStreetMap tile servers are
not an approved production default and must not be configured implicitly.

After approval, deployment configuration may provide:

- `VITE_FAMILY_TRACKING_TILE_URL`
- `VITE_FAMILY_TRACKING_TILE_ATTRIBUTION`

Do not put provider credentials in source control. Prefer a provider-supported
browser token restricted by origin, or an approved server integration when the
provider's terms explicitly permit it.
