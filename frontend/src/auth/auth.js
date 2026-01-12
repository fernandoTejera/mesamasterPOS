import { jwtDecode } from "jwt-decode";

export function getToken(){
    return localStorage.getItem("token");
}

export function isLoggedIn(){
    return !!getToken();
}

export function getUserRole() {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = jwtDecode(token);
    return payload.role || null;
  } catch {
    return null;
  }
}
export function logout() {
  localStorage.removeItem("token");
}
