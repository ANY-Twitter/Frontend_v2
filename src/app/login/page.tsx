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
import { signInAction } from "@/lib/auth-utils";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const form = useForm<z.infer<typeof userLoginSchema>>({
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (data: z.infer<typeof userLoginSchema>) => {
    try {
      const result = await signInAction(data);

      if (result === "Invalid credentials.") {
        console.log("Credenciales inválidas");
        toast({
          variant: "destructive",
          title: "Correo o contraseña invalidos",
        });
        form.setError("username", { message: "" });
        form.setError("password", { message: "" });
        return;
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className=" grid justify-center content-center h-screen ">
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
                <FormLabel htmlFor="username">
                  Identificador de usuario
                </FormLabel>
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
                <FormLabel htmlFor="password">Contraseña</FormLabel>
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
