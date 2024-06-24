import axios from "axios";

export const apiURL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export const apiInstance = axios.create({
  baseURL: apiURL,
});
