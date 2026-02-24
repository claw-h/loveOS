import { withAuth } from "next-auth/middleware";

// Explicitly export the middleware function Next.js expects
export default withAuth({
  pages: {
    signIn: "/login", // Tells NextAuth to route unauthenticated users here
  },
});

export const config = {
  matcher: [
    /*
     * Protects all routes EXCEPT:
     * - api routes
     * - static files & images
     * - favicon
     * - the login page itself
     */
    "/((?!api|_next/static|_next/image|favicon.ico|login).*)",
  ],
};