import json
import psycopg2
import uuid
from datetime import datetime

def extract_coords(coord_list):
    # Recursively extract [lon, lat] pairs from nested lists
    points = []
    if isinstance(coord_list[0], (int, float)):
        points.append(coord_list)
    else:
        for sub in coord_list:
            points.extend(extract_coords(sub))
    return points

def average_coords(coords): # Averages out the coordinates for Polygons, Lines etc.
    flat_coords = extract_coords(coords)
    lats = [pt[1] for pt in flat_coords]
    lons = [pt[0] for pt in flat_coords]
    return sum(lats) / len(lats), sum(lons) / len(lons)

# Connect to PSQL
conn = psycopg2.connect( # edit these to match the Locations table
    dbname="compass",
    user="this_is_mjk",
    password="",
    host="",
    port=5432
)
cursor = conn.cursor()

# Read GeoJSON FeatureCollection
with open("locations.geojson", "r", encoding="utf-8") as f:
    geojson = json.load(f)

features = geojson["features"]

for feature in features:
    try:
        name = feature["properties"].get("name")
        coords = feature["geometry"]["coordinates"]
        geom_type = feature["geometry"]["type"]

        # If no name, skip
        if not name:
            continue

        if geom_type == "Point":
            lat, lon = coords[1], coords[0]
        else:
            lat, lon = average_coords(coords)

        location_id = str(uuid.uuid4())

        cursor.execute("""
            INSERT INTO locations (created_at, updated_at, deleted_at, location_id, name, latitude, longitude, status, contributed_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (str(datetime.now()), str(datetime.now()), None, location_id, name, lat, lon, 'approved', ''))
        print("added location: ", name)

    except Exception as e:
        print("Error on feature:", e)

conn.commit()
cursor.close()
conn.close()
