import "./mesaDetalle.css";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { loadState, saveState } from "../utils/storage";
import { ensureProducts } from "../utils/ensureProducts";

function formatCOP(value) {
  return Number(value || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

export default function MesaDetalle() {
  const { id } = useParams();
  const tableId = Number(id); // params siempre string
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState("");

  // ✅ cargar estado y asegurar products (DENTRO del componente)
  const raw = loadState();
  const appState = ensureProducts(raw);
  if (raw !== appState) saveState(appState);

  if (!appState) {
    return (
      <div style={{ padding: 24 }}>
        <p>No hay estado cargado. Vuelve a Mesas.</p>
        <Link to="/mesas">← Volver</Link>
      </div>
    );
  }

  const table = (appState.tables || []).find((t) => Number(t.id) === tableId);

  if (!table) {
    return (
      <div style={{ padding: 24 }}>
        <p>Mesa no encontrada.</p>
        <Link to="/mesas">← Volver</Link>
      </div>
    );
  }

  // ✅ lista de productos activos para el mesero
  const activeProducts = (appState.products || []).filter(
    (p) => p.active !== false
  );

  function getOrCreateOrderId() {
    if (table.currentOrderId) return table.currentOrderId;

    const newId = `o_${Date.now()}`;

    // ✅ aquí debería venir del usuario logueado (ya lo tienes)
    const userName = localStorage.getItem("userName") || "Mesero";

    const newOrder = {
      id: newId,
      tableId,
      items: [],
      createdAt: new Date().toISOString(),
      sentToKitchen: false,
      kitchenDone: false,

      waiterName: userName,
      customerName: "",
    };

    if (!appState.orders) appState.orders = {};
    appState.orders[newId] = newOrder;

    table.status = "occupied";
    table.currentOrderId = newId;

    saveState(appState);
    return newId;
  }

  const orderId = getOrCreateOrderId();
  const order = appState.orders?.[orderId];

  // precargar input con customerName guardado
  useEffect(() => {
    setCustomerName(order?.customerName || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  function addProduct(productId) {
    const item = order.items.find((i) => i.productId === productId);
    if (item) item.qty += 1;
    else order.items.push({ productId, qty: 1 });

    saveState(appState);
    navigate(0);
  }

  function inc(productId) {
    const item = order.items.find((i) => i.productId === productId);
    if (!item) return;
    item.qty += 1;
    saveState(appState);
    navigate(0);
  }

  function dec(productId) {
    const item = order.items.find((i) => i.productId === productId);
    if (!item) return;

    item.qty -= 1;
    if (item.qty <= 0) {
      order.items = order.items.filter((x) => x.productId !== productId);
    }

    saveState(appState);
    navigate(0);
  }

  function sendToKitchen() {
    order.sentToKitchen = true;
    saveState(appState);
    alert("Pedido enviado a cocina (simulado).");
    navigate("/mesas");
  }

  function closeTable() {
    // (solo pruebas) borrar pedido y liberar mesa
    delete appState.orders[orderId];
    table.status = "free";
    table.currentOrderId = null;
    saveState(appState);
    navigate("/mesas");
  }

  function saveCustomer() {
    order.customerName = customerName.trim();
    saveState(appState);
    alert("Cliente guardado.");
  }

  const itemsDetailed = useMemo(() => {
    return (order.items || []).map((i) => {
      const p = (appState.products || []).find((x) => x.id === i.productId);
      return {
        productId: i.productId,
        name: p?.name ?? "Producto",
        price: p?.price ?? 0,
        qty: i.qty,
        subtotal: (p?.price ?? 0) * i.qty,
      };
    });
  }, [order.items, appState.products]);

  const total = itemsDetailed.reduce((acc, x) => acc + x.subtotal, 0);

  return (
    <div className="detailPage">
      <div className="detailContainer">
        <div className="detailTop">
          <div>
            <Link to="/mesas">← Volver</Link>
            <h1>Mesa {tableId}</h1>
            <p>
              Pedido: {orderId} {order.sentToKitchen ? "• Enviado" : ""}
            </p>

            {/* Cliente */}
            <div
              style={{
                marginTop: 10,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nombre del cliente (opcional)"
                style={{
                  padding: 10,
                  borderRadius: 12,
                  border: "1px solid #e6eaf2",
                  outline: "none",
                  minWidth: 240,
                }}
              />

              <button
                onClick={saveCustomer}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #e6eaf2",
                  background: "white",
                  cursor: "pointer",
                  fontWeight: 800,
                }}
              >
                Guardar cliente
              </button>
            </div>
          </div>

          <div className="topActions">
            <button
              className="btn btnPrimary"
              onClick={sendToKitchen}
              disabled={order.items.length === 0}
            >
              Enviar a cocina
            </button>
            <button className="btn" onClick={closeTable}>
              Cerrar mesa
            </button>
          </div>
        </div>

        <div className="contentGrid">
          {/* Pedido */}
          <div className="card">
            <h2 className="cardTitle">Pedido</h2>

            <div className="scrollArea">
              {itemsDetailed.length === 0 ? (
                <p style={{ color: "#667085", fontWeight: 600 }}>
                  Aún no hay productos.
                </p>
              ) : (
                itemsDetailed.map((it) => (
                  <div className="itemRow" key={it.productId}>
                    <div>
                      <div className="itemName">{it.name}</div>
                      <div className="itemMeta">
                        {formatCOP(it.price)} • Subtotal:{" "}
                        {formatCOP(it.subtotal)}
                      </div>
                    </div>

                    <div className="qtyBox">
                      <button
                        className="qtyBtn"
                        onClick={() => dec(it.productId)}
                      >
                        -
                      </button>
                      <b>{it.qty}</b>
                      <button
                        className="qtyBtn"
                        onClick={() => inc(it.productId)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="totalRow">
              <span>Total</span>
              <span>{formatCOP(total)}</span>
            </div>
          </div>

          {/* Productos */}
          <div className="card">
            <h2 className="cardTitle">Productos</h2>

            <div className="scrollArea">
              {activeProducts.map((p) => (
                <button
                  key={p.id}
                  className="productBtn"
                  onClick={() => addProduct(p.id)}
                >
                  <div style={{ fontWeight: 900 }}>{p.name}</div>
                  <div className="itemMeta">
                    {p.category} • {formatCOP(p.price)}
                  </div>
                </button>
              ))}

              {activeProducts.length === 0 && (
                <p style={{ color: "#667085", fontWeight: 700 }}>
                  No hay productos activos.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}