import { Student } from "@/lib/types/data";

export function mergeStudentChangelog(
  current: Student[],
  addProfiles: Student[],
  deleteCacheIds: string[],
): Student[] {
  const merged = [...current];

  for (const student of addProfiles) {
    const index = merged.findIndex((entry) => entry.userId === student.userId);
    if (index >= 0) {
      merged[index] = student;
    } else {
      merged.push(student);
    }
  }

  const deleted = new Set(deleteCacheIds);
  return merged.filter((student) => !deleted.has(student.cacheId));
}
