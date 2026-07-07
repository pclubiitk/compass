const isDev = process.env.NODE_ENV === 'development';

export const SEARCH_POINT = isDev 
    ? "http://localhost:8083" // Dev
    : "https://search.pclub.in";  // Prod

export const PROFILE_POINT = isDev 
    ? "http://localhost:3001/profile" // Dev
    : "https://auth.pclub.in/profile"; // Prod

export const LOGIN_POINT = isDev 
    ? "http://localhost:3001/login" // Dev
    : "https://auth.pclub.in/login"; // Prod