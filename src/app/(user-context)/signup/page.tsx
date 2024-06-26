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
import { UserKeys, signUpSchema } from "@/lib/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import Loader from "@/_components/Loader";
import React, { useContext, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  genKey,
  genKeyPass,
  hexToBytes,
  simetricCipher,
  toHexString,
} from "@/lib/crypto";
import { apiInstance } from "@/lib/api-calls";
import { signInAction } from "@/lib/auth-utils";
import { useRouter } from "next/navigation";
import { UserContext } from "@/app/context";
import Image from "next/image";

export default function SignUp() {
  const router = useRouter();

  const [image, setImage] = React.useState<File | null>(null);
  const [prevSrc, setPrevSrc] = React.useState<string | null>(null);
  const { setUser } = useContext(UserContext);
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

  const [keys, setKeys] = React.useState<UserKeys | null>(null);

  async function verifyGithubKeys(
    handle: string,
    publicKeys: string,
    privateKeys: string
  ) {
    const baseUrl = `https://api.github.com/repos/${handle}/anytwitter/contents/`;
    const files = [
      ["public.json", publicKeys, "publicKeys"],
      ["private.json", privateKeys, "privateKeys"],
    ];

    let isOk = true;

    for (const [file, expectedValue, formPath] of files) {
      let response = await fetch(baseUrl + file, {
        headers: {
          //este codigo ya no es valido (se revoco).
        },
        cache: "no-store",
      });

      if (response.status === 404 || response.status === 400) {
        signUpForm.setError(formPath as "privateKeys" | "publicKeys", {
          message: "No existe el archivo en el repositorio de github",
        });
        isOk = false;
        continue;
      }

      try {
        const temp = await response.json();
        const data_raw = atob(temp.content);
        const response_json = JSON.parse(data_raw);
        const response_string = JSON.stringify(response_json);

        if (response_string !== expectedValue)
          throw new Error("No es el valor requerido");
      } catch (error) {
        signUpForm.setError(formPath as "privateKeys" | "publicKeys", {
          message: "No es el valor requerido",
        });
        isOk = false;
      }
    }
    return isOk;
  }

  const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
    if (keys === null) {
      toast({
        title: "Error al generar llaves",
        variant: "destructive",
      });
      return;
    }

    const githubKeysSuccessFull = await verifyGithubKeys(
      data.handle,
      data.publicKeys,
      data.privateKeys
    );

    if (!githubKeysSuccessFull) return;

    const submitForm = new FormData();

    submitForm.append("name", data.nombre);
    submitForm.append("handle", data.handle);
    submitForm.append("password", data.password);
    submitForm.append(
      "keys",
      JSON.stringify({
        cipher: keys.cipher.public,
        sign: keys.sign.public,
      })
    );

    if (image !== null) submitForm.append("user_photo", image);

    try {
      const response = await apiInstance.post("/crearUsuario", submitForm);

      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const localKey = await genKeyPass(data.password, salt);
      const ct_keys_raw = await simetricCipher(
        JSON.stringify(keys),
        hexToBytes(localKey),
        iv
      );
      const ct_key = toHexString(ct_keys_raw);

      const user: { name: string; handle: string; srcProfilePicture: string } =
        response.data;

      localStorage.setItem(
        user.handle,
        JSON.stringify({
          keys: ct_key,
          iv: toHexString(iv),
          salt: toHexString(salt),
        })
      );

      setUser({ userInfo: user, keys });
    } catch (e) {
      console.log(e);
      return;
    }

    try {
      await signInAction({
        username: data.handle,
        password: data.password,
      });

      // router.push("/home");
    } catch (e) {
      console.log(e);
    }
  };

  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    const generateKeys = async () => {
      const initialKeys = await genKey(); //agregar llave simetríca github

      setKeys(initialKeys);

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
  }, [signUpForm, setIsLoading, setKeys]);

  if (isLoading) return <Loader width={48} height={48} />;

  return (
    <div className="grid justify-center content-center">
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
                <Input
                  {...field}
                  type="password"
                  placeholder="Contraseña"
                  autoComplete="newpassword"
                />
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
                <Input
                  {...field}
                  type="password"
                  placeholder="Contraseña"
                  autoComplete="newpassword"
                />
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
                <FormLabel>
                  Llave pública (nombre el archivo <strong>public.json</strong>)
                </FormLabel>
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
                <FormLabel>
                  Llave privada (nombre el archivo <strong>private.json</strong>
                  )
                </FormLabel>

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
          <div className="grid gap-y-[12px] justify-items-center">
            <Button type="button">
              <label className="button" htmlFor="userPhoto">
                Seleccionar imagen
              </label>
            </Button>
            <input
              type="file"
              id="userPhoto"
              name="userPhoto"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.currentTarget.files === null) return;
                let file = e.currentTarget.files[0];
                const newSrc = URL.createObjectURL(file);
                console.log(e.currentTarget.files);
                setImage(file);

                setPrevSrc(newSrc);
              }}
            />

            <Image
              id="prevImg"
              src={prevSrc ?? ""}
              alt="No preview"
              width={48}
              height={48}
            />
          </div>
          <Button type="submit">Registrar</Button>
        </form>
      </Form>
    </div>
  );
}
