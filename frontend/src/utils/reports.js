export function parseISODate(iso) {
  try {
    return new Date(iso);
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

  const topWaiter = Object.entries(byWaiter)
    .sort((a, b) => b[1] - a[1])[0] || null;

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