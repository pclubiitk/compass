import csv
import psycopg2
import uuid
import random
from datetime import datetime


# List of contributor IDs for random selection
CONTRIBUTOR_IDS = [
    "6ba24233-80b7-42a2-a9c0-3832b5d2c3cd",
    "d564031b-7f5e-44f3-9819-8e6051574f4c",
    "6ec6a435-54d3-426a-9c5d-00e5c8475477",
    "8b80111a-34ac-4670-8e56-c4a0d603096c",
    "f4174c48-e7a6-499b-a379-f1464db0f4fb",
    "f8116873-ac15-4f1f-a314-671c87262902",
    "0dafe741-3558-40d8-aa7d-b1f432e9b58a",
    "ca47f1a8-d501-4508-acf2-9e7806c5683c",
    "5aa2853f-66d6-41fa-aed0-bf3e6d92d816",
    "5f000931-bff7-43b8-b7a1-bb6ad808d9a6",
    "b365f162-7a19-4571-8342-14b7cea187d0",
    "c0f891ba-9d64-431e-bf7c-b7536f7169e6",
]

# Connect to PSQL
conn = psycopg2.connect(  # edit these to match the Locations table
    dbname="compass",
    user="this_is_mjk",
    password="postgres",
    host="localhost",
    port=5432
)
cursor = conn.cursor()

# Read CSV file
with open("locations.csv", "r", encoding="utf-8") as f:
    csv_reader = csv.DictReader(f)
    
    for row in csv_reader:
        try:
            # Replace any cell that starts with "=AI(" with empty string
            cleaned_row = {}
            for key, value in row.items():
                if value and str(value).strip().startswith("=AI("):
                    cleaned_row[key] = ""
                else:
                    cleaned_row[key] = value
            
            # Extract only the required fields from cleaned CSV row
            name = cleaned_row.get('name', '').strip()
            description = cleaned_row.get('description', '').strip()
            latitude = cleaned_row.get('latitude', '').strip()
            longitude = cleaned_row.get('longitude', '').strip()
            location_type = cleaned_row.get('location_type', '').strip()
            
            # Skip if essential fields are missing
            if not name or not latitude or not longitude:
                print(f"Skipping row with missing essential data: name={name}")
                continue
            
            # Convert lat/lon to float
            try:
                lat = float(latitude)
                lon = float(longitude)
            except ValueError:
                print(f"Invalid coordinates for {name}: lat={latitude}, lon={longitude}")
                continue
            
            # Generate UUID for location_id
            location_id = str(uuid.uuid4())
            
            # Randomly select a contributor ID
            contributor_id = random.choice(CONTRIBUTOR_IDS)
            
            # Use default values if description or location_type is empty
            if not description:
                description = "No description available"
            if not location_type:
                location_type = "general"
            
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
                description,              # description
                lat,                      # latitude
                lon,                      # longitude
                location_type,            # location_type
                'approved',               # status
                contributor_id,           # contributed_by (randomly selected)
                0.0,                      # average_rating
                0                         # review_count
            ))
            print(f"Added location: {name} (contributed by: {contributor_id})")
            
        except Exception as e:
            print(f"Error processing row: {e}")
            print(f"Row data: {row}")

# Commit and close connection
conn.commit()
cursor.close()
conn.close()

print("\nCSV import completed successfully!")