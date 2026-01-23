import { loadState } from "../utils/storage";
import { ensureProducts } from "../utils/ensureProducts";
import { summarizeSales } from "../utils/reports";
import { useNavigate } from "react-router-dom";
import { logout } from "../auth/auth";
import {
  FiShoppingCart,
  FiBox,
  FiUsers,
  FiBarChart2,
  FiGrid,
  FiLogOut,
  FiUser,
} from "react-icons/fi";
import "./gerente.css";

const cardStyle = {
  background: "white",
  border: "1px solid #e6eaf2",
  borderRadius: 16,
  padding: 14,
  boxShadow: "0 10px 22px rgba(0,0,0,0.04)",
};

const cardLabel = { color: "#667085", fontWeight: 800, fontSize: 13 };
const cardValue = { fontWeight: 950, fontSize: 22, marginTop: 6 };
const cardMeta = {
  color: "#667085",
  fontWeight: 700,
  marginTop: 6,
  fontSize: 12,
};

function formatCOP(value) {
  return Number(value || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

export default function Gerente() {
  const navigate = useNavigate();

  const raw = loadState();
  const state = ensureProducts(raw);
  const summary = summarizeSales(state);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="dashboardPage">
      {/* Header */}
      <header className="dashboardHeader">
        <div className="dashboardTitleBlock">
          <h1 className="dashboardTitle">Panel del Gerente</h1>
          <p className="dashboardSubtitle">
            Bienvenido de nuevo, selecciona una gestión:
          </p>
        </div>

        <button className="profileBtn" type="button" aria-label="Perfil">
          <FiUser size={20} />
        </button>
      </header>

      {/* KPIs */}
      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          marginTop: 14,
        }}
      >
        <div style={cardStyle}>
          <div style={cardLabel}>Ventas hoy</div>
          <div style={cardValue}>{formatCOP(summary.totalToday)}</div>
          <div style={cardMeta}>
            Efectivo: {formatCOP(summary.cashToday)} • Transfer:{" "}
            {formatCOP(summary.transferToday)}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={cardLabel}>Ventas totales</div>
          <div style={cardValue}>{formatCOP(summary.totalAll)}</div>
          <div style={cardMeta}>Transacciones: {summary.salesCount}</div>
        </div>

        <div style={cardStyle}>
          <div style={cardLabel}>Top mesero</div>
          <div style={cardValue}>{summary.topWaiterName}</div>
          <div style={cardMeta}>{formatCOP(summary.topWaiterTotal)}</div>
        </div>
      </div>

      {/* Grid de acciones */}
      <section className="dashboardGrid">
        <ActionCard
          icon={<FiShoppingCart size={32} />}
          label="Caja / Cobros"
          onClick={() => navigate("/caja")}
        />

        <ActionCard
          icon={<FiBox size={32} />}
          label="Productos"
          onClick={() => navigate("/productos")}
        />

        <ActionCard
          icon={<FiUsers size={32} />}
          label="Usuarios"
          onClick={() => navigate("/usuarios")}
        />

        <ActionCard
          icon={<FiBarChart2 size={32} />}
          label="Reportes"
          onClick={() => navigate("/reportes")}
        />

        <ActionCard
          icon={<FiGrid size={32} />}
          label="Configurar mesas"
          onClick={() => navigate("/config-mesas")}
        />

        <ActionCard
          icon={<FiLogOut size={32} />}
          label="Cerrar sesión"
          onClick={handleLogout}
          danger
        />
      </section>

      {/* Resumen del día (YA conectado a summary ✅) */}
      <section className="summaryCard">
        <h3 className="summaryTitle">Resumen del día</h3>

        <div className="summaryRow">
          <span className="summaryLabel">Ventas hoy</span>
          <span className="summaryValue">{formatCOP(summary.totalToday)}</span>
        </div>

        <div className="summaryRow">
          <span className="summaryLabel">Transacciones</span>
          <span className="summaryValue">{summary.salesTodayCount}</span>
        </div>

        <div className="summaryRow">
          <span className="summaryLabel">Efectivo</span>
          <span className="summaryValue">{formatCOP(summary.cashToday)}</span>
        </div>

        <div className="summaryRow">
          <span className="summaryLabel">Transferencia</span>
          <span className="summaryValue">{formatCOP(summary.transferToday)}</span>
        </div>
      </section>
    </div>
  );
}

function ActionCard({ icon, label, onClick, danger, disabled, note }) {
  return (
    <button
      className={`actionCard ${danger ? "danger" : ""}`}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      <div className="actionIcon">{icon}</div>
      <div className="actionLabel">{label}</div>
      {note && <div className="actionNote">{note}</div>}
    </button>
  );
}
