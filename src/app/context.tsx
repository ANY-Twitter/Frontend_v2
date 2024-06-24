import { UserKeys } from "@/lib/schemas";
import { User } from "next-auth";
import { createContext } from "react";

export type GlobalUser = {
  userInfo: User;
  keys: UserKeys | null;
} | null;

export type UserContextType = {
  user: GlobalUser;
  setUser: (user: GlobalUser) => void;
};

export const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
});
