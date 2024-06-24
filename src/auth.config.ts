import type { DefaultSession, NextAuthConfig } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      handle: string;
      srcProfilePicture: string;
    } & DefaultSession["user"];
  }

  interface DefaultUser {
    handle: string;
    srcProfilePicture: string;
  }
  interface User {
    handle: string;
    srcProfilePicture: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    handle: string;
    srcProfilePicture: string;
    sessionToken: string;
  }

  interface User {
    handle: string;
    srcProfilePicture: string;
    sessionToken?: string;
  }
}

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    session: ({ session, token }) => {
      session.user.handle = token.handle;
      session.user.srcProfilePicture = token.srcProfilePicture;

      return session;
    },
    jwt: ({ token, user }) => {
      if (user) {
        token.handle = user.handle;
        token.srcProfilePicture = user.srcProfilePicture;

        // console.log("new token", token);
      }
      return token;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;

      const pathname = nextUrl.pathname;
      // console.log(pathname, auth);
      if (!isLoggedIn && nextUrl.pathname.startsWith("/signup")) return true;
      else if (
        isLoggedIn &&
        (pathname === "/login" || pathname === "/" || pathname === "/signup")
      ) {
        return Response.redirect(new URL("/home", nextUrl));
      } else if (isLoggedIn) {
        return true;
      }

      return false;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
