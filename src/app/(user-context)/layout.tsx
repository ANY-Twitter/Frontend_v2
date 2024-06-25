"use client";
import React, { useMemo, useState } from "react";
import { GlobalUser, UserContext } from "../context";

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
