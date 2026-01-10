import { Student, Options } from "@/lib/types/data";
import { fetch_student_data, fetch_changelog } from "@/lib/data/api-client";
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
    case "get_family_tree":
      const student: Student = payload;
      const baapu = students.filter(
        (st: Student) => st.rollNo === student.bapu
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
      } else new_students = res;
      // console.log("Updating local DB with API data...");
      await update_IDB(new_students);
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
    prepare_worker(students, options);
  }
}
