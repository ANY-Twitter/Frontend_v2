"use client";
import { UserContext } from "@/app/context";
import React, { useContext, useEffect, useState } from "react";

import type { Tweet } from "@/lib/schemas";
import NewTweet from "@/_components/NewTweet";
import Tweets from "@/_components/Tweets";

export default function Home() {
  const { user } = useContext(UserContext);
  console.log("el usuario es", user);

  const [tweets, setTweets] = useState<Tweet[]>([]);
  const load_tweets = async () => {
    const tweets_response = await fetch("http://localhost:8000/obtenerTweets");
    const tweets: {
      id: string;
      data: string;
      usuario: { handle: string; name: string; pictureName: string }[];
    }[] = await tweets_response.json();

    setTweets(
      tweets.map(
        ({ id, data, usuario: [{ handle, name, pictureName }] }, index) => {
          console.log("La data es: ", data);
          console.log("El usuario es: ", name);
          console.log("El handle es: ", handle);
          console.log("La picture name es: ", pictureName);
          //const endPointImage ='';

          return { id, name, handle, data, srcImg: "" };
        }
      )
    );
  };

  useEffect(() => {
    load_tweets();
  }, []);

  return (
    <div className="overflow-auto text-black grid justify-center content-start">
      <div className="text-4xl font-bold tracking-tight text-center my-4">
        Home
      </div>
      <div className="w-[400px] ">
        <div className=" mb-[32px]">
          <NewTweet load_tweets={load_tweets} />
        </div>
        <Tweets tweets={tweets} />
      </div>
    </div>
  );
}
