// TODO: Update these functions along with more simplified implementation
import { Student } from "@/lib/types/data";
import { Timestamp } from "next/dist/server/lib/cache-handlers/types";

// Holds the reference to the IndexedDB storing student data locally
let db: IDBDatabase | undefined = undefined;

// If the promise resolves, the global variable 'db' contains a reference to the database,
// otherwise its undefined, (earlier it was empty string for some reason).

async function start_IDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    db = undefined;
    try {
      const openRequest = indexedDB.open("students", 3);
      openRequest.addEventListener(
        "error",
        () => {
          reject("Failed to access local database.");
        },
        { once: true }
      );
      openRequest.addEventListener(
        "success",
        () => {
          db = openRequest.result;
          resolve();
        },
        { once: true }
      );
      openRequest.addEventListener(
        "upgradeneeded",
        (event) => {
          const target = event.target as IDBOpenDBRequest;
          db = target.result;
          // TODO: Need to figure out what they were doing here.
          //delete the previous db because I am a bad programmer and I am using upgradeneeded to fix issues
          //try/catch so that if it isn't there, it doesn't stop the whole thing
          try {
            db!.deleteObjectStore("students");
            // console.log("Deleted old table");
          } catch (err) {
            console.error(
              "Error in deleting students db on version change",
              err
            );
          }
          //set up the DB, and if nothing goes wrong (i.e. no errors) then resolve successfully
          const objStore = db!.createObjectStore("students", {
            keyPath: "key",
            autoIncrement: false,
          });
          objStore.createIndex("students", "students", { unique: false }); //this will hold the array/json string of the response
          //should trigger success event handler now, so we don't resolve the promise here
        },
        { once: true }
      );
    } catch (error) {
      reject(error);
    }
  });
}

async function get_time_IDB(): Promise<number> {
  //gets the last time data was added to the IDB (stored right after the actual array)
  //same caveats as for update_ and check_IDB
  //returns 0 on error so that any updates definitely go through

  return new Promise(async (resolve, reject) => {
    try {
      await start_IDB();
      if (!db) {
        resolve(0);
        return;
      }
      const req = db
        .transaction(["students"], "readonly")
        .objectStore("students")
        .get(2);
      req.onerror = (e) => {
        resolve(0);
      };
      req.onsuccess = (e) => {
        if (!req.result) {
          resolve(0);
          return;
        }
        resolve(req.result.time);
      };
    } catch (error) {
      resolve(0);
    }
  });
}

//both of these assume that 'db' has the reference to the IndexedDB after 'start_IDB()' finishes - otherwise, will throw errors
async function update_IDB(students: Student[]): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      await start_IDB();
      if (!db) {
        reject("Database not available");
        return;
      }

      //first: delete all records (there will be 2: students and time)
      //then, we store parameter students and Date.now() into the DB
      //this should all happen in one transaction so that if trxn fails, we don't end up with an empty DB or two items
      const trxn = db.transaction(["students"], "readwrite");
      trxn.objectStore("students").openCursor().onsuccess = (event) => {
        const target = event.target as IDBRequest;
        const cursor = target.result;
        if (cursor) {
          trxn.objectStore("students").delete(cursor.value.key);
          cursor.continue(); //move onto next item
        } else {
          //no more entries left, so store data now
          trxn.objectStore("students").add({ students: students, key: 1 });
          //add update time for future reference
          trxn.objectStore("students").add({ time: Date.now(), key: 2 });
        }
      };
      trxn.oncomplete = () => {
        // console.log("Student data successfully saved locally.");
        resolve();
      };
      trxn.onerror = (error) => {
        reject(error);
      };
    } catch (error) {
      reject(error);
    }
  });
}

async function check_IDB(): Promise<Student[]> {
  return new Promise(async (resolve, reject) => {
    try {
      await start_IDB();
      if (!db) {
        reject("Database not available");
        return;
      }
      //just get by key
      const req = db
        .transaction(["students"], "readonly")
        .objectStore("students")
        .get(1);
      req.onerror = (e) => {
        reject(e);
      };
      req.onsuccess = () => {
        if (!req.result) {
          reject("No IDB entry");
          return;
        }
        if (!Array.isArray(req.result.students)) {
          reject("IDB entry is improper");
          return;
        }

        resolve(req.result.students as Student[]);
      };
    } catch (error) {
      reject(error);
    }
  });
}

async function apply_Changelog(resp: {
  addProfiles: Student[];
  deleteUserId: string[];
  requestTime: Timestamp;
}): Promise<Student[]> {
  return new Promise(async (resolve, reject) => {
    try {
      let current: Student[];
      await start_IDB();
      if (!db) {
        reject("Database not available");
        return;
      }
      const trxn = db.transaction(["students"], "readwrite");
      const store = trxn.objectStore("students");

      trxn.oncomplete = () => {
        // console.log("Changelog applied successfully.");
        resolve(current);
      };
      trxn.onerror = () => {
        console.error("Transaction error:", trxn.error);
        reject(trxn.error);
      };

      // Get existing student data object
      const getRequest = store.get(1);

      getRequest.onsuccess = () => {
        // Initialize with existing students, or an empty array if none exist
        current = getRequest.result?.students || [];

        // Modify the data in memory
        // Add or update profiles
        for (const st of resp.addProfiles) {
          const idx = current.findIndex((s: Student) => s.UserID === st.UserID);
          if (idx >= 0) {
            current[idx] = st; // Update existing
          } else {
            current.push(st); // Add new
          }
        }

        // Delete profiles
        const deleteSet = new Set(resp.deleteUserId); // Use a Set for faster lookups
        current = current.filter((s: Student) => !deleteSet.has(s.UserID));

        // Write modified data back to the database
        // .put() to overwrite existing entry
        store.put({ students: current, key: 1 });
        store.put({
          time: new Date(resp.requestTime).getTime(),
          key: 2,
        });
      };
    } catch (error) {
      reject(error);
    }
  });
}

function delete_IDB() {
  const DBDeleteRequest = indexedDB.deleteDatabase("students");
  DBDeleteRequest.onerror = () => {
    self.postMessage({
      status: "delete",
      message: "Successfully deleted local data",
    });
  };

  DBDeleteRequest.onsuccess = () => {
    self.postMessage({
      status: "delete",
      message: "unable to delete local data",
    });
  };
}

export {
  start_IDB,
  get_time_IDB,
  update_IDB,
  delete_IDB,
  check_IDB,
  apply_Changelog,
};
