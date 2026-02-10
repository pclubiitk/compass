import { Student, Options } from "@/lib/types/data";
import { fetch_student_data, fetch_changelog } from "@/lib/data/api-client";
import { SEARCH_POINT , PUPPYLOVE_POINT} from "@/lib/constant";
import {
  get_time_IDB,
  update_IDB,
  check_IDB,
  apply_Changelog,
  delete_IDB,
} from "@/lib/data/indexeddb-manager";
import { prepare_worker } from "@/lib/workers/prepare_worker";
import { check_bacchas, check_query } from "@/lib/data/query-processor";

let students: Student[] = [];
let new_students: Student[] | undefined = undefined;

// In-memory cache for PuppyLove data with 30-minute expiry
// Using in-memory instead of localStorage because Web Workers don't have access to localStorage
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes
let puppyLoveCache: { data: any; expiry: number } | null = null;

function setPuppyLoveCache(data: any): void {
  const now = new Date();
  puppyLoveCache = {
    data: data,
    expiry: now.getTime() + CACHE_EXPIRY_MS,
  };
}

function getPuppyLoveCache(): any | null {
  if (!puppyLoveCache) return null;

  const now = new Date();

  // Check if cache has expired
  if (now.getTime() > puppyLoveCache.expiry) {
    puppyLoveCache = null;
    return null;
  }

  return puppyLoveCache.data;
}

//setting up the values for the fields in the Options component
const options: Options = {
  batch: [],
  hall: [],
  course: [],
  dept: [],
};

self.onmessage = async (event: MessageEvent) => {
  const { command, payload } = event.data;

  switch (command) {
    case "initialize":

      await initializeData();
      break;
    case "query":
      self.postMessage({
        status: "query_results",
        results: check_query(payload, students),
      });
      break;
    case "get_team": {
      const rollNos: string[] = payload.map(String); 
      const teamResults: Student[] = [];
      rollNos.map((rollNo) => {
        const found = check_query({ batch: [], hall: [], course: [], dept: [], name: rollNo, gender: "", address: "" }, students);
        teamResults.push(...found);
      });
      self.postMessage({
        status: "team_results",
        results: teamResults,
      });
      break;
    }

    case "get_family_tree":
      const student: Student = payload;
      const baapu = students.filter(
        (st: Student) => st.rollNo === student.bapu,
      )[0]; //note that this can also be undefined - this will be handled by TreeCard
      const bacchas = check_bacchas(student.bachhas, students);
      self.postMessage({
        status: "family_tree_results",
        results: [baapu, student, bacchas],
      });
      break;
    case "delete":
      delete_IDB();
      break;
    default:
      self.postMessage({
        status: "error",
        message: `Worker received an unknown command: ${command}`,
      });
      break;
  }
};

async function mergePuppyLoveData(): Promise<void> {
  try {
    let puppyLoveData = getPuppyLoveCache();

    if (!puppyLoveData) {
      console.log("[PuppyLove] Cache miss, fetching from API...");
      const puppyLoveRes = await fetch(`${PUPPYLOVE_POINT}/api/puppylove/users/alluserInfo`, {
        credentials: "include",
      });

      console.log(`[PuppyLove] Response status: ${puppyLoveRes.status}`);
      
      if (!puppyLoveRes.ok) {
        console.error(`[PuppyLove] API returned ${puppyLoveRes.status}: ${puppyLoveRes.statusText}`);
        return;
      }

      puppyLoveData = await puppyLoveRes.json();
      console.log("[PuppyLove] Data fetched successfully, caching...");
      setPuppyLoveCache(puppyLoveData);
    } else {
      console.log("[PuppyLove] Using cached data");
    }

    const aboutMap = puppyLoveData.about || {};
    const interestsMap = puppyLoveData.interests || {};
    
    console.log(`[PuppyLove] Merging data for ${Object.keys(aboutMap).length} users`);

    students = students.map((profile: Student) => {
      const about = aboutMap[profile.rollNo];
      const interest = interestsMap[profile.rollNo];
      
      if (about || interest) {
        return {
          ...profile,
          about: about,
          interest: interest,
        };
      }
      return profile;
    });
    
    // Save merged data to IndexedDB cache
    await update_IDB({
      profiles: students,
      requestTime: Date.now(),
    });
    
    // Re-prepare worker with merged data
    console.log("[PuppyLove] Merge complete, worker prepared");
    prepare_worker(students, options);
  } catch (err) {
    console.error("[PuppyLove] Error during merge:", err);
  }
}

async function initializeData(): Promise<void> {
  let noLastTimeStamp = false;
  let cantGetData = false;
  let time: number = 0;
  try {
    time = await get_time_IDB();
  } catch (error) {
    console.error("Failed to find last timestamp");
    noLastTimeStamp = true;
  }
  if (noLastTimeStamp || Date.now() - time > 1000 * 60 * 60 * 24 * 30) {
    try {
      // console.log("Fetching data from API...");
      const res = await fetch_student_data();
      if (res === null) {
        throw new Error("Failed to fetch student data from DB");
      }
      // console.log("Updating local DB with API data...");
      new_students = res.profiles as Student[];
      await update_IDB(res);
    } catch (error) {
      console.error(error);
      cantGetData = true;
    }
    if (new_students !== undefined) {
      // console.log("New data was fetched, so re-preparing worker...");
      students = new_students;
    } else {
      // console.log("Failed to fetch new data, so worker was not re-prepared.");
    }
  } else {
    try {
      // console.log("Fetching changelog from API...");
      const res = await fetch_changelog(time);
      if (res === null) {
        // Error occurred, console is in the child function
        return;
      }
      // Update the db completely if server restarts
      if (res.dropData) {
        update_IDB(res);
      }
      students = await apply_Changelog(res);
    } catch (err) {
      cantGetData = true;
      students = await check_IDB();
      console.error("Failed fetching changelog: ", err);
    }
  }
  if (noLastTimeStamp && cantGetData) {
    postMessage({
      status: "error",
      message:
        "Could not find data locally or fetch it. This web app will not work.",
    });
  } else {
    // First merge PuppyLove data, THEN prepare worker with merged data
    await mergePuppyLoveData();
  }
}
