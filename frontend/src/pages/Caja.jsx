import { useMemo, useState } from "react";
import { loadState, saveState } from "../utils/storage";
import { PRODUCTS } from "../data/products";

function formatCOP(value) {
  return value.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

export default function Caja() {
  const [selectedTableId, setSelectedTableId] = useState(null);

  const [paymentMethod, setPaymentMethod] = useState("efectivo"); // efectivo | transferencia
  const [paymentNote, setPaymentNote] = useState("");
  const [msg, setMsg] = useState("");

  const state = loadState();

  const occupiedTables = useMemo(() => {
    if (!state) return [];
    return (state.tables || []).filter((t) => t.status === "occupied");
  }, [state]);

  const currentOrder = useMemo(() => {
    if (!state || !selectedTableId) return null;
    const table = state.tables.find((t) => t.id === selectedTableId);
    if (!table?.currentOrderId) return null;
    return state.orders?.[table.currentOrderId] || null;
  }, [state, selectedTableId]);

  function getProduct(productId) {
    return PRODUCTS.find((p) => p.id === productId);
  }

  const itemsDetailed = useMemo(() => {
    if (!currentOrder) return [];
    return (currentOrder.items || []).map((i) => {
      const p = getProduct(i.productId);
      return {
        productId: i.productId,
        name: p?.name ?? "Producto",
        price: p?.price ?? 0,
        qty: i.qty,
        subtotal: (p?.price ?? 0) * i.qty,
      };
    });
  }, [currentOrder]);

  const total = itemsDetailed.reduce((acc, x) => acc + x.subtotal, 0);

  function closeBill() {
    setMsg("");

    if (!state || !selectedTableId) {
      setMsg("Selecciona una mesa.");
      return;
    }

    const table = state.tables.find((t) => t.id === selectedTableId);
    if (!table?.currentOrderId) {
      setMsg("Esa mesa no tiene pedido activo.");
      return;
    }

    const order = state.orders?.[table.currentOrderId];
    if (!order) {
      setMsg("Pedido no encontrado.");
      return;
    }

    // Calculamos total (seguro)
    const totalValue = (order.items || []).reduce((acc, it) => {
      const p = PRODUCTS.find((x) => x.id === it.productId);
      return acc + (p?.price ?? 0) * it.qty;
    }, 0);

    // Guardar info de pago en el pedido
    order.paid = true;
    order.payment = {
      method: paymentMethod,
      note: paymentNote.trim(),
      paidAt: new Date().toISOString(),
      total: totalValue,
    };

    // Guardar en historial de ventas
    if (!Array.isArray(state.sales)) state.sales = [];
    state.sales.push({
      id: `s_${Date.now()}`,
      tableId: table.id,
      orderId: order.id,
      total: totalValue,
      method: paymentMethod,
      note: paymentNote.trim(),
      createdAt: order.createdAt,
      paidAt: order.payment.paidAt,
      items: order.items,
    });

    // Liberar mesa
    table.status = "free";
    table.currentOrderId = null;

    // MVP: borrar pedido activo
    delete state.orders[order.id];

    saveState(state);

    // Reset UI
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
      <h1 style={{ marginTop: 0 }}>Caja</h1>
      <p style={{ color: "#667085", marginTop: 6 }}>
        Selecciona una mesa ocupada para cobrar y cerrar cuenta.
      </p>

      <div
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: 16,
          alignItems: "start",
        }}
      >
        {/* Lista de mesas */}
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
                    }}
                  >
                    <div style={{ fontWeight: 800 }}>
                      {it.name}{" "}
                      <span style={{ color: "#667085" }}>x{it.qty}</span>
                    </div>
                    <div style={{ fontWeight: 900 }}>
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
                  fontWeight: 900,
                }}
              >
                <span>Total</span>
                <span>{formatCOP(total)}</span>
              </div>

              {/* Pago + cierre */}
              <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                <div style={{ fontWeight: 900 }}>Método de pago</div>

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
                      fontWeight: 800,
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
                      fontWeight: 800,
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
                    border: "1px solid #2563eb",
                    background: "#2563eb",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: 900,
                    opacity: itemsDetailed.length === 0 ? 0.6 : 1,
                  }}
                >
                  Cerrar cuenta y liberar mesa
                </button>

                {msg && (
                  <p style={{ margin: 0, fontWeight: 800, color: "#14532d" }}>
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