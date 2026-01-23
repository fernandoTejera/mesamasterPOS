import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadState } from "../utils/storage";
import { ensureProducts } from "../utils/ensureProducts";
import {
  FiArrowLeft,
  FiDollarSign,
  FiCreditCard,
  FiTrendingUp,
  FiUsers,
  FiShoppingBag,
  FiFileText,
} from "react-icons/fi";

function formatCOP(value) {
  return Number(value || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function inLastDays(date, days) {
  const from = new Date();
  from.setDate(from.getDate() - days);
  return date >= from;
}

function formatPrettyDate(d = new Date()) {
  return d.toLocaleDateString("es-CO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function Reportes() {
  const navigate = useNavigate();
  const raw = loadState();
  const state = ensureProducts(raw);

  const [filter, setFilter] = useState("hoy"); // hoy | semana | todo

  const allSales = useMemo(() => {
    return Array.isArray(state?.sales) ? state.sales : [];
  }, [state]);

  const products = useMemo(() => {
    // si ya tienes state.products úsalo, si no, fallback vacío
    return Array.isArray(state?.products) ? state.products : [];
  }, [state]);

  const filteredSales = useMemo(() => {
    const now = new Date();
    if (filter === "todo") return allSales;

    if (filter === "hoy") {
      return allSales.filter((s) => {
        const d = new Date(s.paidAt || s.createdAt);
        return isSameDay(d, now);
      });
    }

    return allSales.filter((s) => {
      const d = new Date(s.paidAt || s.createdAt);
      return inLastDays(d, 7);
    });
  }, [allSales, filter]);

  const kpis = useMemo(() => {
    let total = 0;
    let efectivo = 0;
    let transferencia = 0;

    const byWaiter = {}; // {name: total}
    const byProduct = {}; // {productId: qty}

    for (const s of filteredSales) {
      const t = Number(s.total || 0);
      total += t;

      const m = (s.method || "").toLowerCase();
      if (m === "transferencia") transferencia += t;
      else efectivo += t;

      const w = s.waiterName || "Sin mesero";
      byWaiter[w] = (byWaiter[w] || 0) + t;

      // productos más vendidos (qty)
      for (const it of s.items || []) {
        const pid = it.productId;
        const qty = Number(it.qty || 0);
        byProduct[pid] = (byProduct[pid] || 0) + qty;
      }
    }

    const count = filteredSales.length;
    const avgTicket = count > 0 ? total / count : 0;

    const dominantMethod =
      transferencia > efectivo
        ? { name: "Transferencia", value: transferencia }
        : { name: "Efectivo", value: efectivo };

    const topWaiters = Object.entries(byWaiter)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, total]) => ({ name, total }));

    const topProducts = Object.entries(byProduct)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([productId, qty]) => {
        const p = products.find((x) => String(x.id) === String(productId));
        return { productId, name: p?.name ?? `Producto ${productId}`, qty };
      });

    return {
      total,
      count,
      efectivo,
      transferencia,
      avgTicket,
      dominantMethod,
      topWaiters,
      topProducts,
    };
  }, [filteredSales, products]);

  const recentSales = useMemo(() => {
    return [...filteredSales]
      .sort((a, b) =>
        (a.paidAt || a.createdAt) < (b.paidAt || b.createdAt) ? 1 : -1
      )
      .slice(0, 10);
  }, [filteredSales]);

  const filterLabel =
    filter === "hoy" ? "Hoy" : filter === "semana" ? "Últimos 7 días" : "Todo";

  // estilos base
  const pageBg = "#F8FAFC";
  const border = "1px solid #E6EAF2";

  if (!state) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Reportes</h1>
        <p>No hay estado guardado.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: pageBg, minHeight: "100vh" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ color: "#667085", fontWeight: 800, fontSize: 13 }}>
            {formatPrettyDate(new Date())}
          </div>
          <h1 style={{ margin: "6px 0 0", fontSize: 28, fontWeight: 950 }}>
            Reportes
          </h1>
          <p style={{ color: "#667085", marginTop: 6 }}>
            Vista: <b>{filterLabel}</b>
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => alert("Exportar (MVP): luego lo hacemos CSV/PDF")}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border,
              background: "white",
              cursor: "pointer",
              fontWeight: 900,
              display: "flex",
              gap: 8,
              alignItems: "center",
              height: 42,
            }}
          >
            <FiFileText /> Exportar
          </button>

          <button
            type="button"
            onClick={() => navigate("/gerente")}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border,
              background: "white",
              cursor: "pointer",
              fontWeight: 900,
              display: "flex",
              gap: 8,
              alignItems: "center",
              height: 42,
            }}
          >
            <FiArrowLeft /> Volver
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div
        style={{
          marginTop: 14,
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <FilterBtn active={filter === "hoy"} onClick={() => setFilter("hoy")}>
          Hoy
        </FilterBtn>
        <FilterBtn
          active={filter === "semana"}
          onClick={() => setFilter("semana")}
        >
          Últimos 7 días
        </FilterBtn>
        <FilterBtn active={filter === "todo"} onClick={() => setFilter("todo")}>
          Todo
        </FilterBtn>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          marginTop: 14,
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        }}
      >
        <KpiCard
          title="Total vendido"
          value={formatCOP(kpis.total)}
          icon={<FiDollarSign size={18} />}
          hint="Ingresos del periodo seleccionado"
        />
        <KpiCard
          title="Transacciones"
          value={kpis.count}
          icon={<FiTrendingUp size={18} />}
          hint="Cantidad de cuentas cerradas"
        />
        <KpiCard
          title="Ticket promedio"
          value={formatCOP(kpis.avgTicket)}
          icon={<FiShoppingBag size={18} />}
          hint="Total / transacciones"
        />
        <KpiCard
          title="Método dominante"
          value={kpis.dominantMethod?.name || "—"}
          icon={<FiCreditCard size={18} />}
          hint={`Efectivo: ${formatCOP(kpis.efectivo)} • Transfer: ${formatCOP(
            kpis.transferencia
          )}`}
        />
      </div>

      {/* Body layout */}
      <div
        style={{
          marginTop: 14,
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(320 px, 1fr))",
          alignItems: "start",
        }}
      >
        {/* Left: ventas recientes */}
        <div
          style={{
            background: "white",
            border,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: 14,
              borderBottom: "1px solid #EEF2F7",
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              alignItems: "center",
            }}
          >
            <b>Ventas recientes</b>
            <span style={{ color: "#667085", fontWeight: 800, fontSize: 12 }}>
              {filterLabel} • {recentSales.length}
            </span>
          </div>

          {recentSales.length === 0 ? (
            <EmptyState />
          ) : (
            <div style={{ padding: 14, display: "grid", gap: 10 }}>
              {recentSales.map((s) => (
                <div
                  key={s.id}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid #EEF2F7",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 950 }}>
                      Mesa {s.tableId ?? "—"} • {s.method || "—"}
                    </div>
                    <div
                      style={{
                        color: "#667085",
                        fontWeight: 700,
                        fontSize: 13,
                        marginTop: 2,
                      }}
                    >
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

        {/* Right: Top meseros + productos */}
        <div style={{ display: "grid", gap: 12 }}>
          <SideCard
            title="Top meseros"
            icon={<FiUsers />}
            items={kpis.topWaiters.map((w) => ({
              label: w.name,
              value: formatCOP(w.total),
              raw: w.total,
            }))}
          />

          <SideCard
            title="Productos más vendidos"
            icon={<FiShoppingBag />}
            items={kpis.topProducts.map((p) => ({
              label: p.name,
              value: `x${p.qty}`,
              raw: p.qty,
            }))}
          />
        </div>
      </div>
    </div>
  );
}

function FilterBtn({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid #E6EAF2",
        background: active ? "#DBEAFE" : "white",
        cursor: "pointer",
        fontWeight: 900,
      }}
    >
      {children}
    </button>
  );
}

function KpiCard({ title, value, icon, hint }) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #E6EAF2",
        borderRadius: 16,
        padding: 14,
        boxShadow: "0 10px 22px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          alignItems: "center",
        }}
      >
        <div style={{ color: "#667085", fontWeight: 900, fontSize: 13 }}>
          {title}
        </div>

        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            display: "grid",
            placeItems: "center",
            background: "#EFF6FF",
            color: "#1D4ED8",
          }}
        >
          {icon}
        </div>
      </div>

      <div style={{ fontWeight: 950, fontSize: 22, marginTop: 10 }}>{value}</div>

      {hint && (
        <div style={{ color: "#667085", fontWeight: 700, marginTop: 6, fontSize: 12 }}>
          {hint}
        </div>
      )}
    </div>
  );
}

