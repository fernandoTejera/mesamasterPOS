import { PRODUCTS } from "../data/products";

export function ensureProducts(state) {
  if (!state) return state;

  // Si ya hay productos en el estado, no tocar
  if (Array.isArray(state.products) && state.products.length > 0) return state;

  // Si no existe, lo inicializamos desde PRODUCTS
  state.products = PRODUCTS.map((p) => ({
    ...p,
    active: true, // importante para desactivar en vez de borrar
  }));

  return state;
}