import { loadState } from "../utils/storage";
import { ensureProducts } from "../utils/ensureProducts";

const API_URL = "http://localhost:3001";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

// ✅ Genera un "token" simple (NO JWT real) para MVP
function makeFakeToken(payload) {
  // base64 seguro para texto
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

export async function login(email, password) {
  const e = normalizeEmail(email);
  const p = String(password || "").trim();

  // 1) Intentar login desde localStorage (usuarios creados por gerente)
  const raw = loadState();
  const state = ensureProducts(raw);

  const users = Array.isArray(state?.users) ? state.users : [];
  const found = users.find(
    (u) => normalizeEmail(u.email) === e && String(u.password || "") === p
  );

  if (found) {
    return {
      token: makeFakeToken({
        userId: found.id,
        role: found.role,
        name: found.name,
        iat: Date.now(),
      }),
      user: {
        id: found.id,
        role: found.role,
        name: found.name,
        email: found.email,
      },
      source: "local",
    };
  }

  // 2) Si no existe en localStorage, caer al backend
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: e, password: p }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Error al iniciar sesión");
  }

  return { ...data, source: "api" };
}