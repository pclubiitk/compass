
## GeoJSON to PostgreSQL Importer

This script parses a GeoJSON `FeatureCollection` file and populates a `Locations` table in PostgreSQL. It handles both `Point` and multi-point geometries (like `Polygon` or `LineString`) by averaging the coordinates.

### Requirements

- Python 3.7+
- PostgreSQL with a table named `locations`
- Python package: `psycopg2`

Install the required dependency using pip:

```bash
pip install psycopg2-binary
```
### File Structure

```
.
├── parse.py
├── locations.geojson
└── parse_README.md
```

### Setup

1. Create the `Locations` table in the PostgreSQL database.

2. Edit the `psycopg2.connect()` parameters in `parse.py` to match your database credentials.

3. Place your GeoJSON file as `locations.geojson` in the same directory as `parse.py`.

### Run

```bash
python parse.py
```

All valid location entries will be inserted with status `approved` and contributor `admin`.

