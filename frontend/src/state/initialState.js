export function createInitialState(tableCount = 12) {
  const tables = Array.from({ length: tableCount }, (_, i) => ({
    id: String(i + 1),
    status: "free", // free | occupied
    currentOrderId: null,
  }));

  return {
    tableCount,
    tables,
    orders: {},
    sales: [], 
  };
}
