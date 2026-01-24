import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadState, saveState } from "../utils/storage";
import { ensureProducts } from "../utils/ensureProducts";
import {
  FiArrowLeft,
  FiSearch,
  FiShield,
  FiTrash2,
  FiSave,
  FiUsers,
  FiUser,
  FiMail,
  FiLock,
} from "react-icons/fi";

function normalize(s) {
  return String(s || "").trim().toLowerCase();
}

function prettyRole(role) {
  const r = String(role || "").toLowerCase();
  if (r === "gerente") return "Gerente";
  if (r === "mesero") return "Mesero";
  if (r === "cocina") return "Cocina";
  return role || "—";
}

function initials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "U";
  const a = parts[0]?.[0] || "U";
  const b = parts.length > 1 ? parts[1]?.[0] : "";
  return (a + b).toUpperCase();
}

function cardStyle() {
  return {
    background: "white",
    border: "1px solid #e6eaf2",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 10px 22px rgba(0,0,0,0.04)",
  };
}

function iconPill(bg = "#eff6ff", color = "#1d4ed8") {
  return {
    width: 36,
    height: 36,
    borderRadius: 12,
    background: bg,
    display: "grid",
    placeItems: "center",
    color,
    border: "1px solid #e6eaf2",
  };
}

function inputStyle() {
  return {
    height: 44,
    width: "100%",
    borderRadius: 12,
    border: "1px solid #e6eaf2",
    outline: "none",
    padding: "0 12px 0 40px",
    fontWeight: 700,
    color: "#111827",
    background: "white",
  };
}

function selectStyle() {
  return {
    height: 44,
    width: "100%",
    borderRadius: 12,
    border: "1px solid #e6eaf2",
    outline: "none",
    padding: "0 12px",
    fontWeight: 800,
    color: "#111827",
    background: "white",
  };
}

function btnPrimary() {
  return {
    height: 44,
    borderRadius: 12,
    border: "1px solid #2563eb",
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
    fontWeight: 900,
    padding: "0 14px",
  };
}

function btnOutline() {
  return {
    height: 44,
    borderRadius: 12,
    border: "1px solid #e6eaf2",
    background: "white",
    cursor: "pointer",
    fontWeight: 900,
    padding: "0 14px",
  };
}

function btnDanger() {
  return {
    height: 40,
    borderRadius: 12,
    border: "1px solid #fecaca",
    background: "white",
    cursor: "pointer",
    fontWeight: 900,
    padding: "0 12px",
    color: "#b91c1c",
  };
}

function badge(text) {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #e6eaf2",
    background: "#f8fafc",
    fontWeight: 900,
    color: "#111827",
    fontSize: 12,
  };
}

