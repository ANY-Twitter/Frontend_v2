"use client";
import React, { useContext, useEffect, useState } from "react";
import Tweets from "@/_components/Tweets";
import { UserContext } from "@/app/context";
import { CipherMessage, KeysList, PublicKeys, Tweet } from "@/lib/schemas";
import { findUser } from "@/lib/utils";
import { decrypt, hexToBytes, verifyFirm } from "@/lib/crypto";

export default function Messages() {
  const { user } = useContext(UserContext);
  const [tweets, setTweets] = useState<Tweet[]>([]);

  useEffect(() => {
    const getTwets = async () => {
      if (!user?.keys) {
        return;
      }

      const keys = user.keys;
      const finalTweets: Tweet[] = [];
      const messages_resp = await fetch(
        "http://localhost:8000/obtenerMensajes"
      );
      const keysResp = await fetch("http://127.0.0.1:8000/getKeysList", {
        method: "GET",
      });
      const allUsers = (await keysResp.json()) as KeysList;
      const messages = (await messages_resp.json()) as CipherMessage[];

      let currentLocalKeys: { [handle: string]: PublicKeys } = {};

      const savedKeysRaw = localStorage.getItem("savedKeys");

      if (savedKeysRaw) currentLocalKeys = JSON.parse(savedKeysRaw);

      for (const {
        message: message_,
        signedHash: signedHash_,
        id,
      } of messages) {
        const signedHash = hexToBytes(signedHash_);
        const message = hexToBytes(message_);

        const final_message = await decrypt(keys, message);

        if (final_message) {
          // const githubUrl = `https://api.github.com/repos/${final_message.handle}/anytwitter/contents/public.json`;
          const userFrom = findUser(allUsers, final_message.handle);
          let keys: PublicKeys;

          if (!userFrom) {
            return undefined;
          }

          if (currentLocalKeys[final_message.handle]) {
            keys = currentLocalKeys[final_message.handle];
            console.log("cached");
          } else {
            const githubUrl = `https://raw.githubusercontent.com/${final_message.handle}/anytwitter/main/public.json`;
            // const githubUrl = `https://api.github.com/repos/${final_message.handle}/anytwitter/contents/public.json`;

            const respKeys = JSON.parse(userFrom.keys);

            const verifier = await fetch(githubUrl, {
              headers: {},
              cache: "no-store",
            });
            // const verifierKeys = JSON.parse(window.atob((await verifier.json()).content));
            const verifierKeys = await verifier.json();

            if (
              verifier.status === 404 ||
              JSON.stringify(verifierKeys) !== JSON.stringify(respKeys)
            ) {
              console.log("Failed user");
              return undefined;
            }

            keys = respKeys;
          }

          const isValid = await verifyFirm(
            final_message.pt,
            signedHash,
            keys.sign
          );

          if (isValid) {
            // console.log("este se desencripta", final_message);
            // console.log("este se desencripta", userFrom);
            finalTweets.push({
              id,
              name: userFrom.name,
              handle: userFrom.handle,
              data: final_message.pt,
              srcImg: "",
            });
          }
        }
      }

      setTweets(finalTweets);
    };

    getTwets();
  }, [user?.keys]);

  return (
    <div className="text-black overflow-auto  grid justify-center content-start">
      <h2 className="text-2xl font-bold tracking-tight text-center my-5">
        Messages
      </h2>
      <div className="w-[400px]">
        <Tweets tweets={tweets} />
      </div>
    </div>
  );
}
