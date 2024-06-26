"use server";

import { z } from "zod";
import { userLoginSchema } from "./schemas";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";

export async function signInAction(loginData: z.infer<typeof userLoginSchema>) {
  try {
    await signIn("credentials", {
      ...loginData,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      const nextError = error.cause?.err as unknown as { code: string };

      // console.log("error", nextError.code);
      switch (nextError.code) {
        case "credentials":
          return "Invalid credentials.";
      }
    }
  }
}

export async function signOutAction() {
  await signOut();
}
