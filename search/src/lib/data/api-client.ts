import { Student } from "@/lib/types/data";
import { Timestamp } from "next/dist/server/lib/cache-handlers/types";
import { SEARCH_POINT } from "../constant";

export async function fetch_student_data(): Promise<Student[] | null> {
  const apiUrl = `${SEARCH_POINT}/api/search/`;
  try {
    const res = await fetch(apiUrl, {
      credentials: "include",
    });

    if (res.ok) {
      const data = await res.json();
      // Your original logic was commented out, let's restore it
      const student_data = data.profiles;
      if (!Array.isArray(student_data)) {
        throw new Error("Student data is not an array");
      }
      return student_data as Student[];
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
        message: (await resp.json())?.error || "An error occurred during fetch changes"
      })
      throw new Error(`Status code: ${resp.status} ${resp.statusText}`);
    }
    return resp.json();
  } catch (err) {
    console.error("Failed in fetching changelog err: ", err);
    return null;
  }
}