function SideCard({ title, icon, items }) {
  const max = Math.max(...items.map((i) => i.raw || 0), 1);

  return (
    <div
      style={{
        background: "white",
        border: "1px solid #E6EAF2",
        borderRadius: 16,
        padding: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          alignItems: "center",
        }}
      >
        <b>{title}</b>
        <div style={{ color: "#667085" }}>{icon}</div>
      </div>

      {items.length === 0 ? (
        <div style={{ color: "#667085", fontWeight: 800, marginTop: 10 }}>
          Sin datos en este periodo.
        </div>
      ) : (
        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {items.map((it) => {
            const pct = Math.round(((it.raw || 0) / max) * 100);
            return (
              <div key={it.label}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    fontWeight: 900,
                  }}
                >
                  <span style={{ color: "#111827" }}>{it.label}</span>
                  <span style={{ color: "#667085" }}>{it.value}</span>
                </div>

                <div
                  style={{
                    marginTop: 6,
                    height: 10,
                    borderRadius: 999,
                    background: "#EEF2F7",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      background: "#2563EB",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ padding: 18, color: "#667085", fontWeight: 800 }}>
      <div style={{ fontSize: 18, fontWeight: 950, color: "#111827" }}>
        ¡Día nuevo, metas nuevas!
      </div>
      <div style={{ marginTop: 6 }}>
        Las ventas aparecerán aquí en cuanto se registre el primer cobro.
      </div>
    </div>
  );
}