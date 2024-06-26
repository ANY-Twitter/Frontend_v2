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
import { genKeyPass, hexToBytes, simetricDecrypt } from "@/lib/crypto";
import {  z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useRouter } from "next/navigation";

const formSchema = z.object({ password: z.string().min(1) });

interface InsertPassDialogProps {
  showInsertPassDialog: boolean;
  setShowInsertPassDialog: (show: boolean) => void;
}

export default function InsertPassDialog({
  showInsertPassDialog,
  setShowInsertPassDialog,
}: Readonly<InsertPassDialogProps>) {
  const router = useRouter();
  const { user, setUser } = useContext(UserContext);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: "" },
  });

  const getKeys = async ({ password }: { password: string }) => {
    console.log(user, password);
    if (!user) return;

    const storedUserDataString = localStorage.getItem(user.userInfo.handle);

    if (!storedUserDataString) return;

    const { keys: ct_keys, iv, salt } = JSON.parse(storedUserDataString);

    const localKey = await genKeyPass(password, hexToBytes(salt));
    const dec = new TextDecoder();

    const keys_raw = await simetricDecrypt(
      hexToBytes(ct_keys),
      hexToBytes(iv),
      hexToBytes(localKey)
    );

    if (keys_raw === null) {
      form.setError("password", {
        message: "Contraseña invalida",
      });
      return;
    }

    const keys = JSON.parse(dec.decode(keys_raw));

    setUser({ ...user, keys });
    setShowInsertPassDialog(false);
  };

  return (
    <Dialog open={showInsertPassDialog}>
      <DialogContent className="sm:max-w-[600px]" hideCloseButton>
        <DialogHeader>
          <DialogTitle>Ingresar contraseña</DialogTitle>
          <DialogDescription>
            Se necesita la contraseña para poder enviar mensajes.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(getKeys)} noValidate>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  {/* <Form>Identificador de usuario</Form> */}
                  <Input type="password" {...field} />
                  <FormLabel />
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="mt-4">
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
