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
            INSERT INTO locations (
                created_at, 
                updated_at, 
                deleted_at, 
                location_id, 
                name, 
                description, 
                latitude, 
                longitude, 
                location_type, 
                status, 
                contributed_by, 
                average_rating, 
                review_count
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            datetime.now(),           # created_at
            datetime.now(),           # updated_at
            None,                     # deleted_at
            location_id,              # location_id (uuid.UUID)
            name,                     # name
            "description",              # description
            lat,                      # latitude
            lon,                      # longitude
            "location_type",            # location_type
            'approved',               # status
            "31b0bc36-6fc3-4040-9590-fb5d579e77df", # contributed_by
            0.0,                      # average_rating
            0                         # review_count
        ))
        print("Added location:", name)


    except Exception as e:
        print("Error on feature:", e)

conn.commit()
cursor.close()
conn.close()
