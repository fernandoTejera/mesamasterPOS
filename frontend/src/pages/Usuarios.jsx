import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadState, saveState } from "../utils/storage";
import { ensureProducts } from "../utils/ensureProducts";

const stateRaw = loadState();
const state = ensureProducts(stateRaw);
if (stateRaw !== state) saveState(state); // guarda si se inicializó

export default function Usuarios() {
  const navigate = useNavigate();
  const state = loadState();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [role, setRole] = useState("mesero");
  const [msg, setMsg] = useState("");

  const users = useMemo(() => state?.users || [], [state]);

  if (!state) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Usuarios</h1>
        <p>No hay estado.</p>
      </div>
    );
  }

  function addUser() {
    setMsg("");

    if (!name.trim() || !email.trim() || !pass.trim()) {
      setMsg("Completa nombre, correo y contraseña.");
      return;
    }

    const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      setMsg("Ese correo ya existe.");
      return;
    }

    if (!Array.isArray(state.users)) state.users = [];

    state.users.push({
      id: `u_${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: pass.trim(), // MVP: luego se cifra en backend
      role,
    });

    saveState(state);

    setName("");
    setEmail("");
    setPass("");
    setRole("mesero");
    setMsg("✅ Usuario creado.");
  }

  return (
    <div style={{ padding: 24, background: "#f6f8fc", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ marginTop: 0 }}>Usuarios</h1>
          <p style={{ color: "#667085", marginTop: 4 }}>
            Crea meseros/cocina/gerentes (MVP local).
          </p>
        </div>

        <button
          onClick={() => navigate("/gerente")}
          style={{
            padding: 10,
            borderRadius: 12,
            border: "1px solid #e6eaf2",
            background: "white",
            cursor: "pointer",
            fontWeight: 800,
            height: 42,
          }}
        >
          ← Volver al panel
        </button>
      </div>

      <div
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          alignItems: "start",
        }}
      >
        <div
          style={{
            background: "white",
            border: "1px solid #e6eaf2",
            borderRadius: 16,
            padding: 16,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Crear usuario</h2>

          <div style={{ display: "grid", gap: 10 }}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre (ej: Laura Gómez)"
              style={{ padding: 12, borderRadius: 12, border: "1px solid #e6eaf2" }}
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Correo"
              style={{ padding: 12, borderRadius: 12, border: "1px solid #e6eaf2" }}
            />
            <input
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="Contraseña"
              type="password"
              style={{ padding: 12, borderRadius: 12, border: "1px solid #e6eaf2" }}
            />

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{ padding: 12, borderRadius: 12, border: "1px solid #e6eaf2" }}
            >
              <option value="mesero">Mesero</option>
              <option value="cocina">Cocina</option>
              <option value="gerente">Gerente</option>
            </select>

            <button
              onClick={addUser}
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid #2563eb",
                background: "#2563eb",
                color: "white",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Crear usuario
            </button>

            {msg && <p style={{ margin: 0, fontWeight: 800, color: "#14532d" }}>{msg}</p>}
          </div>
        </div>

        <div
          style={{
            background: "white",
            border: "1px solid #e6eaf2",
            borderRadius: 16,
            padding: 16,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Usuarios creados</h2>

          {users.length === 0 ? (
            <p style={{ color: "#667085" }}>Aún no hay usuarios.</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {users.map((u) => (
                <div
                  key={u.id}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid #eef2f7",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 950 }}>{u.name}</div>
                    <div style={{ color: "#667085", fontWeight: 700, fontSize: 13 }}>
                      {u.email} • {u.role}
                    </div>
                  </div>
                  <div style={{ fontWeight: 900, color: "#667085" }}>MVP</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}