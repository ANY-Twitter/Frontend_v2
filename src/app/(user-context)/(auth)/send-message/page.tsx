"use client";
import { useContext, useState } from "react";
import { maxSize, cipher, toHexString } from "@/lib/crypto";
import { UserContext } from "@/app/context";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

import { KeysList, PublicKeys } from "@/lib/schemas";
import { toast } from "@/components/ui/use-toast";
import { DialogDescription } from "@radix-ui/react-dialog";
import { findUser } from "@/lib/utils";
import { apiURL } from "@/lib/api-calls";

const sendMessageSchema = z.object({
  message: z
    .string()
    .min(1, "El mensaje no puede estar vacío")
    .max(maxSize(), "El mensaje es muy largo"),
  handleTo: z.string().min(1, "El usuario no puede estar vacío"),
});

function SendMessage() {
  const { user } = useContext(UserContext);

  const sendMessageForm = useForm<z.infer<typeof sendMessageSchema>>({
    resolver: zodResolver(sendMessageSchema),
    defaultValues: { message: "", handleTo: "" },
  });

  const [newUser, setNewUser] = useState(false);
  const [messageSent, setMessageSent] = useState(false);

  const toggleNewUser = () => setNewUser(!newUser);
  const toggleMessageSent = () => setMessageSent(!messageSent);

  const sendMessage = async (message: string, keys: PublicKeys) => {
    if (!user?.keys) return;

    const { ct, signedHash } = await cipher(
      user.keys,
      user.userInfo,
      message,
      keys.cipher
    );

    await fetch(apiURL + "/submitMessage", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        message: toHexString(ct),
        signedHash: toHexString(signedHash),
      }),
    });

    console.log("Se envio: ", message);
    toggleMessageSent();
  };

  const loadKeys = async (handle: string) => {
    if (!user) return;

    const resp = await fetch(apiURL + "/getKeysList", {
      method: "GET",
    });

    if (resp.status === 400) {
      toast({
        variant: "destructive",
        title: "Error al obtener lista de usuarios",
      });
    } else if (resp.status === 200) {
      const githubUrl = `https://raw.githubusercontent.com/${handle}/anytwitter/main/public.json`;
      // const githubUrl = `https://api.github.com/repos/${handle}/anytwitter/contents/public.json`;
      const allUsers = (await resp.json()) as KeysList;
      const userTo = findUser(allUsers, handle);

      if (!userTo) {
        sendMessageForm.setError("handleTo", {
          message: "Usuario no encontrado",
        });
        return;
      }

      const respKeys = JSON.parse(userTo.keys) as PublicKeys;

      const verifier = await fetch(githubUrl, {
        headers: {},
        cache: "no-store",
      });
      // const verifierKeys = JSON.parse(
      //   window.atob((await verifier.json()).content)
      // ) as PublicKeys;
      const verifierKeys = (await verifier.json()) as PublicKeys;

      console.log(verifierKeys, respKeys);
      if (
        verifier.status === 404 ||
        JSON.stringify(verifierKeys) !== JSON.stringify(respKeys)
      ) {
        toast({
          variant: "destructive",
          title: "For security reasons cannot send message to this user",
        });
        return;
      }

      let currentLocalKeys: {
        [handle: string]: PublicKeys;
      } = {};

      const savedKeysRaw = localStorage.getItem("savedKeys");

      if (savedKeysRaw) currentLocalKeys = JSON.parse(savedKeysRaw);

      currentLocalKeys[handle] = respKeys;

      localStorage.setItem("savedKeys", JSON.stringify(currentLocalKeys));
    }
  };

  const submit = async (data: z.infer<typeof sendMessageSchema>) => {
    if (!user) return;

    if (user.userInfo.handle === data.handleTo) {
      sendMessageForm.setError("handleTo", {
        message: "No puedes enviarte mensajes a ti mismo",
      });
      return;
    }
    let currentLocalKeys: {
      [handle: string]: PublicKeys;
    } = {};

    const savedKeysRaw = localStorage.getItem("savedKeys");

    if (savedKeysRaw) currentLocalKeys = JSON.parse(savedKeysRaw);

    const keysUser = currentLocalKeys[data.handleTo];

    if (keysUser) {
      await sendMessage(data.message, keysUser);

      toast({
        title: "Mensaje enviado",
      });
    } else {
      toggleNewUser();
    }
  };

  return (
    <div className=" text-black">
      <Form {...sendMessageForm}>
        <form
          onSubmit={sendMessageForm.handleSubmit(submit)}
          className="grid h-screen place-items-center grid-rows-[90px_3fr_1fr]"
          noValidate
        >
          <FormField
            name="handleTo"
            render={({ field }) => (
              <FormItem className="justify-self-end mr-[3%]">
                <Input {...field} />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="message"
            render={({ field }) => (
              <FormItem className="w-3/5 h-[70%]  ">
                <Textarea
                  cols={30}
                  rows={10}
                  maxLength={maxSize()}
                  className="resize-none p-[20px] h-full text-xl"
                  {...field}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <Button>Enviar</Button>
        </form>
      </Form>
      <Dialog
        open={newUser}
        onOpenChange={async (open) => {
          setNewUser(open);
        }}
      >
        <DialogContent className="sm:max-w-[600px]" hideCloseButton>
          <DialogHeader>
            <DialogTitle>Cuidado</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <div>
            ¿Estas seguro de enviar un mensaje al usuario{" "}
            {sendMessageForm.getValues("handleTo")}? Es la primera vez que le
            enviaras el mensaje desde este dispositivo
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button
                type="button"
                onClick={async () => {
                  if (JSON.stringify(sendMessageForm.formState.errors) !== "{}")
                    return;

                  const { message, handleTo } = sendMessageForm.getValues();

                  await loadKeys(handleTo);

                  await submit({ message, handleTo });
                }}
              >
                {/* {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} */}
                Aceptar
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SendMessage;
