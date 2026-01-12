import { Navigate } from "react-router-dom";
import { isLoggedIn, getUserRole } from "./auth";

export default function RoleRoute({ allow, children }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;

  const role = getUserRole();

  // Si el token está raro o no tiene rol, mejor sacar al usuario
  if (!role) return <Navigate to="/login" replace />;

  // Si el rol no está permitido, lo mandamos a su panel
  if (!allow.includes(role)) {
    if (role === "mesero") return <Navigate to="/mesas" replace />;
    if (role === "cocina") return <Navigate to="/cocina" replace />;
    if (role === "gerente") return <Navigate to="/gerente" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}
