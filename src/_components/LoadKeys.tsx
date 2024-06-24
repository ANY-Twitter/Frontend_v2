import React, { useContext, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserContext } from "@/app/context";
import {
  genKeyPass,
  hexToBytes,
  simetricCipher,
  simetricDecrypt,
  toHexString,
} from "@/lib/crypto";
import { set, z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { User } from "next-auth";
import { UserKeys } from "@/lib/schemas";
import { useRouter } from "next/navigation";
import { signInAction } from "@/lib/auth-utils";

const formSchema = z.object({ githubKey: z.string().min(1) });

interface InsertPassDialogProps {
  showLoadKeys: boolean;
  setShowLoadKeys: (show: boolean) => void;
  user: { handle: string; password: string };
}

export default function LoadKeys({
  showLoadKeys,
  setShowLoadKeys,
  user,
}: Readonly<InsertPassDialogProps>) {
  const router = useRouter();
  const { setUser } = useContext(UserContext);

  const { handle, password } = user;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { githubKey: "" },
  });

  const loadKeys = async ({ githubKey }: { githubKey: string }) => {
    const baseUrl = `https://api.github.com/repos/${handle}/anytwitter/contents/`;
    const files = [
      ["public.json", "public"],
      ["private.json", "private"],
    ] as const;
    let keys: {
      cipher: { private: any; public: any };
      sign: { private: any; public: any };
      exported_github_key: string;
    } = {
      cipher: { private: {}, public: {} },
      sign: { private: {}, public: {} },
      exported_github_key: "",
    };
    let error = false;

    for (const [fileName, type] of files) {
      console.log("empezando", type);
      let response = await fetch(baseUrl + fileName, {
        headers: {
          // Authorization: "token "
        },
        cache: "no-store",
      });

      let github_response = await response.json();
      let response_json = JSON.parse(window.atob(github_response.content));
      let signKey;
      let cipherKey;

      if (type == "private") {
        const keys_ct = response_json["value"];
        const keys_raw = await simetricDecrypt(
          hexToBytes(keys_ct),
          new Uint8Array(12),
          hexToBytes(githubKey)
        );

        if (keys_raw) {
          const dec = new TextDecoder();
          const key_json = JSON.parse(dec.decode(keys_raw));

          cipherKey = key_json["cipher"];
          signKey = key_json["sign"];

          error = false;
        } else {
          error = true;
          cipherKey = "";
          signKey = "";
        }
      } else {
        cipherKey = response_json["cipher"];
        signKey = response_json["sign"];
      }

      keys["cipher"][type] = cipherKey;
      keys["sign"][type] = signKey;
    }

    keys["exported_github_key"] = githubKey;

    if (error) return;

    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const localKey = await genKeyPass(password, salt);
    const ct_keys_raw = await simetricCipher(
      JSON.stringify(keys),
      hexToBytes(localKey),
      iv
    );
    const ct_key = toHexString(ct_keys_raw);

    const dec = new TextDecoder();
    const keys_raw = await simetricDecrypt(
      hexToBytes(ct_key),
      iv,
      hexToBytes(localKey)
    );

    if (!keys_raw) return;

    setUser({
      userInfo: {
        handle: user.handle,
        name: "Usuario",
        srcProfilePicture: "",
      },
      keys: JSON.parse(dec.decode(keys_raw)),
    });

    localStorage.setItem(
      user.handle,
      JSON.stringify({
        keys: ct_key,
        iv: toHexString(iv),
        salt: toHexString(salt),
      })
    );

    await signInAction({ username: user.handle, password: user.password });
    router.push("/home");
  };

  return (
    <Dialog open={showLoadKeys}>
      <DialogContent className="sm:max-w-[600px]" hideCloseButton>
        <DialogHeader>
          <DialogTitle>
            Ingrese el valor mostrado en su otro dispositivo
          </DialogTitle>
          <DialogDescription>
            Se necesita la contraseña para poder enviar mensajes. Ve a la
            configuración de alguno de tus dispositivos, clickee el boton:{" "}
            <strong>
              <em>Agregar nuevo dispositivo</em>
            </strong>
            . Finalmente pegue el valor que le sale en la caja de abajo.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(loadKeys)} noValidate>
            <FormField
              control={form.control}
              name="githubKey"
              render={({ field }) => (
                <FormItem>
                  <Input {...field} />
                  <FormLabel />
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowLoadKeys(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {/* {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} */}
                Aceptar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
