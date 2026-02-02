import psycopg2
import uuid
import csv
from datetime import datetime

# Connect to PSQL
conn = psycopg2.connect(
    dbname="compass",
    user="this_is_mjk",
    password="",
    host="localhost",
    port=5432
)
cursor = conn.cursor()

csv_file_path = 'family_tree.csv' 

unique_users = {} 

bapu_map = {} 

bachhas_map = {}

print("--- Reading CSV and aggregating data ---")

try:
    with open(csv_file_path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter=',')
        
        reader.fieldnames = [name.strip() for name in reader.fieldnames]

        for row in reader:
            p_name = row['Parent Name'].strip()
            p_id = row['Parent ID'].strip()
            c_name = row['Child Name'].strip()
            c_id = row['Child ID'].strip()
            p_gender = row['Gender'].strip()
            c_gender = row['Child_gender'].strip()

            # Avoid duplicates           
            unique_users[p_id] = {'name': p_name, 'gender': p_gender}
            unique_users[c_id] = {'name': c_name, 'gender': c_gender}

            bapu_map[c_id] = p_id

            # Map Parent -> Children (Bachhas)
            if p_id not in bachhas_map:
                bachhas_map[p_id] = []
            if c_id not in bachhas_map[p_id]:
                bachhas_map[p_id].append(c_id)

    print(f"Found {len(unique_users)} unique users.")
    print("--- Starting Database Insertion ---")

    for roll_no, user_data in unique_users.items():
        name = user_data['name']
        gender = user_data['gender']

        if name == "" or roll_no == "":
            continue
        user_uuid = str(uuid.uuid4())
        created_at = datetime.now()
        
        insert_user_query = """
        INSERT INTO users (user_id, email, created_at, updated_at, is_verified)
        VALUES (%s, %s, %s, %s, %s)
        """
        dummy_email = f'cmhw_{roll_no}'
        cursor.execute(insert_user_query, (user_uuid, dummy_email, created_at, created_at, True))

        # Get Bapu (Parent)
        my_bapu = bapu_map.get(roll_no, None)
        
        # Get Bachhas (Children)
        my_bachhas_list = bachhas_map.get(roll_no, [])
        my_bachhas = ",".join(my_bachhas_list) if my_bachhas_list else None

        insert_profile_query = """
        INSERT INTO profiles (
            user_id, name, email, roll_no, gender, bapu, bachhas, created_at, updated_at, visibility
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        cursor.execute(insert_profile_query, (
            user_uuid, 
            name.title(), 
            dummy_email,
            roll_no, 
            gender,
            my_bapu, 
            "{" + str(my_bachhas) + "}",  # to keep format consistent across the frontend
            created_at, 
            created_at, 
            True 
        ))

    # Commit the transaction
    conn.commit()
    print("--- Success! Data populated. ---")

except Exception as e:
    print(f"An error occurred: {e}")
    conn.rollback() # Rollback changes on error

finally:
    cursor.close()
    conn.close()