export default function Usuarios() {
  const navigate = useNavigate();

  const [appState, setAppState] = useState(() => {
    const raw = loadState();
    const fixed = ensureProducts(raw);
    if (raw !== fixed) saveState(fixed);
    return fixed;
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [role, setRole] = useState("mesero");

  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");
  const [roleDraft, setRoleDraft] = useState({});

  const users = useMemo(() => {
    return Array.isArray(appState?.users) ? appState.users : [];
  }, [appState]);

  const filteredUsers = useMemo(() => {
    const query = normalize(q);
    if (!query) return users;

    return users.filter((u) => {
      const blob = [u?.name, u?.email, u?.role, u?.id].map(normalize).join(" ");
      return blob.includes(query);
    });
  }, [users, q]);

  function setAndPersist(nextState) {
    saveState(nextState);
    setAppState(nextState);
  }

  function addUser() {
    setMsg("");

    const n = name.trim();
    const e = email.trim().toLowerCase();
    const p = pass.trim();

    if (!n || !e || !p) {
      setMsg("Completa nombre, correo y contraseña.");
      return;
    }

    const exists = users.some((u) => String(u.email || "").toLowerCase() === e);
    if (exists) {
      setMsg("Ese correo ya existe.");
      return;
    }

    const newUser = {
      id: `u_${Date.now()}`,
      name: n,
      email: e,
      password: p, // MVP (no se muestra)
      role,
      createdAt: new Date().toISOString(),
    };

    const nextUsers = [...users, newUser];
    const nextState = { ...appState, users: nextUsers };

    setAndPersist(nextState);
    setRoleDraft((prev) => ({ ...prev, [newUser.id]: newUser.role }));

    setName("");
    setEmail("");
    setPass("");
    setRole("mesero");
    setMsg("✅ Usuario creado.");
  }

  function updateUserRole(userId) {
    setMsg("");
    const newRole = roleDraft[userId];
    if (!newRole) return;

    const nextUsers = users.map((u) =>
      u.id === userId ? { ...u, role: newRole } : u
    );
    const nextState = { ...appState, users: nextUsers };

    setAndPersist(nextState);
    setMsg("✅ Rol actualizado.");
  }

  function removeUser(userId) {
    const u = users.find((x) => x.id === userId);
    const label = u ? `${u.name} (${u.email})` : userId;
    const ok = window.confirm(
      `¿Eliminar usuario ${label}?\nEsta acción no se puede deshacer.`
    );
    if (!ok) return;

    const nextUsers = users.filter((x) => x.id !== userId);
    const nextState = { ...appState, users: nextUsers };

    setAndPersist(nextState);

    setRoleDraft((prev) => {
      const copy = { ...prev };
      delete copy[userId];
      return copy;
    });

    setMsg("🗑️ Usuario eliminado.");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: 24 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#64748b" }}>
              Panel del gerente • Gestión de usuarios
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
              <div style={iconPill("#eff6ff", "#1d4ed8")}>
                <FiUsers size={18} />
              </div>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 950, color: "#0f172a" }}>
                Usuarios
              </h1>
            </div>

            <p style={{ margin: "10px 0 0", color: "#64748b", fontWeight: 700 }}>
              Crear, buscar y administrar usuarios (sin mostrar contraseñas).
            </p>
          </div>

          <button onClick={() => navigate("/gerente")} style={btnOutline()}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <FiArrowLeft />
              Volver
            </span>
          </button>
        </div>

        {/* Banner */}
        <div
          style={{
            marginTop: 14,
            borderRadius: 16,
            border: "1px solid #dbeafe",
            background: "#eff6ff",
            padding: 14,
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
          }}
        >
          <div style={iconPill("#dbeafe", "#1d4ed8")}>
            <FiShield size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 950, color: "#0f172a" }}>Privacidad</div>
            <div style={{ color: "#475569", fontWeight: 700, marginTop: 4 }}>
              Las contraseñas no se muestran. (En MVP quedan en localStorage; luego
              las hashamos en backend).
            </div>
          </div>
        </div>

        {msg && (
          <div
            style={{
              marginTop: 14,
              borderRadius: 16,
              border: "1px solid #bbf7d0",
              background: "#ecfdf5",
              padding: 12,
              fontWeight: 900,
              color: "#065f46",
            }}
          >
            {msg}
          </div>
        )}

        <div
          style={{
            marginTop: 16,
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            alignItems: "start",
          }}
        >
          {/* Crear usuario */}
          <div style={cardStyle()}>
            <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 16 }}>
              Crear usuario
            </div>

            <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 950, color: "#64748b" }}>
                  Nombre
                </div>
                <div style={{ position: "relative", marginTop: 6 }}>
                  <FiUser
                    size={16}
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#94a3b8",
                    }}
                  />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Laura Gómez"
                    style={inputStyle()}
                  />
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 950, color: "#64748b" }}>
                  Correo
                </div>
                <div style={{ position: "relative", marginTop: 6 }}>
                  <FiMail
                    size={16}
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#94a3b8",
                    }}
                  />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@dominio.com"
                    style={inputStyle()}
                  />
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 950, color: "#64748b" }}>
                  Contraseña
                </div>
                <div style={{ position: "relative", marginTop: 6 }}>
                  <FiLock
                    size={16}
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#94a3b8",
                    }}
                  />
                  <input
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    placeholder="••••••••"
                    type="password"
                    style={inputStyle()}
                  />
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 950, color: "#64748b" }}>
                  Rol
                </div>
                <div style={{ marginTop: 6 }}>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={selectStyle()}
                  >
                    <option value="mesero">Mesero</option>
                    <option value="cocina">Cocina</option>
                    <option value="gerente">Gerente</option>
                  </select>
                </div>
              </div>

              <button onClick={addUser} style={btnPrimary()}>
                Crear usuario
              </button>
            </div>
          </div>

          {/* Usuarios creados */}
          <div style={cardStyle()}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 16 }}>
                Usuarios creados
              </div>
              <div style={badge(`Total: ${users.length} • Mostrando: ${filteredUsers.length}`)} />
            </div>

            <div style={{ position: "relative", marginTop: 12 }}>
              <FiSearch
                size={16}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nombre, correo o rol…"
                style={inputStyle()}
              />
            </div>

            <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
              {filteredUsers.length === 0 ? (
                <div
                  style={{
                    borderRadius: 16,
                    border: "1px dashed #e6eaf2",
                    padding: 18,
                    textAlign: "center",
                    color: "#64748b",
                    fontWeight: 800,
                  }}
                >
                  No hay usuarios. Crea el primero y aparecerá aquí.
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const draft = roleDraft[u.id] ?? u.role ?? "mesero";

                  return (
                    <div
                      key={u.id}
                      style={{
                        borderRadius: 16,
                        border: "1px solid #eef2f7",
                        padding: 14,
                        background: "white",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          flexWrap: "wrap",
                          alignItems: "flex-start",
                        }}
                      >
                        <div style={{ display: "flex", gap: 12 }}>
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 14,
                              background: "#f1f5f9",
                              border: "1px solid #e6eaf2",
                              display: "grid",
                              placeItems: "center",
                              fontWeight: 950,
                              color: "#334155",
                            }}
                            title={u.name}
                          >
                            {initials(u.name)}
                          </div>

                          <div>
                            <div style={{ fontWeight: 950, color: "#0f172a" }}>
                              {u.name}
                            </div>
                            <div
                              style={{
                                marginTop: 2,
                                color: "#64748b",
                                fontWeight: 800,
                                fontSize: 13,
                              }}
                            >
                              {u.email} • {prettyRole(u.role)}
                            </div>
                            <div
                              style={{
                                marginTop: 2,
                                color: "#94a3b8",
                                fontWeight: 800,
                                fontSize: 12,
                              }}
                            >
                              ID: {u.id}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                          <select
                            value={draft}
                            onChange={(e) =>
                              setRoleDraft((prev) => ({
                                ...prev,
                                [u.id]: e.target.value,
                              }))
                            }
                            style={{
                              height: 40,
                              borderRadius: 12,
                              border: "1px solid #e6eaf2",
                              padding: "0 12px",
                              fontWeight: 900,
                              background: "white",
                              color: "#0f172a",
                            }}
                          >
                            <option value="mesero">Mesero</option>
                            <option value="cocina">Cocina</option>
                            <option value="gerente">Gerente</option>
                          </select>

                          <button
                            onClick={() => updateUserRole(u.id)}
                            style={{
                              height: 40,
                              borderRadius: 12,
                              border: "1px solid #e6eaf2",
                              background: "#f1f5f9",
                              cursor: "pointer",
                              fontWeight: 950,
                              padding: "0 12px",
                            }}
                          >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                              <FiSave />
                              Guardar
                            </span>
                          </button>

                          <button onClick={() => removeUser(u.id)} style={btnDanger()}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                              <FiTrash2 />
                              Eliminar
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Nota */}
        <div
          style={{
            marginTop: 16,
            borderRadius: 16,
            border: "1px dashed #e6eaf2",
            background: "white",
            padding: 14,
            color: "#64748b",
            fontWeight: 800,
          }}
        >
          Tip: en el futuro, cuando conectemos backend, aquí se guardará contraseña hasheada,
          roles reales y permisos por pantalla.
        </div>
      </div>
    </div>
  );
}