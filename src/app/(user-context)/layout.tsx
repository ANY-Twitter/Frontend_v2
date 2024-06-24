"use client";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { GlobalUser, UserContext, UserContextType } from "../context";
import { getSession, useSession } from "next-auth/react";
import { UserKeys } from "@/lib/schemas";
import Loader from "@/_components/Loader";

export default function KeysLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, setUser] = useState<GlobalUser>(null);

  const userContext = useMemo(
    () => ({
      user,
      setUser: (user: GlobalUser) => setUser(user),
    }),
    [user, setUser]
  );

  return (
    <UserContext.Provider value={userContext}>{children}</UserContext.Provider>
  );
}
