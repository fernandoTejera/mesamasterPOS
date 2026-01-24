import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadState } from "../utils/storage";
import { ensureProducts } from "../utils/ensureProducts";

function formatCOP(value) {
  return Number(value || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

function isToday(iso) {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function fmtDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Historial() {
  const navigate = useNavigate();

  const raw = loadState();
  const state = ensureProducts(raw);

  const [filter, setFilter] = useState("hoy"); // hoy | todos
  const [selectedSaleId, setSelectedSaleId] = useState(null);

  // modal en móvil
  const [mobileOpen, setMobileOpen] = useState(false);

  const productsById = useMemo(() => {
    const map = new Map();
    (state?.products || []).forEach((p) => map.set(p.id, p));
    return map;
  }, [state]);

  const sales = useMemo(() => {
    const arr = Array.isArray(state?.sales) ? [...state.sales] : [];

    arr.sort(
      (a, b) =>
        new Date(b.paidAt || b.createdAt) - new Date(a.paidAt || a.createdAt)
    );

    const filtered =
      filter === "hoy"
        ? arr.filter((s) => isToday(s.paidAt || s.createdAt))
        : arr;

    return filtered;
  }, [state, filter]);

  const selectedSale = useMemo(() => {
    if (!selectedSaleId) return null;
    return sales.find((s) => s.id === selectedSaleId) || null;
  }, [sales, selectedSaleId]);

  if (!state) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Historial</h1>
        <p>No hay estado guardado.</p>
      </div>
    );
  }

  function openSale(id) {
    setSelectedSaleId(id);
    // en pantallas pequeñas mostramos modal
    if (window.innerWidth <= 900) setMobileOpen(true);
  }

  function closeMobile() {
    setMobileOpen(false);
  }

  const SummaryChip = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      type="button"
      style={{
        padding: "10px 12px",
        borderRadius: 999,
        border: "1px solid #e6eaf2",
        background: active ? "#dbeafe" : "white",
        cursor: "pointer",
        fontWeight: 900,
      }}
    >
      {children}
    </button>
  );

  const DetailPanel = ({ sale }) => {
    if (!sale) {
      return (
        <div
          style={{
            background: "white",
            border: "1px solid #e6eaf2",
            borderRadius: 16,
            padding: 16,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Detalle</h2>
          <p style={{ color: "#667085", fontWeight: 800, margin: 0 }}>
            Selecciona una venta para ver el detalle.
          </p>
        </div>
      );
    }

    return (
      <div
        style={{
          background: "white",
          border: "1px solid #e6eaf2",
          borderRadius: 16,
          padding: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h2 style={{ marginTop: 0, marginBottom: 6 }}>Detalle</h2>
            <div style={{ color: "#667085", fontWeight: 800, fontSize: 13 }}>
              Mesa <b style={{ color: "#111827" }}>{sale.tableId}</b> •{" "}
              <b style={{ color: "#111827" }}>{formatCOP(sale.total)}</b>
            </div>
            <div style={{ color: "#667085", fontWeight: 800, fontSize: 13, marginTop: 4 }}>
              Fecha: <b style={{ color: "#111827" }}>{fmtDateTime(sale.paidAt || sale.createdAt)}</b>
            </div>
            <div style={{ color: "#667085", fontWeight: 800, fontSize: 13, marginTop: 4 }}>
              Método: <b style={{ color: "#111827" }}>{sale.method}</b>
              {sale.note ? (
                <>
                  {" "}
                  • Nota: <b style={{ color: "#111827" }}>{sale.note}</b>
                </>
              ) : null}
            </div>
            <div style={{ color: "#667085", fontWeight: 800, fontSize: 13, marginTop: 4 }}>
              Mesero: <b style={{ color: "#111827" }}>{sale.waiterName || "Sin mesero"}</b>
              {sale.customerName ? (
                <>
                  {" "}
                  • Cliente: <b style={{ color: "#111827" }}>{sale.customerName}</b>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          {(sale.items || []).map((it) => {
            const p = productsById.get(it.productId);
            const price = p?.price ?? 0;
            const note = (sale.itemNotes?.[it.productId] || "").trim();
            return (
              <div
                key={it.productId}
                style={{
                  padding: 12,
                  borderRadius: 14,
                  border: "1px solid #eef2f7",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  alignItems: "flex-start",
                }}
              >
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontWeight: 950 }}>
                    {p?.name ?? "Producto"}{" "}
                    <span style={{ color: "#667085", fontWeight: 900 }}>
                      x{it.qty}
                    </span>
                  </div>

                  {note && (
                    <div
                      style={{
                        fontWeight: 900,
                        fontSize: 12,
                        color: "#9a3412",
                        background: "#fff7ed",
                        border: "1px solid #fed7aa",
                        padding: "6px 10px",
                        borderRadius: 12,
                        width: "fit-content",
                        maxWidth: 520,
                      }}
                    >
                      📝 {note}
                    </div>
                  )}
                </div>

                <div style={{ fontWeight: 950, color: "#111827" }}>
                  {formatCOP(price * (it.qty ?? 0))}
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: "1px solid #eef2f7",
            display: "flex",
            justifyContent: "space-between",
            fontWeight: 950,
            fontSize: 18,
          }}
        >
          <span>Total</span>
          <span>{formatCOP(sale.total)}</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: 24, background: "#f6f8fc", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0 }}>Historial de ventas</h1>
          <p style={{ margin: "6px 0 0", color: "#667085", fontWeight: 800 }}>
            {filter === "hoy" ? "Hoy" : "Todas"} • Registros: <b>{sales.length}</b>
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
            fontWeight: 900,
            height: 42,
          }}
        >
          Volver al panel
        </button>
      </div>

      {/* Filtros */}
      <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <SummaryChip active={filter === "hoy"} onClick={() => setFilter("hoy")}>
          Hoy
        </SummaryChip>
        <SummaryChip active={filter === "todos"} onClick={() => setFilter("todos")}>
          Todas
        </SummaryChip>
      </div>

      {/* Layout desktop */}
      <div
        className="histGrid"
        style={{
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: "360px 1fr",
          gap: 16,
          alignItems: "start",
        }}
      >
        {/* Lista */}
        <div
          style={{
            background: "white",
            border: "1px solid #e6eaf2",
            borderRadius: 16,
            padding: 16,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Ventas</h2>

          {sales.length === 0 ? (
            <p style={{ color: "#667085", fontWeight: 800 }}>
              No hay ventas para este filtro.
            </p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {sales.map((s) => {
                const active = selectedSaleId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => openSale(s.id)}
                    type="button"
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      border: "1px solid #eef2f7",
                      background: active ? "#dbeafe" : "white",
                      cursor: "pointer",
                      textAlign: "left",
                      fontWeight: 900,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div>Mesa {s.tableId}</div>
                      <div>{formatCOP(s.total)}</div>
                    </div>

                    <div style={{ marginTop: 6, color: "#667085", fontWeight: 800, fontSize: 12 }}>
                      {fmtDateTime(s.paidAt || s.createdAt)} • {s.method}
                    </div>

                    {(s.customerName || s.waiterName) && (
                      <div style={{ marginTop: 4, color: "#667085", fontWeight: 800, fontSize: 12 }}>
                        {s.waiterName ? `👤 ${s.waiterName}` : ""}
                        {s.waiterName && s.customerName ? " • " : ""}
                        {s.customerName ? `🙋 ${s.customerName}` : ""}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Detalle (desktop) */}
        <div className="histDetailDesktop">
          <DetailPanel sale={selectedSale} />
        </div>
      </div>

      {/* Modal detalle (móvil) */}
      {mobileOpen && (
        <div
          onClick={closeMobile}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.4)",
            display: "grid",
            placeItems: "center",
            padding: 14,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 720,
              background: "transparent",
            }}
          >
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
              <button
                onClick={closeMobile}
                type="button"
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #e6eaf2",
                  background: "white",
                  cursor: "pointer",
                  fontWeight: 900,
                }}
              >
                Cerrar
              </button>
            </div>
            <DetailPanel sale={selectedSale} />
          </div>
        </div>
      )}

      {/* responsive */}
      <style>{`
        @media (max-width: 900px) {
          .histGrid {
            grid-template-columns: 1fr !important;
          }
          .histDetailDesktop {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
