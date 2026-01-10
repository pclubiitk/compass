import { Student, Options } from "@/lib/types/data";
import { rollToYear } from "@/lib/data/query-processor";

function prepare_worker(students: Student[], options: Options): void {
  // Student data should be in a global variable called "students",
  // and there should be a global variable "options" to take the list
  // of options for everything

  // After filling the "options" variable, send "Worker ready" message
  // and set up onmessage handler

  for (const st of students) {
    for (const key in options) {
      const optionKey = key as keyof Options;
      if (optionKey === "batch") {
        const year = rollToYear(st.rollNo);
        if (!options.batch.includes(year)) {
          options.batch.push(year);
        }
      } else {
        const key = optionKey as "hall" | "course" | "dept";
        if (!options[optionKey].includes(st[key])) {
          options[optionKey].push(st[key]);
        }
      }
    }
  }

  for (const key in options) {
    const optionKey = key as keyof Options;
    options[optionKey].sort();
  }

  // console.log("Worker ready");
  postMessage({ status: "ready", options: options }); //when worker processes everything it should send out options headers again
}

export { prepare_worker };
