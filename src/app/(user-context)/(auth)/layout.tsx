"use client";
import React, { useContext, useEffect, useMemo, useState } from "react";
import defaultImg from "@/public/images/default.jpg";
import { GlobalUser, UserContext, UserContextType } from "../../context";
import { getSession, useSession } from "next-auth/react";
import { UserKeys } from "@/lib/schemas";
import Loader from "@/_components/Loader";
import { User } from "next-auth";
import InsertPassDialog from "@/_components/InsertPassDialog";
import { signOutAction } from "@/lib/auth-utils";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function KeysLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = useSession();
  const { setUser, user } = useContext(UserContext);

  const [askPassword, setAskPassword] = useState(false);

  useEffect(() => {
    if (session.status === "authenticated") {
      let currentUser: User = user?.userInfo ?? session.data.user;
      let keys: UserKeys | null = user?.keys ?? null;

      setUser({
        ...(user ?? { keys }),
        userInfo: currentUser,
      });

      if (keys === null) {
        const userKeys = localStorage.getItem(currentUser.handle);

        if (userKeys) {
          //pide la contraseña
          setAskPassword(true);
        } else {
          signOutAction();
        }
      }
    }
  }, [session.status]);

  if (session.status === "loading") return <Loader width={48} height={48} />;

  return (
    <div className="grid grid-cols-[300px_1fr] h-screen w-screen text-white">
      <InsertPassDialog
        showInsertPassDialog={askPassword}
        setShowInsertPassDialog={setAskPassword}
      />
      <div className=" bg-[#22d3ee] grid grid-rows-[50px_100px_1fr_120px]">
        <div className="grid place-content-center">
          <Link href="/home" className="block text-xl font-bold">
            Home
          </Link>
        </div>
        <div className="grid grid-cols-[40%_1fr] items-center justify-items-center">
          {/* <img src={user.srcProfilePicture === '' ? default_photo : user.srcProfilePicture} alt="" /> */}
          <Image
            src={"/default.jpg"}
            alt="profile picture"
            width={78}
            height={78}
            className="rounded-full"
          />
          <div>
            <div>{user?.userInfo.name}</div>
            <div className="font-bold text-center">
              @{user?.userInfo.handle}
            </div>
          </div>
        </div>

        <div className="groups"></div>
        <div className="grid gap-y-[5px]">
          <div className="grid justify-center items-center gap-x-[12px] grid-cols-[auto_auto]">
            <Button className="py-[5px] px-[10px]">
              <Link className="button" href="messages">
                Ver Buzón
              </Link>
            </Button>
            <Button className="py-[5px] px-[10px]">
              <Link className="button" href="send-message">
                Enviar mensaje
              </Link>
            </Button>
          </div>
          <div className="grid place-content-center">
            <Button className="py-[5px] px-[10px]">
              <Link className="button" href="config">
                Configuraciones
              </Link>
            </Button>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
