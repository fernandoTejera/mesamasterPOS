import { useNavigate } from "react-router-dom";
import { logout } from "../auth/auth";

export default function Gerente() {
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f6f8fc",
        padding: 24,
        display: "grid",
        placeItems: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "white",
          border: "1px solid #e6eaf2",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 10px 22px rgba(0,0,0,0.06)",
        }}
      >
        <h1 style={{ marginTop: 0 }}>Panel del Gerente</h1>
        <p style={{ color: "#667085", marginTop: 6 }}>
          Selecciona una opción.
        </p>

        <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
          <button
            onClick={() => navigate("/caja")}
            style={{
              padding: 14,
              borderRadius: 12,
              border: "1px solid #e6eaf2",
              background: "#2563eb",
              color: "white",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            💵 Caja / Cobros
          </button>

          <button
            disabled
            style={{
              padding: 14,
              borderRadius: 12,
              border: "1px solid #e6eaf2",
              background: "#f2f4f7",
              color: "#667085",
              fontWeight: 800,
              cursor: "not-allowed",
            }}
          >
            📦 Productos (próximamente)
          </button>

          <button
            disabled
            style={{
              padding: 14,
              borderRadius: 12,
              border: "1px solid #e6eaf2",
              background: "#f2f4f7",
              color: "#667085",
              fontWeight: 800,
              cursor: "not-allowed",
            }}
          >
            📊 Reportes (próximamente)
          </button>
        </div>

        <button
          onClick={handleLogout}
          style={{
            marginTop: 20,
            width: "100%",
            padding: 12,
            borderRadius: 12,
            border: "1px solid #e6eaf2",
            background: "white",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}