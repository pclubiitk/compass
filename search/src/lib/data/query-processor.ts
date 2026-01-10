import { Student, Query } from "@/lib/types/data";
import Fuse from "fuse.js";

type StudentKey = "gender" | "name" | "hall" | "course" | "dept" | "homeTown";

function rollToYear(roll: string): string {
  // Take a student's roll number, and output the batch they were in.
  // The logic will only work till Y29 :(
  if (roll[0] === "Y" && roll[1] > "7") {
    return roll.slice(0, 2);
  } else if (roll.slice(0, 2) < "30") {
    return "Y" + roll.slice(0, 2);
  } else return "Other";
}

function check_bacchas(
  bacchas: string | string[],
  students: Student[]
): Student[] {
  if (bacchas === "Not Available" || bacchas === "") {
    return [];
  } else if (typeof bacchas === "string") {
    // For Example {230228, 230469, 230518, 230583, 230873}
    // 1. Remove the brackets from the string
    // 2. Split at commas, return students props with that
    // TODO: Maybe we can directly search across the index db
    const bacchasArray = bacchas.slice(1, bacchas.length - 1).split(",");
    return students.filter((student) => bacchasArray.includes(student.rollNo));
  } else return [];
}

function check_query(query: Query, students: Student[]): Student[] {
  // Goes through the array of students and selects only those that match the query given.
  // Filtering first on the basis of name (Fuzzy Search)

  let filtered_student = students; // Currently unfiltered

  // Applying fuzzy search on the basis of name
  if (query.name) {
    const fuse = new Fuse(students, {
      keys: ["name"],
      threshold: 0.2, // Can change to fine tune later
    });
    filtered_student = fuse.search(query.name).map((res) => res.item);
    // Above only checked fuzziness on name, but user might have entered the roll no.
    // which wont be in fuzzy of name, so adding the roll no. and username

    const lowercased_name = query.name.toLowerCase();
    filtered_student = filtered_student.concat(
      students.filter(
        (s) =>
          s.rollNo.toLowerCase().includes(lowercased_name) || // Roll number
          s.email.toLowerCase().startsWith(lowercased_name) // Username
      )
    );
    // Above snippet checks if the students include roll no.
    // or starts with username, if so add it to the filtered array

    // Removing duplicates by creating a set and then back to array
    filtered_student = Array.from(new Set(filtered_student));
  }
  filtered_student = filtered_student.filter((student: Student) => {
    let key: keyof Query;
    let entry = false;
    for (key in query) {
      // The idea here is that if a student DOESN'T satisfy a certain part of the query,
      // we immediately discard them using "return false", at the end, we have a "return true"
      // so any records that make it to the end of the "gauntlet" are added to the final list.
      if (query[key].length == 0) {
        // Skip any fields that don't have anything in them
        continue;
      }
      // If query is not totally empty, entry is set to true
      entry = true;
      if (key === "batch") {
        // Special processing for the "batch" / "year" field
        if (!query.batch.includes(rollToYear(student.rollNo))) {
          return false;
        }
      } else if (key === "gender") {
        const student_data = student.gender.toLowerCase();
        const query_data = query.gender.toLowerCase();
        if (!(student_data === query_data)) {
          return false;
        }
      } else if (key === "address") {
        if (
          !student.homeTown.toLowerCase().includes(query.address.toLowerCase())
        )
          return false;
      } else if (key !== "name") {
        // Other stuff, excluding name
        if (!query[key].includes(student[key])) return false;
        // Note that this allows query[key] to be an array - so,
        // if e.g. query is just {UserID:[1, 2, 3]} it will return the students with roll numbers 1, 2 and 3
        // this helps with finding bacchas note that because typescript is such a stickler for everything,
        // the above trick is no longer possible without making changes. >:/
      }
    }
    return entry; //if query is totally empty, this will be false - otherwise it will be true
  });

  // If the name, roll number or username is provided, we do not sort,
  // else we will sort and return the results
  if (query.name) {
    return filtered_student;
  } else {
    return filtered_student.sort((a: Student, b: Student) => {
      try {
        return Number(a.rollNo) > Number(b.rollNo) ? 1 : -1;
      } catch (err) {
        return a.rollNo > b.rollNo ? 1 : -1;
      }
    });
  }
}

export { rollToYear, check_bacchas, check_query, type StudentKey };
