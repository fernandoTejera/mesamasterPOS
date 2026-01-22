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

export default function Productos() {
  const navigate = useNavigate();
  const [refresh, setRefresh] = useState(0);

  const stateRaw = loadState();
  const state = ensureProducts(stateRaw);
  if (stateRaw !== state) saveState(state);

  const [q, setQ] = useState("");
  const [onlyActive, setOnlyActive] = useState(true);

  const [form, setForm] = useState({
    id: null,
    name: "",
    price: "",
    category: "",
    active: true,
  });

  const [msg, setMsg] = useState("");

  const products = useMemo(() => {
    const list = state?.products || [];
    const filtered = list.filter((p) => {
      const match =
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        (p.category || "").toLowerCase().includes(q.toLowerCase());
      const activeOk = onlyActive ? p.active !== false : true;
      return match && activeOk;
    });

    // activos primero
    filtered.sort((a, b) => (a.active === b.active ? 0 : a.active ? -1 : 1));
    return filtered;
  }, [state, q, onlyActive, refresh]);

  if (!state) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Productos</h1>
        <p>No hay estado guardado.</p>
      </div>
    );
  }

  function resetForm() {
    setForm({ id: null, name: "", price: "", category: "", active: true });
  }

  function openNew() {
    setMsg("");
    resetForm();
  }

  function openEdit(p) {
    setMsg("");
    setForm({
      id: p.id,
      name: p.name || "",
      price: String(p.price ?? ""),
      category: p.category || "",
      active: p.active !== false,
    });
  }

  function saveProduct() {
    setMsg("");

    const name = form.name.trim();
    const category = form.category.trim();
    const priceNum = Number(form.price);

    if (!name) return setMsg("El nombre es obligatorio.");
    if (!category) return setMsg("La categoría es obligatoria.");
    if (!Number.isFinite(priceNum) || priceNum <= 0)
      return setMsg("El precio debe ser un número mayor a 0.");

    const list = Array.isArray(state.products) ? state.products : [];
    const isEdit = !!form.id;

    if (isEdit) {
      const idx = list.findIndex((x) => x.id === form.id);
      if (idx === -1) return setMsg("Producto no encontrado.");
      list[idx] = {
        ...list[idx],
        name,
        category,
        price: priceNum,
        active: form.active,
      };
    } else {
      const newId = `p_${Date.now()}`;
      list.push({
        id: newId,
        name,
        category,
        price: priceNum,
        active: true,
      });
    }

    state.products = list;
    saveState(state);
    setRefresh((x) => x + 1);
    setMsg("✅ Guardado.");
    resetForm();
  }

  function toggleActive(productId) {
    const list = state.products || [];
    const p = list.find((x) => x.id === productId);
    if (!p) return;

    p.active = !(p.active !== false);
    saveState(state);
    setRefresh((x) => x + 1);
  }

  return (
    <div style={{ padding: 24, background: "#f6f8fc", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ marginTop: 0 }}>Productos</h1>
          <p style={{ color: "#667085", marginTop: 4 }}>
            Crea, edita o desactiva productos del menú.
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

      <div
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: "1fr 380px",
          gap: 16,
          alignItems: "start",
        }}
      >
        {/* LISTA */}
        <div
          style={{
            background: "white",
            border: "1px solid #e6eaf2",
            borderRadius: 16,
            padding: 16,
          }}
        >
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre o categoría..."
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid #e6eaf2",
                outline: "none",
                flex: 1,
                minWidth: 220,
              }}
            />

            <button
              onClick={() => setOnlyActive((x) => !x)}
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid #e6eaf2",
                background: onlyActive ? "#dbeafe" : "white",
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              {onlyActive ? "Solo activos" : "Todos"}
            </button>

            <button
              onClick={openNew}
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid #2563eb",
                background: "#2563eb",
                color: "white",
                cursor: "pointer",
                fontWeight: 900,
              }}
            >
              + Nuevo
            </button>
          </div>

          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {products.length === 0 ? (
              <div
                style={{
                  padding: 14,
                  borderRadius: 12,
                  border: "1px dashed #e6eaf2",
                  color: "#667085",
                  fontWeight: 700,
                }}
              >
                No hay productos para mostrar.
              </div>
            ) : (
              products.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid #eef2f7",
                    opacity: p.active === false ? 0.6 : 1,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 900 }}>{p.name}</div>
                    <div style={{ color: "#667085", fontWeight: 700 }}>
                      {p.category} • {formatCOP(p.price)}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button
                      onClick={() => openEdit(p)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 12,
                        border: "1px solid #e6eaf2",
                        background: "white",
                        cursor: "pointer",
                        fontWeight: 800,
                      }}
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => toggleActive(p.id)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 12,
                        border: "1px solid #e6eaf2",
                        background: p.active === false ? "#dcfce7" : "#fee2e2",
                        cursor: "pointer",
                        fontWeight: 900,
                      }}
                    >
                      {p.active === false ? "Activar" : "Desactivar"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* FORM */}
        <div
          style={{
            background: "white",
            border: "1px solid #e6eaf2",
            borderRadius: 16,
            padding: 16,
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            {form.id ? "Editar producto" : "Nuevo producto"}
          </h2>

          <div style={{ display: "grid", gap: 10 }}>
            <input
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              placeholder="Nombre"
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid #e6eaf2",
                outline: "none",
              }}
            />

            <input
              value={form.category}
              onChange={(e) =>
                setForm((s) => ({ ...s, category: e.target.value }))
              }
              placeholder="Categoría (ej: Comida, Bebidas)"
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid #e6eaf2",
                outline: "none",
              }}
            />

            <input
              value={form.price}
              onChange={(e) =>
                setForm((s) => ({ ...s, price: e.target.value }))
              }
              placeholder="Precio (COP)"
              inputMode="numeric"
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid #e6eaf2",
                outline: "none",
              }}
            />

            {form.id && (
              <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, active: e.target.checked }))
                  }
                />
                <span style={{ fontWeight: 800, color: "#111827" }}>
                  Activo
                </span>
              </label>
            )}

            <button
              onClick={saveProduct}
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid #2563eb",
                background: "#2563eb",
                color: "white",
                cursor: "pointer",
                fontWeight: 900,
              }}
            >
              Guardar
            </button>

            {msg && (
              <p style={{ margin: 0, fontWeight: 800, color: "#14532d" }}>
                {msg}
              </p>
            )}

            <div
              style={{
                padding: 12,
                borderRadius: 12,
                background: "#f8fafc",
                border: "1px dashed #e6eaf2",
                color: "#667085",
                fontWeight: 700,
              }}
            >
              Recomendación: Desactiva productos en vez de borrarlos.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}