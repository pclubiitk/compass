// export const SEARCH_POINT = "http://localhost:8083";
// export const PROFILE_POINT = "http://localhost:3001/profile";
// export const LOGIN_POINT = "http://localhost:3001/login";
// export const FORGOT_POINT = "http://localhost:3001/forgot-password";
// export const PUPPYLOVE_POINT = "http://localhost:8084";


// // FIXME(prod): In Production
// export const SEARCH_POINT = "https://search.pclub.in";
// export const PROFILE_POINT = "https://auth.pclub.in/profile";
// export const LOGIN_POINT = "https://auth.pclub.in/login";
// export const FORGOT_POINT = "https://auth.pclub.in/forgot-password";
// export const PUPPYLOVE_POINT = "";

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

export const FORGOT_POINT = isDev 
    ? "http://localhost:3001/forgot-password" // Dev
    : "https://auth.pclub.in/forgot-password"; // Prod

export const PUPPYLOVE_POINT = isDev
    ? "http://localhost:8084"
    : "";

