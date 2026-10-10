// Dev
// const config = {
//   searchPoint: "http://localhost:8083",
//   puppyLovePoint: "http://localhost:8084",
//   profilePoint: "http://localhost:3001/",
//   loginPoint: "http://localhost:3001/login",
//   forgotPoint: "http://localhost:3001/forgot-password",
// };

// // Test
// const config = {
//   searchPoint: "https://bsearch.pclub.in/students",
//   puppyLovePoint: "https://bsearch.pclub.in",
//   profilePoint: "https://bsearch.pclub.in",
//   loginPoint: "https://bsearch.pclub.in/login",
//   forgotPoint: "https://bsearch.pclub.in/forgot-password",
// };

const config = {
  searchPoint:
    process.env.NEXT_PUBLIC_SEARCH_SERVER?.trim() || "http://localhost:8083",
  puppyLovePoint:
    process.env.NEXT_PUBLIC_PUPPYLOVE_URL?.trim() || "http://localhost:8084",
  profilePoint:
    process.env.NEXT_PUBLIC_PROFILE_URL?.trim() || "http://localhost:3001",
  loginPoint:
    process.env.NEXT_PUBLIC_LOGIN_URL?.trim() || "http://localhost:3001/login",
  forgotPoint:
    process.env.NEXT_PUBLIC_FORGOT_PASSWORD_URL?.trim() ||
    "http://localhost:3001/forgot-password",
};

// Backend Points
export const SEARCH_POINT = config.searchPoint;
export const PUPPYLOVE_POINT = config.puppyLovePoint;

// UI Redirects
export const PROFILE_POINT = config.profilePoint;
export const LOGIN_POINT = config.loginPoint;
export const FORGOT_POINT = config.forgotPoint;

// Maps
export const MAPS_POINT =
  process.env.NEXT_PUBLIC_MAPS_DOMAIN || "http://localhost:3001";
