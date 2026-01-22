import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { loadState } from "../utils/storage";
import { ensureProducts } from "../utils/ensureProducts";

const stateRaw = loadState();
const state = ensureProducts(stateRaw);
if (stateRaw !== state) saveState(state); // guarda si se inicializó

function formatCOP(value) {
  return (value || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

function isToday(isoString) {
  if (!isoString) return false;
  const d = new Date(isoString);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default function Reportes() {
  const navigate = useNavigate();
  const state = loadState();

  const salesToday = useMemo(() => {
    const sales = state?.sales || [];
    return sales.filter((s) => isToday(s.paidAt || s.createdAt));
  }, [state]);

  const totalToday = useMemo(() => {
    return salesToday.reduce((acc, s) => acc + (s.total || 0), 0);
  }, [salesToday]);

  const countToday = salesToday.length;

  const totalsByMethod = useMemo(() => {
    const by = { efectivo: 0, transferencia: 0, otro: 0 };
    for (const s of salesToday) {
      const m = (s.method || "").toLowerCase();
      if (m === "efectivo") by.efectivo += s.total || 0;
      else if (m === "transferencia") by.transferencia += s.total || 0;
      else by.otro += s.total || 0;
    }
    return by;
  }, [salesToday]);

  const topWaiter = useMemo(() => {
    const byWaiter = {};
    for (const s of salesToday) {
      const name = s.waiterName || "Sin mesero";
      byWaiter[name] = (byWaiter[name] || 0) + (s.total || 0);
    }
    const sorted = Object.entries(byWaiter).sort((a, b) => b[1] - a[1]);
    return sorted[0] || null; // [name, total]
  }, [salesToday]);

  const recentSales = useMemo(() => {
    const sales = state?.sales || [];
    return [...sales].sort((a, b) => (a.paidAt < b.paidAt ? 1 : -1)).slice(0, 10);
  }, [state]);

  if (!state) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Reportes</h1>
        <p>No hay estado guardado.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: "#f6f8fc", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ marginTop: 0 }}>Reportes</h1>
          <p style={{ color: "#667085", marginTop: 4 }}>
            Resumen del día y ventas recientes
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

      {/* Cards */}
      <div
        style={{
          marginTop: 16,
          display: "grid",
          gap: 14,
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
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
          <div style={{ color: "#667085", fontWeight: 800 }}>Total vendido hoy</div>
          <div style={{ fontSize: 26, fontWeight: 950, marginTop: 6 }}>
            {formatCOP(totalToday)}
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
          <div style={{ color: "#667085", fontWeight: 800 }}>Ventas hoy</div>
          <div style={{ fontSize: 26, fontWeight: 950, marginTop: 6 }}>
            {countToday}
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
          <div style={{ color: "#667085", fontWeight: 800 }}>Por método (hoy)</div>

          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <b>Efectivo</b>
              <span style={{ fontWeight: 900 }}>
                {formatCOP(totalsByMethod.efectivo)}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <b>Transferencia</b>
              <span style={{ fontWeight: 900 }}>
                {formatCOP(totalsByMethod.transferencia)}
              </span>
            </div>
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
          <div style={{ color: "#667085", fontWeight: 800 }}>
            Mesero que más vendió (hoy)
          </div>

          {topWaiter ? (
            <>
              <div style={{ fontSize: 18, fontWeight: 950, marginTop: 8 }}>
                🏆 {topWaiter[0]}
              </div>
              <div style={{ color: "#667085", fontWeight: 800, marginTop: 4 }}>
                Total: {formatCOP(topWaiter[1])}
              </div>
            </>
          ) : (
            <div style={{ color: "#667085", fontWeight: 800, marginTop: 8 }}>
              Aún no hay ventas hoy.
            </div>
          )}
        </div>
      </div>

      {/* Recent */}
      <div
        style={{
          marginTop: 16,
          background: "white",
          border: "1px solid #e6eaf2",
          borderRadius: 16,
          padding: 16,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Ventas recientes</h2>

        {recentSales.length === 0 ? (
          <p style={{ color: "#667085" }}>Aún no hay ventas.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {recentSales.map((s) => (
              <div
                key={s.id}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid #eef2f7",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 950 }}>
                    Mesa {s.tableId} • {s.method}
                  </div>
                  <div style={{ color: "#667085", fontWeight: 700, fontSize: 13 }}>
                    {s.waiterName ? `Mesero: ${s.waiterName} • ` : ""}
                    {s.paidAt ? new Date(s.paidAt).toLocaleString("es-CO") : ""}
                  </div>
                </div>

                <div style={{ fontWeight: 950 }}>{formatCOP(s.total)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}