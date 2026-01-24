import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import { loadState } from "../utils/storage";
import { ensureProducts } from "../utils/ensureProducts";
import { buildReport, rangePresets } from "../utils/reports";
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

function formatPrettyDate(d = new Date()) {
  return d.toLocaleDateString("es-CO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function prettyMethod(name) {
  if (name === "transferencia") return "Transferencia";
  if (name === "efectivo") return "Efectivo";
  if (!name) return "—";
  // Capitaliza primera letra para otros casos
  return String(name).charAt(0).toUpperCase() + String(name).slice(1);
}

export default function Reportes() {
  const navigate = useNavigate();
  const raw = loadState();
  const state = ensureProducts(raw);

  // ✅ Filtros PRO
  const [filter, setFilter] = useState("hoy"); // hoy | ayer | ult7 | mes

  const presets = useMemo(() => rangePresets(), []);
  const report = useMemo(() => buildReport(state || {}, filter), [state, filter]);

  const kpis = report.kpis;

  const dominantMethod = useMemo(() => {
    const arr = report.byMethod || [];
    if (arr.length === 0) return { name: "—", value: 0 };
    const top = arr[0];
    return { name: prettyMethod(top.name), value: top.value };
  }, [report.byMethod]);

  const efectivo = useMemo(() => {
    const found = (report.byMethod || []).find((x) => x.name === "efectivo");
    return found ? found.value : 0;
  }, [report.byMethod]);

  const transferencia = useMemo(() => {
    const found = (report.byMethod || []).find((x) => x.name === "transferencia");
    return found ? found.value : 0;
  }, [report.byMethod]);

  // Ventas recientes (últimas 10 dentro del rango)
  const recentSales = useMemo(() => {
    const arr = [...(report.sales || [])];
    arr.sort(
      (a, b) => new Date(b.paidAt || b.createdAt) - new Date(a.paidAt || a.createdAt)
    );
    return arr.slice(0, 10);
  }, [report.sales]);

  const filterLabel = presets?.[filter]?.label || "Hoy";

  // estilos base
  const pageBg = "#F8FAFC";
  const border = "1px solid #E6EAF2";

  function exportXLSX() {
    const label = report?.preset?.label || "Reporte";
    const dateTag = new Date().toISOString().slice(0, 10);
    const fileName = `MesaMaster_${label.replaceAll(" ", "_")}_${dateTag}.xlsx`;

    const money = (n) => Number(n || 0);
    const prettyDate = (iso) => (iso ? new Date(iso).toLocaleString("es-CO") : "");

    // 1) Hoja RESUMEN
    const resumen = [
      ["Reporte", label],
      ["Generado", new Date().toLocaleString("es-CO")],
      [],
      ["Total vendido", money(report.kpis.total)],
      ["Transacciones", report.kpis.count],
      ["Ticket promedio", money(report.kpis.avgTicket)],
    ];

    const ef = (report.byMethod || []).find((x) => x.name === "efectivo")?.value || 0;
    const tr =
      (report.byMethod || []).find((x) => x.name === "transferencia")?.value || 0;
    resumen.push(["Efectivo", money(ef)]);
    resumen.push(["Transferencia", money(tr)]);

    // 2) Hoja METODOS
    const metodos = [
      ["Método", "Total"],
      ...(report.byMethod || []).map((x) => [prettyMethod(x.name), money(x.value)]),
    ];

    // 3) Hoja MESEROS
    const meseros = [
      ["Mesero", "Total"],
      ...(report.byWaiter || []).map((x) => [x.name, money(x.value)]),
    ];

    // 4) Hoja CATEGORIAS
    const categorias = [
      ["Categoría", "Total"],
      ...(report.byCategory || []).map((x) => [x.name, money(x.value)]),
    ];

    // 5) Hoja TOP_PRODUCTOS
    const topProductos = [
      ["Producto", "Total"],
      ...(report.topProducts || []).map((x) => [x.name, money(x.value)]),
    ];

    // 6) Hoja DETALLE (ventas + items + notas)
    const productMap = new Map((state?.products || []).map((p) => [String(p.id), p]));

    const detalle = [
      ["VentaId", "FechaPago", "Mesa", "Mesero", "Cliente", "Método", "Total", "Items", "Notas"],
      ...(report.sales || []).map((s) => {
        const itemsTxt = (s.items || [])
          .map((it) => {
            const p = productMap.get(String(it.productId));
            const name = p?.name || `Producto ${it.productId}`;
            return `${name} x${it.qty}`;
          })
          .join(" | ");

        const notesTxt = Object.entries(s.itemNotes || {})
          .map(([pid, note]) => {
            const p = productMap.get(String(pid));
            const name = p?.name || `Producto ${pid}`;
            const clean = String(note || "").trim();
            return clean ? `${name}: ${clean}` : "";
          })
          .filter(Boolean)
          .join(" | ");

        return [
          s.id || "",
          prettyDate(s.paidAt || s.createdAt),
          s.tableId ?? "",
          s.waiterName || "",
          s.customerName || "",
          prettyMethod(s.method || ""),
          money(s.total),
          itemsTxt,
          notesTxt,
        ];
      }),
    ];

    // Workbook
    const wb = XLSX.utils.book_new();

    const wsResumen = XLSX.utils.aoa_to_sheet(resumen);
    const wsMetodos = XLSX.utils.aoa_to_sheet(metodos);
    const wsMeseros = XLSX.utils.aoa_to_sheet(meseros);
    const wsCategorias = XLSX.utils.aoa_to_sheet(categorias);
    const wsTop = XLSX.utils.aoa_to_sheet(topProductos);
    const wsDetalle = XLSX.utils.aoa_to_sheet(detalle);

    // Auto ancho columnas
    const autoWidth = (ws, data) => {
      const cols = (data[0] || []).map((_, i) => {
        const max = data.reduce((acc, row) => {
          const v = row[i] ?? "";
          return Math.max(acc, String(v).length);
        }, 10);
        return { wch: Math.min(Math.max(max + 2, 12), 60) };
      });
      ws["!cols"] = cols;
    };

    autoWidth(wsResumen, resumen);
    autoWidth(wsMetodos, metodos);
    autoWidth(wsMeseros, meseros);
    autoWidth(wsCategorias, categorias);
    autoWidth(wsTop, topProductos);
    autoWidth(wsDetalle, detalle);

    XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");
    XLSX.utils.book_append_sheet(wb, wsMetodos, "Métodos");
    XLSX.utils.book_append_sheet(wb, wsMeseros, "Meseros");
    XLSX.utils.book_append_sheet(wb, wsCategorias, "Categorías");
    XLSX.utils.book_append_sheet(wb, wsTop, "Top productos");
    XLSX.utils.book_append_sheet(wb, wsDetalle, "Detalle");

    XLSX.writeFile(wb, fileName);
  }

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
            onClick={exportXLSX}
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
            <FiFileText /> Exportar Excel
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
      <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <FilterBtn active={filter === "hoy"} onClick={() => setFilter("hoy")}>
          Hoy
        </FilterBtn>
        <FilterBtn active={filter === "ayer"} onClick={() => setFilter("ayer")}>
          Ayer
        </FilterBtn>
        <FilterBtn active={filter === "ult7"} onClick={() => setFilter("ult7")}>
          Últimos 7 días
        </FilterBtn>
        <FilterBtn active={filter === "mes"} onClick={() => setFilter("mes")}>
          Este mes
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
          value={dominantMethod.name}
          icon={<FiCreditCard size={18} />}
          hint={`Efectivo: ${formatCOP(efectivo)} • Transfer: ${formatCOP(transferencia)}`}
        />
      </div>

      {/* Body layout */}
      <div
        style={{
          marginTop: 14,
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          alignItems: "start",
        }}
      >
        {/* Left: ventas recientes */}
        <div style={{ background: "white", border, borderRadius: 16, overflow: "hidden" }}>
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
                      Mesa {s.tableId ?? "—"} • {prettyMethod(s.method || "—")}
                    </div>
                    <div style={{ color: "#667085", fontWeight: 700, fontSize: 13, marginTop: 2 }}>
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

        {/* Right: breakdowns */}
        <div style={{ display: "grid", gap: 12 }}>
          <SideCard
            title="Top meseros"
            icon={<FiUsers />}
            items={(report.byWaiter || []).slice(0, 5).map((w) => ({
              label: w.name,
              value: formatCOP(w.value),
              raw: w.value,
            }))}
          />

          <SideCard
            title="Top productos (por $ vendido)"
            icon={<FiShoppingBag />}
            items={(report.topProducts || []).slice(0, 7).map((p) => ({
              label: p.name,
              value: formatCOP(p.value),
              raw: p.value,
            }))}
          />

          <SideCard
            title="Por categoría (por $ vendido)"
            icon={<FiTrendingUp />}
            items={(report.byCategory || []).map((c) => ({
              label: c.name,
              value: formatCOP(c.value),
              raw: c.value,
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
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
        <div style={{ color: "#667085", fontWeight: 900, fontSize: 13 }}>{title}</div>
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
        <div style={{ color: "#667085", fontWeight: 700, marginTop: 6, fontSize: 12 }}>{hint}</div>
      )}
    </div>
  );
}

function SideCard({ title, icon, items }) {
  const max = Math.max(...(items || []).map((i) => i.raw || 0), 1);

  return (
    <div style={{ background: "white", border: "1px solid #E6EAF2", borderRadius: 16, padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
        <b>{title}</b>
        <div style={{ color: "#667085" }}>{icon}</div>
      </div>

      {items.length === 0 ? (
        <div style={{ color: "#667085", fontWeight: 800, marginTop: 10 }}>Sin datos en este periodo.</div>
      ) : (
        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {items.map((it) => {
            const pct = Math.round(((it.raw || 0) / max) * 100);
            return (
              <div key={it.label}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontWeight: 900 }}>
                  <span style={{ color: "#111827" }}>{it.label}</span>
                  <span style={{ color: "#667085" }}>{it.value}</span>
                </div>

                <div style={{ marginTop: 6, height: 10, borderRadius: 999, background: "#EEF2F7", overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: "#2563EB" }} />
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
      <div style={{ fontSize: 18, fontWeight: 950, color: "#111827" }}>¡Día nuevo, metas nuevas!</div>
      <div style={{ marginTop: 6 }}>Las ventas aparecerán aquí en cuanto se registre el primer cobro.</div>
    </div>
  );
}
