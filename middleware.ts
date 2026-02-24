export { default } from "next-auth/middleware";

// This determines which routes are protected. 
// It locks down the entire app EXCEPT for the login page, api routes, and static files.
export const config = {
  matcher: ["/((?!login|api|_next/static|_next/image|favicon.ico).*)"],
};