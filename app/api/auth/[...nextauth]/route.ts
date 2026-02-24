import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      // 👇 THIS DICTIONARY IS WHAT WAS MISSING/WRONG 👇
      credentials: {
        password: { label: "Password", type: "password" } 
      },
      async authorize(credentials, req) {
        // 1. Grab the master password from .env, fallback to hardcoded if it fails
        const masterPassphrase = process.env.MAINFRAME_PASSWORD || "05122023"; 

        // 2. Safely grab the submitted password (which NextAuth will now allow through!)
        const submittedPassword = (credentials?.password || "").trim();

        console.log(`🚨 COMPARING: [${submittedPassword}] TO [${masterPassphrase}]`);

        // 3. The final check
        if (submittedPassword === masterPassphrase) {
          console.log("✅ ACCESS GRANTED! WELCOME BACK COMMANDER.");
          return { id: "1", name: "SysAdmin", email: "admin@loveos.com" }
        }
        
        console.log("❌ ACCESS DENIED! INTRUDER BLOCKED.");
        return null;
      }
    })
  ],
  pages: {
    signIn: '/login', // Tells NextAuth to use our custom Glass-CLI login page
  },
  session: {
    strategy: "jwt",
  },
});
export { handler as GET, handler as POST };