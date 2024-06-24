"use server";
import axios from "axios";

const apiURL = process.env.API_URL ?? "http://localhost:3000";

const apiInstance = axios.create({
  baseURL: apiURL,
});

export const demoCall = async () => {
  const { data } = await apiInstance.get("/");
  return data;
};
