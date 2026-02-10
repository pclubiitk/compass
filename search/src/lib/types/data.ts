//common types

export interface Student {
  UserID: string; // uuid.UUID
  homeTown: string; //address
  dept: string; //department
  gender: string; //gender
  hall: string; //hall of residence
  rollNo: string; //roll number
  name: string; //full name
  course: string; //programme
  roomNo: string; //room number
  email: string; //username
  bapu: string; //roll number of baapu/amma
  bachhas: string; //array containing roll numbers of bacchas (or the words "not available")
}

export interface Query {
  gender: string;
  name: string;
  batch: Array<string>;
  hall: Array<string>;
  course: Array<string>;
  dept: Array<string>;
  address: string;
}

export interface Options {
  // Type declaration
  batch: Array<string>;
  hall: Array<string>;
  course: Array<string>;
  dept: Array<string>;
}
