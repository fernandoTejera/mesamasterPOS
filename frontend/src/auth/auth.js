// src/auth/auth.js
import { jwtDecode } from "jwt-decode";

export function getToken() {
  return localStorage.getItem("token");
}

export function isLoggedIn() {
  return !!getToken();
}

export function getUserRole() {
  // 1) Preferimos el role guardado por el Login (MVP local)
  const roleLS = localStorage.getItem("userRole");
  if (roleLS) return roleLS;

  // 2) Si no hay role en localStorage, intentamos leerlo del JWT real
  const token = getToken();
  if (!token) return null;

  try {
    const payload = jwtDecode(token);
    return payload.role || null;
  } catch {
    return null;
  }
}

export function getUserName() {
  // opcional: para MesaDetalle
  const nameLS = localStorage.getItem("userName");
  if (nameLS) return nameLS;

  const token = getToken();
  if (!token) return null;

  try {
    const payload = jwtDecode(token);
    return payload.name || payload.userName || null;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userName");
}