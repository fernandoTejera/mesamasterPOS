import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadState, saveState } from "../utils/storage";
import { ensureProducts } from "../utils/ensureProducts";

function formatCOP(value) {
  return Number(value || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

export default function Caja() {
  const navigate = useNavigate();
  const [selectedTableId, setSelectedTableId] = useState(null);

  const [paymentMethod, setPaymentMethod] = useState("efectivo"); // efectivo | transferencia
  const [paymentNote, setPaymentNote] = useState("");
  const [msg, setMsg] = useState("");

  // ✅ Estado reactivo
  const [state, setState] = useState(() => {
    const raw = loadState();
    const fixed = ensureProducts(raw);
    if (raw !== fixed) saveState(fixed);
    return fixed;
  });

  const occupiedTables = useMemo(() => {
    if (!state) return [];
    return (state.tables || []).filter((t) => t.status === "occupied");
  }, [state]);

  const currentOrder = useMemo(() => {
    if (!state || !selectedTableId) return null;
    const table = (state.tables || []).find((t) => t.id === selectedTableId);
    if (!table?.currentOrderId) return null;
    return state.orders?.[table.currentOrderId] || null;
  }, [state, selectedTableId]);

  const productsById = useMemo(() => {
    const map = new Map();
    (state?.products || []).forEach((p) => map.set(p.id, p));
    return map;
  }, [state]);

  const itemsDetailed = useMemo(() => {
    if (!currentOrder) return [];
    return (currentOrder.items || []).map((i) => {
      const p = productsById.get(i.productId);
      const price = p?.price ?? 0;
      const note = currentOrder?.itemNotes?.[i.productId] || "";
      return {
        productId: i.productId,
        name: p?.name ?? "Producto",
        price,
        qty: i.qty,
        note,
        subtotal: price * i.qty,
      };
    });
  }, [currentOrder, productsById]);

  const total = itemsDetailed.reduce((acc, x) => acc + x.subtotal, 0);

  function closeBill() {
    setMsg("");

    if (!state || !selectedTableId) {
      setMsg("Selecciona una mesa.");
      return;
    }

    const table = (state.tables || []).find((t) => t.id === selectedTableId);
    if (!table?.currentOrderId) {
      setMsg("Esa mesa no tiene pedido activo.");
      return;
    }

    const orderId = table.currentOrderId;
    const order = state.orders?.[orderId];

    if (!order) {
      setMsg("Pedido no encontrado.");
      return;
    }

    const totalValue = (order.items || []).reduce((acc, it) => {
      const p = productsById.get(it.productId);
      return acc + (p?.price ?? 0) * it.qty;
    }, 0);

    const paidAt = new Date().toISOString();
    const note = paymentNote.trim();

    const waiterName = order.waiterName || "Sin mesero";
    const customerName = order.customerName || "";

    // ✅ guardar pago dentro del pedido (por consistencia)
    const updatedOrder = {
      ...order,
      paid: true,
      payment: {
        method: paymentMethod,
        note,
        paidAt,
        total: totalValue,
      },
    };

    // ✅ venta con TODO: items + notas + cliente + mesero
    const newSale = {
      id: `s_${Date.now()}`,
      tableId: table.id,
      orderId: updatedOrder.id,
      total: totalValue,
      method: paymentMethod,
      note,
      createdAt: updatedOrder.createdAt,
      paidAt,
      items: updatedOrder.items,
      itemNotes: updatedOrder.itemNotes || {},   // ✅ AQUÍ
      waiterName,
      customerName,                              // ✅ AQUÍ
    };

    const nextTables = (state.tables || []).map((t) =>
      t.id === table.id ? { ...t, status: "free", currentOrderId: null } : t
    );

    const nextOrders = { ...(state.orders || {}) };
    delete nextOrders[updatedOrder.id];

    const nextSales = Array.isArray(state.sales)
      ? [...state.sales, newSale]
      : [newSale];

    const nextState = {
      ...state,
      tables: nextTables,
      orders: nextOrders,
      sales: nextSales,
    };

    saveState(nextState);
    setState(nextState);

    setPaymentNote("");
    setSelectedTableId(null);
    setMsg("✅ Cuenta cerrada y mesa liberada.");
  }

  if (!state) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Caja</h1>
        <p>No hay estado guardado.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: "#f6f8fc", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ marginTop: 0 }}>Caja</h1>
          <p style={{ color: "#667085", marginTop: 4 }}>
            Cobros y cierre de cuenta
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
          Volver al panel
        </button>
      </div>

      <div
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: 16,
          alignItems: "start",
        }}
      >
        {/* Mesas */}
        <div
          style={{
            background: "white",
            border: "1px solid #e6eaf2",
            borderRadius: 16,
            padding: 16,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Mesas ocupadas</h2>

          {occupiedTables.length === 0 ? (
            <p style={{ color: "#667085" }}>No hay mesas ocupadas.</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {occupiedTables.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTableId(t.id);
                    setMsg("");
                  }}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid #eef2f7",
                    background: selectedTableId === t.id ? "#dbeafe" : "white",
                    cursor: "pointer",
                    textAlign: "left",
                    fontWeight: 900,
                  }}
                >
                  Mesa {t.id}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detalle */}
        <div
          style={{
            background: "white",
            border: "1px solid #e6eaf2",
            borderRadius: 16,
            padding: 16,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Detalle</h2>

          {!currentOrder ? (
            <p style={{ color: "#667085" }}>
              Selecciona una mesa para ver su pedido.
            </p>
          ) : (
            <>
              <p style={{ color: "#667085", marginTop: 6 }}>
                Pedido: <b>{currentOrder.id}</b>
              </p>

              <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                {itemsDetailed.map((it) => (
                  <div
                    key={it.productId}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: 10,
                      border: "1px solid #eef2f7",
                      borderRadius: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ display: "grid", gap: 6 }}>
                      <div style={{ fontWeight: 900 }}>
                        {it.name}{" "}
                        <span style={{ color: "#667085" }}>x{it.qty}</span>
                      </div>

                      {/* ✅ Nota visible en caja */}
                      {it.note && (
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
                            maxWidth: 420,
                          }}
                        >
                          📝 {it.note}
                        </div>
                      )}
                    </div>

                    <div style={{ fontWeight: 950 }}>
                      {formatCOP(it.subtotal)}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: "1px solid #eef2f7",
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 950,
                  fontSize: 18,
                }}
              >
                <span>Total</span>
                <span>{formatCOP(total)}</span>
              </div>

              {/* Pago */}
              <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                <div style={{ fontWeight: 950 }}>Método de pago</div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    onClick={() => setPaymentMethod("efectivo")}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid #e6eaf2",
                      background:
                        paymentMethod === "efectivo" ? "#dbeafe" : "white",
                      cursor: "pointer",
                      fontWeight: 900,
                    }}
                  >
                    Efectivo
                  </button>

                  <button
                    onClick={() => setPaymentMethod("transferencia")}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid #e6eaf2",
                      background:
                        paymentMethod === "transferencia" ? "#dbeafe" : "white",
                      cursor: "pointer",
                      fontWeight: 900,
                    }}
                  >
                    Transferencia
                  </button>
                </div>

                <input
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Nota / referencia (opcional)"
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid #e6eaf2",
                    outline: "none",
                  }}
                />

                <button
                  onClick={closeBill}
                  disabled={itemsDetailed.length === 0}
                  style={{
                    marginTop: 6,
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid #16a34a",
                    background: "#16a34a",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: 950,
                    opacity: itemsDetailed.length === 0 ? 0.6 : 1,
                  }}
                >
                  Cerrar cuenta y liberar mesa
                </button>

                {msg && (
                  <p style={{ margin: 0, fontWeight: 900, color: "#14532d" }}>
                    {msg}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
