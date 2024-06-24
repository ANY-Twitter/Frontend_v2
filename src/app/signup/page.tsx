"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { signUpSchema } from "@/lib/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import Loader from "@/_components/Loader";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { genKey, hexToBytes, simetricCipher, toHexString } from "@/lib/crypto";

export default function SignUp() {
  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      nombre: "",
      handle: "",
      password: "",
      repeatedPassword: "",
      publicKeys: "",
      privateKeys: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof signUpSchema>) => {};

  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    const generateKeys = async () => {
      const initialKeys = await genKey(); //agregar llave simetríca github

      // setUser({ ...user, keys: initialKeys });
      const public_keys_form_json = {
        cipher: initialKeys.cipher.public,
        sign: initialKeys.sign.public,
      };
      const private_keys_form_json = {
        cipher: initialKeys.cipher.private,
        sign: initialKeys.sign.private,
      };

      const ct_private_keys_form_json = await simetricCipher(
        JSON.stringify(private_keys_form_json),
        hexToBytes(initialKeys.exported_github_key),
        new Uint8Array(12)
      );

      signUpForm.setValue("publicKeys", JSON.stringify(public_keys_form_json));
      signUpForm.setValue(
        "privateKeys",
        JSON.stringify({ value: toHexString(ct_private_keys_form_json) })
      );

      setIsLoading(false);
    };

    generateKeys();
  }, [signUpForm, setIsLoading]);

  if (isLoading) return <Loader width={48} height={48} />;

  return (
    <div className="grid justify-center content-center h-screen ">
      <h1 className="text-4xl font-bold tracking-tight text-center my-4">
        ANY-TWITTER
      </h1>
      <h2 className="text-2xl font-bold tracking-tight text-center my-2">
        Registrese
      </h2>
      <Form {...signUpForm}>
        <form
          onSubmit={signUpForm.handleSubmit(onSubmit)}
          noValidate
          className="space-y-4 grid justify-items-center"
        >
          <FormField
            control={signUpForm.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <Input {...field} type="text" placeholder="Usuario" />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={signUpForm.control}
            name="handle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Handle</FormLabel>
                <Input {...field} type="text" placeholder="Usuario" />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={signUpForm.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <Input {...field} type="password" placeholder="Contraseña" />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={signUpForm.control}
            name="repeatedPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Repita la contraseña</FormLabel>
                <Input {...field} type="password" placeholder="Contraseña" />
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="w-2/5">
            Para el correcto funcionamiento de <strong>AnyTwitter</strong>{" "}
            necesitamos que guardes los siguientes valores en un repositorio en{" "}
            <a
              target="_blank"
              rel="noreferrer"
              href="https://github.com/new?name=anytwitter"
              className="text-blue-500"
            >
              <strong>github</strong>
            </a>{" "}
            llamado <strong>anytwitter</strong> (Nota: el usuario de github debe
            ser <strong>exactamente</strong> igual al handle ingresado y la rama
            debe ser <strong>main</strong>).
          </div>

          <FormField
            control={signUpForm.control}
            name="publicKeys"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Llave pública</FormLabel>
                <div className="flex">
                  <Input
                    {...field}
                    type="text"
                    placeholder="Llave pública"
                    disabled
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      toast({
                        title: "Copiado al portapapeles",
                      });
                      navigator.clipboard.writeText(field.value);
                    }}
                    className="ml-2"
                  >
                    Copiar
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={signUpForm.control}
            name="privateKeys"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Llave privada</FormLabel>

                <div className="flex">
                  <Input
                    {...field}
                    type="text"
                    placeholder="Llave privada"
                    disabled
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      toast({
                        title: "Copiado al portapapeles",
                      });
                      navigator.clipboard.writeText(field.value);
                    }}
                    className="ml-2"
                  >
                    Copiar
                  </Button>
                </div>

                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Registrar</Button>
        </form>
      </Form>
    </div>
  );
}
