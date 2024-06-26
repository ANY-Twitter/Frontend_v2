import { FormEvent, useContext, useState } from "react";
import { UserContext } from "@/app/context";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField } from "@/components/ui/form";
import { apiURL } from "@/lib/api-calls";

const newTweetSchema = z.object({
  data: z.string(),
});

export default function NewTweet({
  load_tweets,
}: Readonly<{
  load_tweets: () => Promise<void>;
}>) {
  const { user } = useContext(UserContext);

  const form = useForm<z.infer<typeof newTweetSchema>>({
    resolver: zodResolver(newTweetSchema),
    defaultValues: { data: "" },
  });

  const submit = async ({ data }: { data: string }) => {
    const response = await fetch(apiURL + "/tweet", {
      method: "POST",
      body: JSON.stringify({
        data,
        handle: user?.userInfo.handle,
        date: new Date().toISOString(),
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    form.reset();

    load_tweets();
  };

  return (
    <Card>
      <CardContent className="grid grid-cols-[fit-content(80px)_1fr] gap-x-[20px] pt-[12px]">
        <div className="user-photo">
          <Image
            src={
              user?.userInfo.srcProfilePicture &&
              user?.userInfo.srcProfilePicture !== ""
                ? user?.userInfo.srcProfilePicture
                : "/default.jpg"
            }
            alt="imagen perfil"
            width={48}
            height={48}
            className="rounded-full w-[48px] h-[48px]"
          />
        </div>
        <Form {...form}>
          <form
            className="grid justify-items-end grid-rows-[280px_1fr] gap-y-[15px]"
            noValidate
            onSubmit={form.handleSubmit(submit)}
          >
            <FormField
              name="data"
              control={form.control}
              render={({ field }) => {
                return (
                  <Textarea
                    cols={30}
                    rows={10}
                    className="resize-none w-[280px] h-[250px] p-[10px] "
                    {...field}
                  />
                );
              }}
            />
            <Button>Crear</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
