## Family tree data dump

- First run the script for the local db
```
# here use the 
--clean: Adds DROP commands for every object in the script.
--if-exists: Ensures that if an object doesn't exist yet, it won't throw an error during the drop phase.
# to ensure clean db formation in the server
pg_dump -U your_user -d your_db --clean --if-exists > dump.sql
```
- Move the dump file to the serve
- Dump the data in to the docker db
```
docker exec -i 17c91684846d  psql -U this_is_mjk compass < dump.sql
```