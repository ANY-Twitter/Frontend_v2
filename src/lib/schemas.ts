import { z } from "zod";

export interface UserKeys {
  cipher: {
    public: JsonWebKey;
    private: JsonWebKey;
  };
  sign: {
    public: JsonWebKey;
    private: JsonWebKey;
  };
  exported_github_key: string;
}

export const userLoginSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(6).max(100),
});

export const signUpSchema = z
  .object({
    nombre: z.string().min(3).max(20),
    handle: z.string().min(3).max(20),
    password: z.string().min(6).max(100),
    repeatedPassword: z.string().min(6).max(100),
    publicKeys: z.string(),
    privateKeys: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.repeatedPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Las contraseñas no coinciden",
        path: ["repeatedPassword"],
      });

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "",
        path: ["password"],
      });
    }
  });

export type KeysList = {
  handle: string;
  name: string;
  keys: string;
}[];

export interface Tweet {
  id: string;
  name: string;
  handle: string;
  data: string;
  srcImg: string;
}

export interface PublicKeys {
  cipher: JsonWebKey;
  sign: JsonWebKey;
}

export interface CipherMessage {
  id: string;
  message: string;
  signedHash: string;
}
