export function parseISODate(iso) {
  try {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export function isSameDay(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function summarizeSales(state) {
  const sales = Array.isArray(state?.sales) ? state.sales : [];
  const now = new Date();

  let totalAll = 0;
  let totalToday = 0;
  let salesTodayCount = 0;

  let cashToday = 0;
  let transferToday = 0;

  const byWaiter = {}; // { name: total }

  for (const s of sales) {
    const total = Number(s.total || 0);
    totalAll += total;

    const paidAt = parseISODate(s.paidAt || s.createdAt);
    const isToday = paidAt ? isSameDay(paidAt, now) : false;

    if (isToday) {
      totalToday += total;
      salesTodayCount += 1;

      if (s.method === "transferencia") transferToday += total;
      else cashToday += total;
    }

    const waiter = s.waiterName || "Sin mesero";
    byWaiter[waiter] = (byWaiter[waiter] || 0) + total;
  }

  const topWaiter = Object.entries(byWaiter).sort((a, b) => b[1] - a[1])[0] || null;

  return {
    totalAll,
    totalToday,
    cashToday,
    transferToday,
    topWaiterName: topWaiter ? topWaiter[0] : "—",
    topWaiterTotal: topWaiter ? topWaiter[1] : 0,
    salesCount: sales.length,
    salesTodayCount,
  };
}

/* =========================
   ✅ DÍA 12: REPORTES PRO
   ========================= */

function safeDate(iso) {
  const d = parseISODate(iso);
  return d ?? new Date(0);
}

export function rangePresets() {
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
  const endOfYesterday = new Date(startOfToday.getTime() - 1);

  const startOf7Days = new Date(startOfToday.getTime() - 6 * 86400000);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  return {
    hoy: { label: "Hoy", start: startOfToday, end: endOfToday },
    ayer: { label: "Ayer", start: startOfYesterday, end: endOfYesterday },
    ult7: { label: "Últimos 7 días", start: startOf7Days, end: endOfToday },
    mes: { label: "Este mes", start: startOfMonth, end: endOfMonth },
  };
}

export function inRange(iso, start, end) {
  const d = safeDate(iso);
  return d >= start && d <= end;
}

/**
 * buildReport(state, presetKey)
 * Devuelve KPIs + breakdowns para UI de Reportes:
 * - total, count, avgTicket
 * - byMethod, byWaiter, byCategory, topProducts
 */
export function buildReport(state, presetKey = "hoy") {
  const presets = rangePresets();
  const preset = presets[presetKey] || presets.hoy;

  const salesRaw = Array.isArray(state?.sales) ? state.sales : [];
  const sales = salesRaw.filter((s) => inRange(s.paidAt || s.createdAt, preset.start, preset.end));

  const total = sales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
  const count = sales.length;
  const avgTicket = count ? Math.round(total / count) : 0;

  // breakdowns
  const byMethod = {};   // { efectivo: total, transferencia: total }
  const byWaiter = {};   // { name: total }
  const byCategory = {}; // { category: total }
  const byProduct = {};  // { productName: total }

  const products = Array.isArray(state?.products) ? state.products : [];
  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const s of sales) {
    const saleTotal = Number(s.total) || 0;

    const method = s.method || "desconocido";
    byMethod[method] = (byMethod[method] || 0) + saleTotal;

    const waiter = s.waiterName || "Sin mesero";
    byWaiter[waiter] = (byWaiter[waiter] || 0) + saleTotal;

    for (const it of s.items || []) {
      const p = productMap.get(it.productId);
      const name = p?.name || "Producto";
      const cat = p?.category || "Sin categoría";
      const price = Number(p?.price) || 0;
      const qty = Number(it.qty) || 0;
      const lineTotal = price * qty;

      byProduct[name] = (byProduct[name] || 0) + lineTotal;
      byCategory[cat] = (byCategory[cat] || 0) + lineTotal;
    }
  }

  const toSorted = (obj) =>
    Object.entries(obj)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

  return {
    preset,
    sales,
    kpis: { total, count, avgTicket },
    byMethod: toSorted(byMethod),
    byWaiter: toSorted(byWaiter),
    byCategory: toSorted(byCategory),
    topProducts: toSorted(byProduct).slice(0, 10),
  };
}
