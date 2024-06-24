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
import { useForm } from "react-hook-form";

import { z } from "zod";
import { userLoginSchema } from "@/lib/schemas";
import { signInAction, signOutAction } from "@/lib/auth-utils";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useContext, useState } from "react";
import { UserContext } from "@/app/context";
import { genKeyPass, hexToBytes, simetricDecrypt } from "@/lib/crypto";
import LoadKeys from "@/_components/LoadKeys";

export default function LoginForm() {
  const router = useRouter();
  const form = useForm<z.infer<typeof userLoginSchema>>({
    resolver: zodResolver(userLoginSchema),
    defaultValues: { username: "", password: "" },
  });

  const { setUser } = useContext(UserContext);
  const [needsToImportKeys, setNeedsToImportKeys] = useState(false);

  const onSubmit = async (data: z.infer<typeof userLoginSchema>) => {
    try {
      const result = await signInAction(data);

      if (result === "Invalid credentials.") {
        // console.log("Credenciales inválidas");
        toast({
          variant: "destructive",
          title: "Correo o contraseña invalidos",
        });
        form.setError("username", { message: "" });
        form.setError("password", { message: "" });
        return;
      }

      const storedUserDataString = localStorage.getItem(data.username);

      if (!storedUserDataString) {
        await signOutAction();
        setNeedsToImportKeys(true);
        return;
      }

      const { keys: ct_keys, iv, salt } = JSON.parse(storedUserDataString);

      const localKey = await genKeyPass(data.password, hexToBytes(salt));
      const dec = new TextDecoder();

      const keys_raw = await simetricDecrypt(
        hexToBytes(ct_keys),
        hexToBytes(iv),
        hexToBytes(localKey)
      );

      if (keys_raw === null) {
        await signOutAction();
        return;
      }

      const keys = JSON.parse(dec.decode(keys_raw));

      setUser({
        userInfo: {
          handle: data.username,
          name: "Usuario",
          srcProfilePicture: "",
        },
        keys,
      });

      router.push("/home");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="grid justify-center content-center h-screen ">
      <LoadKeys
        showLoadKeys={needsToImportKeys}
        setShowLoadKeys={setNeedsToImportKeys}
        user={{
          handle: form.getValues("username"),
          password: form.getValues("password"),
        }}
      />
      <h1 className="text-4xl font-bold tracking-tight text-center my-4">
        Bienvenido a ANY-TWITTER
      </h1>
      <h2 className="text-2xl font-bold tracking-tight text-center my-2">
        Inicia sesión
      </h2>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          className="space-y-8"
        >
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Identificador de usuario</FormLabel>
                <Input {...field} type="text" placeholder="Usuario" />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <Input {...field} type="password" autoComplete="on" />
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-center ">
            <Button type="submit">Iniciar sesión</Button>
            <div className="flex items-center mx-3">o</div>
            <Button onClick={() => router.push("/signup")} type="button">
              Regístrate
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
