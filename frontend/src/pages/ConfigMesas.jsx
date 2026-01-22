import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadState, saveState } from "../utils/storage";
import { ensureProducts } from "../utils/ensureProducts";

const stateRaw = loadState();
const state = ensureProducts(stateRaw);
if (stateRaw !== state) saveState(state); // guarda si se inicializó
export default function ConfigMesas() {
  const navigate = useNavigate();
  const state = loadState();

  const [msg, setMsg] = useState("");
  const [value, setValue] = useState(() => {
    const count = state?.tables?.length || 0;
    return count || 12;
  });

  const tables = useMemo(() => state?.tables || [], [state]);

  const occupiedIds = useMemo(() => {
    return tables.filter((t) => t.status === "occupied").map((t) => t.id);
  }, [tables]);

  if (!state) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Config Mesas</h1>
        <p>No hay estado guardado.</p>
      </div>
    );
  }

  function apply() {
    setMsg("");

    const newCount = Number(value);
    if (!Number.isFinite(newCount) || newCount < 1 || newCount > 200) {
      setMsg("Ingresa un número válido (1 a 200).");
      return;
    }

    const currentCount = tables.length;

    // Si va a reducir
    if (newCount < currentCount) {
      // Mesas que se perderían: (newCount+1 ... currentCount)
      const removed = tables.filter((t) => Number(t.id) > newCount);

      // Regla MVP: no permitir reducir si alguna de las que se eliminarían está ocupada
      const hasOccupied = removed.some((t) => t.status === "occupied");
      if (hasOccupied) {
        setMsg(
          "No se puede reducir: hay mesas ocupadas dentro del rango que se eliminaría.",
        );
        return;
      }

      state.tables = tables.filter((t) => Number(t.id) <= newCount);
      state.tableCount = newCount;
      saveState(state);
      setMsg("✅ Mesas actualizadas.");
      return;
    }

    // Si va a aumentar
    if (newCount > currentCount) {
      const next = [...tables];
      for (let i = currentCount + 1; i <= newCount; i++) {
        next.push({
          id: i,
          status: "free",
          currentOrderId: null,
        });
      }
      state.tables = next;
      state.tableCount = newCount;
      saveState(state);
      setMsg("✅ Mesas actualizadas.");
      return;
    }

    setMsg("Ya tienes esa cantidad de mesas.");
  }

  return (
    <div style={{ padding: 24, background: "#f6f8fc", minHeight: "100vh" }}>
      <div
        style={{ display: "flex", justifyContent: "space-between", gap: 12 }}
      >
        <div>
          <h1 style={{ marginTop: 0 }}>Configuración de Mesas</h1>
          <p style={{ color: "#667085", marginTop: 4 }}>
            Ajusta la cantidad de mesas del restaurante.
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
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          alignItems: "start",
        }}
      >
        <div
          style={{
            background: "white",
            border: "1px solid #e6eaf2",
            borderRadius: 16,
            padding: 16,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Cantidad de mesas</h2>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              min={1}
              max={200}
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid #e6eaf2",
                outline: "none",
                width: 160,
                fontWeight: 800,
              }}
            />

            <button
              onClick={apply}
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid #2563eb",
                background: "#2563eb",
                color: "white",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Guardar
            </button>
          </div>

          <div style={{ marginTop: 12, color: "#667085", fontWeight: 700 }}>
            Mesas actuales: <b>{tables.length}</b>
          </div>

          {occupiedIds.length > 0 && (
            <div style={{ marginTop: 10, color: "#667085", fontWeight: 700 }}>
              Ocupadas: <b>{occupiedIds.join(", ")}</b>
            </div>
          )}

          {msg && (
            <p style={{ marginTop: 12, fontWeight: 800, color: "#14532d" }}>
              {msg}
            </p>
          )}

          <div
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 12,
              background: "#f8fafc",
              border: "1px dashed #e6eaf2",
              color: "#667085",
              fontWeight: 700,
            }}
          >
            Regla MVP: solo se permite reducir si las mesas que se eliminarían
            están libres.
          </div>
        </div>

        <div
          style={{
            background: "white",
            border: "1px solid #e6eaf2",
            borderRadius: 16,
            padding: 16,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Vista previa</h2>
          <p style={{ color: "#667085", fontWeight: 700 }}>
            Esto afecta la cantidad de tarjetas en la vista de Mesas.
          </p>

          <div
            style={{
              marginTop: 12,
              display: "grid",
              gap: 10,
              gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))",
            }}
          >
            {Array.from({ length: Math.min(Number(value) || 0, 24) }).map(
              (_, idx) => (
                <div
                  key={idx}
                  style={{
                    height: 60,
                    borderRadius: 12,
                    border: "1px solid #e6eaf2",
                    background: "white",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 900,
                    color: "#2563eb",
                  }}
                >
                  {idx + 1}
                </div>
              ),
            )}
          </div>

          {(Number(value) || 0) > 24 && (
            <p style={{ marginTop: 10, color: "#667085", fontWeight: 700 }}>
              Mostrando solo 24 en vista previa.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
