"use client";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { GlobalUser, UserContext, UserContextType } from "../../context";
import { getSession, useSession } from "next-auth/react";
import { UserKeys } from "@/lib/schemas";
import Loader from "@/_components/Loader";
import { User } from "next-auth";

export default function KeysLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = useSession();
  const { setUser, user } = useContext(UserContext);

  const [askPassword, setAskPassword] = useState(false);

  const [needsToImportKeys, setNeedsToImportKeys] = useState(false);

  useEffect(() => {
    if (session.status === "authenticated") {
      let currentUser: User = user?.userInfo ?? session.data.user;
      let keys: UserKeys | null = user?.keys ?? null;
      console.log("aa", user?.keys);

      if (keys === null) {
        const userKeys = localStorage.getItem(currentUser.handle);

        if (userKeys) {
          //pide la contraseña
          console.log("pide la contraseña");
        } else {
          //pide la llave del otro dispositivo
        }
      }
    }
  }, [session.status]);

  if (session.status === "loading") return <Loader width={48} height={48} />;

  return children;
}
