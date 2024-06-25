import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { KeysList } from "./schemas";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const findUser = (array: KeysList, username: string) => {
  for (const elem of array) {
    if (elem.handle === username) return elem;
  }

  return null;
};
