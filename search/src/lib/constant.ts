// Dev
const config = {
  searchPoint: "http://localhost:8083",
  puppyLovePoint: "http://localhost:8084",
  profilePoint: "http://localhost:3001/",
  loginPoint: "http://localhost:3001/login",
  forgotPoint: "http://localhost:3001/forgot-password",
};

// // Test
// const config = {
//   searchPoint: "https://bsearch.pclub.in/students/",
//   puppyLovePoint: "https://bsearch.pclub.in",
//   profilePoint: "https://bsearch.pclub.in",
//   loginPoint: "https://bsearch.pclub.in/login",
//   forgotPoint: "https://bsearch.pclub.in/forgot-password",
// };

// // Prod
// const config = {
//   searchPoint: "https://search.pclub.in/students/",
//   puppyLovePoint: "https://search.pclub.in",
//   profilePoint: "https://search.pclub.in",
//   loginPoint: "https://search.pclub.in/login",
//   forgotPoint: "https://search.pclub.in/forgot-password",
// };

// Backend Points
export const SEARCH_POINT = config.searchPoint;
export const PUPPYLOVE_POINT = config.puppyLovePoint;

// UI Redirects
export const PROFILE_POINT = config.profilePoint;
export const LOGIN_POINT = config.loginPoint;
export const FORGOT_POINT = config.forgotPoint;
