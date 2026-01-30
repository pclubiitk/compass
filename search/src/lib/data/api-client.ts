import { Student } from "@/lib/types/data";
import { Timestamp } from "next/dist/server/lib/cache-handlers/types";
import { SEARCH_POINT } from "../constant";

export async function fetch_student_data() {
  const apiUrl = `${SEARCH_POINT}/api/search/`;
  try {
    const res = await fetch(apiUrl, {
      credentials: "include",
    });

    if (res.ok) {
      return await res.json();
    } else {
      postMessage({
        status: "error",
        message: "An error occurred during fetch.",
      });
      throw new Error(`Server responded with status ${res.status}`);
    }
  } catch (err) {
    postMessage({
      status: "error",
      message: "An error occurred during fetch.",
    });
    return null; // Return null if error
  }
}

export async function fetch_changelog(lastTime: Timestamp) {
  try {
    const resp = await fetch(`${SEARCH_POINT}/api/search/changeLog`, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        lastUpdateTime: new Date(lastTime).toISOString(),
      }),
    });
    if (!resp.ok) {
      postMessage({
        status: "error",
        message:
          (await resp.json())?.error ||
          "An error occurred during fetch changes",
      });
      throw new Error(`Status code: ${resp.status} ${resp.statusText}`);
    }
    return await resp.json();
  } catch (err) {
    console.error("Failed in fetching changelog err: ", err);
    return null;
  }
}
