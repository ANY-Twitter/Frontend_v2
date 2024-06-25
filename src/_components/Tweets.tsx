import { Tweet } from "@/lib/schemas";
import TweetUI from "./Tweet";

export default function Tweets({
  tweets,
  areMessages,
}: Readonly<{ tweets: Tweet[]; areMessages?: boolean }>) {
  return (
    <div className="mb-5">
      <div className="grid gap-y-[20px] place-items-center">
        {tweets.map((mess) => {
          return (
            mess && (
              <TweetUI
                key={mess.id}
                {...mess}
                isMessage={areMessages ?? false}
              />
            )
          );
        })}
      </div>
      {/* <div className="change-tweets">
        <Link className="button">Anterior</Link>
        <Link className="button">Siguiente</Link>
      </div> */}
    </div>
  );
}
