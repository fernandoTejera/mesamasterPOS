import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../auth/auth";
import { loadState, saveState } from "../utils/storage";
import { ensureProducts } from "../utils/ensureProducts";

export default function Cocina() {
  const navigate = useNavigate();
  const [refresh, setRefresh] = useState(0);

  // ✅ cargar estado y asegurar productos (DENTRO del componente)
  const stateRaw = loadState();
  const state = ensureProducts(stateRaw);
  if (stateRaw !== state) saveState(state);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const ordersToShow = useMemo(() => {
    if (!state) return [];

    const allOrders = Object.values(state.orders || {});
    return allOrders
      .filter((o) => o.sentToKitchen === true && o.kitchenDone !== true)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [state, refresh]);

  if (!state) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Cocina</h1>
        <p>No hay estado guardado (localStorage vacío).</p>
      </div>
    );
  }

  function getProduct(productId) {
    return (state.products || []).find((p) => p.id === productId);
  }

  function finishOrder(orderId) {
    const order = state.orders?.[orderId];
    if (!order) return;

    order.kitchenDone = true;
    saveState(state);
    setRefresh((x) => x + 1);
  }

  return (
    <div style={{ padding: 24, background: "#f6f8fc", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ marginTop: 0 }}>Cocina</h1>
        <button
          onClick={handleLogout}
          style={{
            padding: 10,
            borderRadius: 12,
            border: "1px solid #e6eaf2",
            background: "white",
            cursor: "pointer",
            fontWeight: 800,
          }}
        >
          Cerrar sesión
        </button>
      </div>

      <p style={{ color: "#667085", marginTop: 6 }}>
        Pedidos enviados por los meseros.
      </p>

      {ordersToShow.length === 0 ? (
        <div
          style={{
            marginTop: 16,
            background: "white",
            border: "1px solid #e6eaf2",
            borderRadius: 16,
            padding: 16,
          }}
        >
          <b>No hay pedidos pendientes.</b>
        </div>
      ) : (
        <div
          style={{
            marginTop: 16,
            display: "grid",
            gap: 14,
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          }}
        >
          {ordersToShow.map((o) => (
            <div
              key={o.id}
              style={{
                background: "white",
                border: "1px solid #e6eaf2",
                borderRadius: 16,
                padding: 16,
                boxShadow: "0 10px 22px rgba(0,0,0,0.06)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <div style={{ fontWeight: 900, fontSize: 16 }}>
                    Mesa {o.tableId}
                  </div>
                  <div style={{ color: "#667085", fontSize: 13 }}>
                    Pedido: {o.id}
                  </div>
                </div>

                <div
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    fontWeight: 800,
                    fontSize: 12,
                    color: "#1d4ed8",
                    background: "#dbeafe",
                    border: "1px solid #e6eaf2",
                  }}
                >
                  EN PREPARACIÓN
                </div>
              </div>

              <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                {(o.items || []).map((it) => {
                  const p = getProduct(it.productId);
                  return (
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
                        {p?.name ?? "Producto"}
                      </div>
                      <div style={{ fontWeight: 900 }}>x{it.qty}</div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                <button
                  onClick={() => finishOrder(o.id)}
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 12,
                    border: "1px solid #e6eaf2",
                    background: "#2563eb",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: 900,
                  }}
                >
                  Despachar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}