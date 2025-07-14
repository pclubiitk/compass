
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

1. Create a `Locations` table in your PostgreSQL database (if not already done). Example schema:

```sql
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    location_id UUID UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    contributed_by TEXT,
    average_rating FLOAT DEFAULT 0,
    review_count BIGINT DEFAULT 0
);
```

2. Edit the `psycopg2.connect()` parameters in `parse.py` to match your database credentials.

3. Place your GeoJSON file as `locations.geojson` in the same directory as `parse.py`.

### Run

```bash
python parse.py
```

All valid location entries will be inserted with status `approved` and contributor `admin`.

