import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../auth/auth";
import "./mesas.css";
import { loadState, saveState } from "../utils/storage";
import { createInitialState } from "../state/initialState";

export default function Mesas() {
  const navigate = useNavigate();

  // Cargar estado desde localStorage o crear uno nuevo
  const [appState, setAppState] = useState(() => {
    const saved = loadState();
    return saved ?? createInitialState(12);
  });

  // Guardar en localStorage cada vez que cambie
  useEffect(() => {
    saveState(appState);
  }, [appState]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function openTable(tableId) {
    navigate(`/mesas/${tableId}`);
  }

  const tables = useMemo(() => appState.tables, [appState.tables]);

  return (
    <div className="mesasPage">
      <div className="mesasContainer">
        <div className="mesasHeader">
          <div className="mesasTitleBlock">
            <h1 className="mesasTitle">MesaMaster POS</h1>
            <p className="mesasSubtitle">
              Mesero • Selecciona una mesa para ver o crear pedidos
            </p>
          </div>

          <button className="logoutBtn" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>

        <div className="mesasGrid">
          {tables.map((t) => {
            const clientName = t.status === "occupied" ? "Cliente" : "";
            const timeLabel = t.status === "occupied" ? "12:34" : "";

            return (
              <button
                key={t.id}
                className={`tableCard ${
                  t.status === "free" ? "tableFree" : "tableOccupied"
                }`}
                onClick={() => openTable(t.id)}
              >
                <div className="tableNumber">Mesa {t.id}</div>

                {t.status === "occupied" && (
                  <div className="tableMeta">
                    <div>{timeLabel}</div>
                    <div>{clientName}</div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
