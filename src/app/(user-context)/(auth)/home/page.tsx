"use client";
import { UserContext } from "@/app/context";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/auth-utils";
import { useSession } from "next-auth/react";
import React, { useContext, useEffect } from "react";

export default function Home() {
  const { user } = useContext(UserContext);
  console.log("el usuario es", user);

  return (
    <div>
      home<Button onClick={() => signOutAction()}>Cerrar session</Button>
    </div>
  );
}
