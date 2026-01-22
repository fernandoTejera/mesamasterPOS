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

export default function Gerente() {
  const navigate = useNavigate();

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

      {/* Resumen del día (placeholder por ahora, luego lo conectamos a state.sales) */}
      <section className="summaryCard">
        <h3 className="summaryTitle">Resumen del día</h3>
        <div className="summaryRow">
          <span className="summaryLabel">Ventas hoy</span>
          <span className="summaryValue">$ 0</span>
        </div>
        <div className="summaryRow">
          <span className="summaryLabel">Transacciones</span>
          <span className="summaryValue">0</span>
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
