"use client";
import { useContext, useState } from "react";
import { UserContext } from "@/app/context";
import { signOutAction } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import Loader from "@/_components/Loader";
import { Input } from "@/components/ui/input";

function Config() {
  const [isAddingDevice, setIsAddingDevice] = useState(false);
  const { user } = useContext(UserContext);

  const toggleAddingDevice = () => setIsAddingDevice(!isAddingDevice);

  if (!user?.keys) return <Loader width={48} height={48} />;

  return (
    <div className="config-section text-black">
      <h2 className="text-2xl font-bold tracking-tight text-center my-5">
        Configuración
      </h2>

      <div className="grid justify-center items-center gap-x-[30px] grid-cols-[auto_auto]">
        <Button onClick={toggleAddingDevice}>Agregar nuevo dispositivo</Button>
        <Button onClick={() => signOutAction()}>Sign out</Button>
      </div>
      <Dialog
        open={isAddingDevice}
        onOpenChange={(open) => {
          setIsAddingDevice(open);
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Agregar nuevo dispositivo</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <div>
            Inserte el siguiente valor en donde indique la vista de inicio de
            sesión (Nota: El siguiente valor <strong>no lo guarde</strong> en
            ningún lado, solo úselo donde se indique).
          </div>
          <div className="flex">
            <Input type="text" value={user.keys.exported_github_key} disabled />
            <Button
              onClick={() =>
                navigator.clipboard.writeText(user.keys!.exported_github_key)
              }
            >
              Copiar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* <div className={`copy-key-section ${isAddingDevice ? "" : "off"}`}>
        <div className="copy-key-info">
          <div className="info"></div>

          <div className="key-value">
            <input
              type="text"
              className="keys"
              disabled
              value={user.keys.exported_github_key}
            />
          </div>

          <div className="button-section">
            <div className="button" onClick={toggleAddingDevice}>
              Close
            </div>
          </div>
        </div> */}
      {/* </div> */}
    </div>
  );
}

export default Config;
