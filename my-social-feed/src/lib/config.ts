export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Where server-side code (route handlers) reaches the API. NEXT_PUBLIC_API_URL
// is baked into the browser bundle and is right from the browser's side only:
// inside the frontend container, localhost:5000 is the container itself. Read
// at runtime, so compose can point it at the backend service directly.
export const SERVER_API_URL = process.env.API_INTERNAL_URL || API_URL;

export const DEFAULT_AVATAR = "https://ui-avatars.com/api/?name=User";
