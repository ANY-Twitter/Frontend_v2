"use client";
import { useSession } from "next-auth/react";
import React, { useEffect } from "react";

export default function Home() {
  const session = useSession();

  useEffect(() => {
    if (session.status === "authenticated") {
      console.log("authenticated");
    }
  }, [session.status, session.data]);

  return <div>home</div>;
}
