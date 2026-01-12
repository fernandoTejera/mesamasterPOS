import { useNavigate } from "react-router-dom";
import { logout } from "../auth/auth";

export default function Mesas() {
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div style={{ padding: 24 }}>
      <button onClick={handleLogout}>Cerrar sesión</button>

      <h1>Mesas</h1>
      <p>Panel del Mesero (aquí se gestionan mesas y pedidos).</p>
    </div>
  );
}
