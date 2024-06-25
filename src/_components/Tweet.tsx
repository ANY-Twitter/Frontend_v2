import { Card, CardContent } from "@/components/ui/card";

interface TweetProps {
  name: string;
  handle: string;
  data: string;
  srcImg: string;
  isMessage?: boolean;
}

export default function Tweet({
  name,
  handle,
  data,
  srcImg,
  isMessage,
}: Readonly<TweetProps>) {
  return (
    <Card className=" w-full pt-[12px]">
      <CardContent className="grid grid-cols-[fit-content(80px)_1fr] gap-x-[20px]">
        <div></div>
        <div className="grid">
          <div className="grid gap-x-[2px] grid-cols-[repeat(2,fit-content(100px))] whitespace-nowrap">
            <div className="name">{name}</div>
            <div className="handle">@{handle}</div>
          </div>
          <div className="break-words overflow-hidden">{data}</div>
          {isMessage && <></>}
        </div>
      </CardContent>
    </Card>
  );
}
