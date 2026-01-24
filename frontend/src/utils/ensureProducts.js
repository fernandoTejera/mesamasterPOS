import { PRODUCTS } from "../data/products";

/**
 * Asegura que el estado tenga products.
 * - Si state es null/undefined: crea uno mínimo.
 * - Si state.products no existe o está vacío: lo inicializa con PRODUCTS (data/demo).
 * - Devuelve un NUEVO objeto si hubo cambios (para poder guardar).
 */
export function ensureProducts(state) {
  // Si no hay state, crea uno básico
  if (!state) {
    return {
      tables: [],
      orders: {},
      sales: [],
      products: PRODUCTS.map((p) => ({ ...p })),
    };
  }

  let changed = false;
  const next = { ...state };

  // products
  if (!Array.isArray(next.products) || next.products.length === 0) {
    next.products = PRODUCTS.map((p) => ({ ...p }));
    changed = true;
  }

  // orders
  if (!next.orders || typeof next.orders !== "object") {
    next.orders = {};
    changed = true;
  }

  // sales
  if (!Array.isArray(next.sales)) {
    next.sales = [];
    changed = true;
  }

  // tables (si no existe)
  if (!Array.isArray(next.tables)) {
    next.tables = [];
    changed = true;
  }
  // categories
  if (!Array.isArray(next.categories) || next.categories.length === 0) {
    const uniq = Array.from(
      new Set((next.products || []).map((p) => p.category).filter(Boolean))
    );
    next.categories = uniq.length ? uniq : ["Comidas", "Bebidas"];
    changed = true;
  }

  // ✅ kitchenTickets (comandas FIFO)
  if (!Array.isArray(next.kitchenTickets)) {
    next.kitchenTickets = [];
    changed = true;
  }

  return changed ? next : state;
}