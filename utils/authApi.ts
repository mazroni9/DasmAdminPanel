// utils/authApi.ts
import axios from "axios";
import { api } from "./api";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

// Sanctum CSRF cookie (مش تحت /api)
export async function getCsrfCookie() {
  await axios.get(`${API_ORIGIN}/sanctum/csrf-cookie`, {
    withCredentials: true,
    headers: { Accept: "application/json" },
  });
}

export type LoginPayload = { email: string; password: string };

export async function login(payload: LoginPayload) {
  await getCsrfCookie();
  // route موجود: POST /api/login
  return api.post("/login", payload);
}

export async function logout() {
  // route موجود: POST /api/logout (auth required)
  return api.post("/logout");
}

export async function getMe() {
  // route موجود: GET /api/user
  return api.get("/user");
}

export async function getPermissions() {
  // route موجود: GET /api/user/permissions
  return api.get("/user/permissions");
}
