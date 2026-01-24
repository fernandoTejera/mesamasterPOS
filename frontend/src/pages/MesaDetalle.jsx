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
function formatTimeHM(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}
function diffMinutes(iso) {
  if (!iso) return 0;
  const start = new Date(iso).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - start) / 60000));
}
function formatElapsed(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function MesaDetalle() {
  const { id } = useParams();
  const tableId = Number(id);
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState("");
  const [tick, setTick] = useState(0);

  // ✅ UI: búsqueda + categoría seleccionada
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("Todas");

  // ✅ UI: modal de notas por ítem
  const [noteModal, setNoteModal] = useState({
    open: false,
    productId: null,
    name: "",
    value: "",
  });

  useEffect(() => {
    const iid = setInterval(() => setTick((x) => x + 1), 1000 * 30);
    return () => clearInterval(iid);
  }, []);

  const appState = useMemo(() => {
    const raw = loadState();
    const fixed = ensureProducts(raw);
    if (raw !== fixed) saveState(fixed);
    return fixed;
  }, []);

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

  // ✅ productos activos
  const activeProducts = (appState.products || []).filter(
    (p) => p.active !== false
  );

  const categories = useMemo(() => {
    const set = new Set(activeProducts.map((p) => p.category || "Sin categoría"));
    const arr = Array.from(set).sort((a, b) => a.localeCompare(b));
    return ["Todas", ...arr];
  }, [activeProducts]);

  const productsById = useMemo(() => {
    const m = new Map();
    for (const p of activeProducts) m.set(p.id, p);
    return m;
  }, [activeProducts]);

  function getOrCreateOrderId() {
    if (table.currentOrderId) return table.currentOrderId;

    const newId = `o_${Date.now()}`;
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
      itemNotes: {}, // ✅ NUEVO: notas por productId
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

  const createdAtLabel = formatTimeHM(order?.createdAt);
  const elapsedLabel = formatElapsed(diffMinutes(order?.createdAt));

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
      // opcional: mantener nota aunque se quite del pedido (yo la limpio)
      if (order.itemNotes) delete order.itemNotes[productId];
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

  // ✅ abrir modal para notas del ítem
  function openNoteModal(productId) {
    const p = productsById.get(productId);
    const current = order?.itemNotes?.[productId] || "";
    setNoteModal({
      open: true,
      productId,
      name: p?.name ?? "Producto",
      value: current,
    });
  }

  function saveNote() {
    if (!noteModal.productId) return;
    if (!order.itemNotes) order.itemNotes = {};

    const v = noteModal.value.trim();
    if (v) order.itemNotes[noteModal.productId] = v;
    else delete order.itemNotes[noteModal.productId];

    saveState(appState);
    setNoteModal({ open: false, productId: null, name: "", value: "" });
    navigate(0);
  }

  const itemsDetailed = useMemo(() => {
    return (order.items || []).map((i) => {
      const p = productsById.get(i.productId);
      const price = p?.price ?? 0;
      const note = order?.itemNotes?.[i.productId] || "";
      return {
        productId: i.productId,
        name: p?.name ?? "Producto",
        price,
        qty: i.qty,
        subtotal: price * i.qty,
        note,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, tick]);

  const total = itemsDetailed.reduce((acc, x) => acc + x.subtotal, 0);

  // ✅ Filtrado por categoría + búsqueda
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();

    return activeProducts
      .filter((p) => {
        const cat = p.category || "Sin categoría";
        if (selectedCat !== "Todas" && cat !== selectedCat) return false;
        if (!q) return true;
        return (p.name || "").toLowerCase().includes(q);
      })
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [activeProducts, selectedCat, search]);

  return (
    <div className="detailPage">
      <div className="detailContainer">
        <div className="detailTop">
          <div>
            <Link className="backLink" to="/mesas">
              ← Volver
            </Link>

            <div className="topTitleRow">
              <h1>Mesa {tableId}</h1>
              {order?.sentToKitchen ? (
                <span className="pillSent">Enviado</span>
              ) : null}
            </div>

            <p className="topMeta">
              Pedido: <b>{orderId}</b>
              {order?.createdAt ? (
                <>
                  {" "}
                  • Inició: <b>{createdAtLabel}</b> • Tiempo:{" "}
                  <b>{elapsedLabel}</b>
                </>
              ) : null}
            </p>

            {/* Cliente + búsqueda en la misma fila (aprovecha el espacio) */}
            <div className="topInputs">
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nombre del cliente (opcional)"
                className="input"
              />

              <button className="btn" onClick={saveCustomer}>
                Guardar cliente
              </button>

              <div className="searchWrap">
                <span className="searchIcon">🔎</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar producto..."
                  className="searchInput"
                />
              </div>
            </div>
          </div>

          <div className="topActions">
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
                <p className="mutedText">Aún no hay productos.</p>
              ) : (
                itemsDetailed.map((it) => (
                  <button
                    type="button"
                    className="itemRow itemRowClickable"
                    key={it.productId}
                    onClick={() => openNoteModal(it.productId)}
                    title="Toca para agregar nota / especificación"
                  >
                    <div>
                      <div className="itemName">{it.name}</div>

                      {it.note ? (
                        <div className="noteLine">📝 {it.note}</div>
                      ) : (
                        <div className="hintLine">
                          Toca para agregar especificación
                        </div>
                      )}

                      <div className="itemMeta">
                        {formatCOP(it.price)} • Subtotal:{" "}
                        <b>{formatCOP(it.subtotal)}</b>
                      </div>
                    </div>

                    <div className="qtyBox">
                      <button
                        type="button"
                        className="qtyBtn qtyMinus"
                        onClick={(e) => {
                          e.stopPropagation();
                          dec(it.productId);
                        }}
                      >
                        −
                      </button>
                      <b className="qtyNum">{it.qty}</b>
                      <button
                        type="button"
                        className="qtyBtn qtyPlus"
                        onClick={(e) => {
                          e.stopPropagation();
                          inc(it.productId);
                        }}
                      >
                        +
                      </button>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Productos */}
          <div className="card">
            <h2 className="cardTitle">Productos</h2>

            {/* Tabs categorías */}
            <div className="catTabs">
              {categories.map((c) => (
                <button
                  key={c}
                  className={`catTab ${selectedCat === c ? "catTabActive" : ""}`}
                  onClick={() => setSelectedCat(c)}
                  type="button"
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="scrollArea">
              {activeProducts.length === 0 ? (
                <p className="mutedText">No hay productos activos.</p>
              ) : filteredProducts.length === 0 ? (
                <p className="mutedText">No hay coincidencias.</p>
              ) : (
                <div className="productsGrid">
                  {filteredProducts.map((p) => (
                    <button
                      key={p.id}
                      className="productTile"
                      onClick={() => addProduct(p.id)}
                      type="button"
                    >
                      <div className="tileTop">
                        <div className="tileBadge">
                          {(p.name || "P").slice(0, 1).toUpperCase()}
                        </div>
                        <div className="tileName">{p.name}</div>
                      </div>
                      <div className="tilePrice">{formatCOP(p.price)}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ✅ Barra inferior: total + enviar (thumb-friendly) */}
        <div className="bottomBar">
          <div className="bottomTotal">
            <div className="bottomTotalLabel">Total</div>
            <div className="bottomTotalValue">{formatCOP(total)}</div>
          </div>

          <button
            className="sendBtn"
            onClick={sendToKitchen}
            disabled={order.items.length === 0 || order.sentToKitchen}
            type="button"
          >
            {order.sentToKitchen ? "Pedido enviado" : "Enviar a cocina"}
          </button>
        </div>

        {/* ✅ Modal notas */}
        {noteModal.open && (
          <div
            className="modalOverlay"
            onClick={() =>
              setNoteModal({ open: false, productId: null, name: "", value: "" })
            }
          >
            <div className="modalCard" onClick={(e) => e.stopPropagation()}>
              <div className="modalTitle">Especificación</div>
              <div className="modalSubtitle">{noteModal.name}</div>

              <textarea
                className="modalTextarea"
                value={noteModal.value}
                onChange={(e) =>
                  setNoteModal((s) => ({ ...s, value: e.target.value }))
                }
                placeholder='Ej: "Sin hielo", "Término medio", "Salsa aparte"...'
                rows={4}
              />

              <div className="modalActions">
                <button
                  className="btn"
                  onClick={() =>
                    setNoteModal({
                      open: false,
                      productId: null,
                      name: "",
                      value: "",
                    })
                  }
                  type="button"
                >
                  Cancelar
                </button>
                <button className="btn btnGreen" onClick={saveNote} type="button">
                  Guardar
                </button>
              </div>

              <div className="modalHint">
                Tip: toca un producto del pedido para editar su nota.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
