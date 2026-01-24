import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../auth/auth";
import { loadState, saveState } from "../utils/storage";
import { ensureProducts } from "../utils/ensureProducts";

function formatTimeHM(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

function elapsedMinutes(iso) {
  if (!iso) return 0;
  const start = new Date(iso).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - start) / 60000));
}

function elapsedLabel(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

// Solo visual (NO afecta el orden)
function urgencyColor(mins) {
  if (mins >= 15) return { bg: "#fee2e2", text: "#991b1b", border: "#ef4444" };
  if (mins >= 8) return { bg: "#fef3c7", text: "#92400e", border: "#f59e0b" };
  return { bg: "#dcfce7", text: "#166534", border: "#22c55e" };
}

export default function Cocina() {
  const navigate = useNavigate();
  const [refresh, setRefresh] = useState(0);

  // refresco cada 30s para cronómetro
  useEffect(() => {
    const id = setInterval(() => setRefresh((x) => x + 1), 1000 * 30);
    return () => clearInterval(id);
  }, []);

  // cargar estado
  const stateRaw = loadState();
  const state = ensureProducts(stateRaw);
  if (stateRaw !== state) saveState(state);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  // ✅ FIFO PURO (más antiguo primero)
  const ticketsToShow = useMemo(() => {
    if (!state) return [];

    const allTickets = Array.isArray(state.kitchenTickets)
      ? state.kitchenTickets
      : [];

    return allTickets
      .filter((t) => t.done !== true)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [state, refresh]);

  const nowLabel = useMemo(() => {
    const d = new Date();
    return d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  }, [refresh]);

  if (!state) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Cocina</h1>
        <p>No hay estado guardado.</p>
      </div>
    );
  }

  function getProduct(productId) {
    return (state.products || []).find((p) => p.id === productId);
  }

  function finishTicket(ticketId) {
    const list = Array.isArray(state.kitchenTickets) ? state.kitchenTickets : [];
    const t = list.find((x) => x.id === ticketId);
    if (!t) return;

    t.done = true;
    t.doneAt = new Date().toISOString();

    saveState(state);
    setRefresh((x) => x + 1);
  }

  return (
    <div style={{ padding: 18, background: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 950 }}>Cocina</h1>
          <p style={{ margin: "6px 0 0", color: "#667085", fontWeight: 700 }}>
            Comandas activas: <b>{ticketsToShow.length}</b> • Hora:{" "}
            <b>{nowLabel}</b>
          </p>
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid #e6eaf2",
            background: "white",
            cursor: "pointer",
            fontWeight: 900,
          }}
        >
          Cerrar sesión
        </button>
      </div>

      {ticketsToShow.length === 0 ? (
        <div
          style={{
            marginTop: 16,
            background: "white",
            border: "1px dashed #e6eaf2",
            borderRadius: 16,
            padding: 16,
            color: "#667085",
            fontWeight: 800,
          }}
        >
          ✅ No hay comandas pendientes.
        </div>
      ) : (
        <div
          style={{
            marginTop: 14,
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          }}
        >
          {ticketsToShow.map((t) => {
            const mins = elapsedMinutes(t.createdAt);
            const urgency = urgencyColor(mins);

            return (
              <div
                key={t.id}
                style={{
                  background: "white",
                  border: "1px solid #e6eaf2",
                  borderRadius: 16,
                  padding: 14,
                  boxShadow: "0 10px 22px rgba(0,0,0,0.05)",
                  position: "relative",
                }}
              >
                {/* barra urgencia (solo visual) */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 6,
                    background: urgency.border,
                  }}
                />

                {/* header tarjeta */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingLeft: 6,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 950, fontSize: 18 }}>
                      Mesa {t.tableId}
                    </div>
                    <div
                      style={{
                        color: "#667085",
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      Comanda {t.id} • {formatTimeHM(t.createdAt)}
                      {t.waiterName ? ` • ${t.waiterName}` : ""}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "6px 10px",
                      borderRadius: 999,
                      fontWeight: 950,
                      fontSize: 12,
                      color: urgency.text,
                      background: urgency.bg,
                      border: `1px solid ${urgency.border}`,
                    }}
                  >
                    ⏱ {elapsedLabel(mins)}
                  </div>
                </div>

                {/* items + notas */}
                <div
                  style={{
                    marginTop: 12,
                    display: "grid",
                    gap: 8,
                    paddingLeft: 6,
                  }}
                >
                  {(t.items || []).map((it, idx) => {
                    const p = getProduct(it.productId);
                    const note = (it.note || "").trim();

                    return (
                      <div
                        key={`${it.productId}_${idx}`}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          padding: "10px 12px",
                          border: "1px solid #eef2f7",
                          borderRadius: 14,
                          alignItems: "center",
                        }}
                      >
                        <div style={{ display: "grid", gap: 6 }}>
                          <div style={{ fontWeight: 950, fontSize: 16 }}>
                            {(p?.name || "Producto").toUpperCase()}
                          </div>

                          {note ? (
                            <div
                              style={{
                                fontWeight: 900,
                                fontSize: 12,
                                color: "#9a3412",
                                background: "#fff7ed",
                                border: "1px solid #fed7aa",
                                padding: "6px 10px",
                                borderRadius: 12,
                                maxWidth: 220,
                              }}
                            >
                              📝 {note}
                            </div>
                          ) : null}
                        </div>

                        <div style={{ fontWeight: 950, fontSize: 16 }}>
                          x{it.qty}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* acción */}
                <div style={{ marginTop: 12, paddingLeft: 6 }}>
                  <button
                    onClick={() => finishTicket(t.id)}
                    style={{
                      width: "100%",
                      padding: 12,
                      borderRadius: 14,
                      border: "1px solid #16a34a",
                      background: "#16a34a",
                      color: "white",
                      cursor: "pointer",
                      fontWeight: 950,
                      fontSize: 15,
                    }}
                  >
                    ✅ Despachar comanda
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}