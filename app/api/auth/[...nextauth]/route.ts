// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';

// Use the SERVICE ROLE key here — this runs server-side only, never exposed to client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // NOT the anon key
);

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        // Fetch user by username from Supabase
        const { data: user, error } = await supabaseAdmin
          .from('portal_users')
          .select('*')
          .eq('username', credentials.username.toLowerCase().trim())
          .single();

        if (error || !user) return null;

        // Compare against bcrypt hash — plaintext password never stored
        const valid = await bcrypt.compare(credentials.password, user.password_hash);
        if (!valid) return null;

        return {
          id:           user.id,
          name:         user.display_name,
          role:         user.role,
          avatarEmoji:  user.avatar_emoji,
          accentColor:  user.accent_color,
        };
      },
    }),
  ],

  callbacks: {
    // Persist extra fields into the JWT
    async jwt({ token, user }) {
      if (user) {
        token.id          = user.id;
        token.role        = (user as any).role;
        token.avatarEmoji = (user as any).avatarEmoji;
        token.accentColor = (user as any).accentColor;
      }
      return token;
    },
    // Expose them on the session object the client sees
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id          = token.id;
        (session.user as any).role        = token.role;
        (session.user as any).avatarEmoji = token.avatarEmoji;
        (session.user as any).accentColor = token.accentColor;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
  },

  session: {
    strategy: 'jwt',
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };