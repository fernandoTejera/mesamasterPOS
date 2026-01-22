import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Caja from "./pages/Caja";
import Login from "./pages/login";
import RoleRoute from "./auth/RoleRoute";
import Mesas from "./pages/Mesas";
import Cocina from "./pages/Cocina";
import Gerente from "./pages/Gerente";
import MesaDetalle from "./pages/MesaDetalle";
import Reportes from "./pages/Reportes";
import Usuarios from "./pages/Usuarios";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Cuando alguien entra a "/", lo mandamos a /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />
        <Route
          path="/mesas/:id"
          element={
            <RoleRoute allow={["mesero"]}>
              <MesaDetalle />
            </RoleRoute>
          }
        />

        <Route
          path="/mesas"
          element={
            <RoleRoute allow={["mesero"]}>
              <Mesas />
            </RoleRoute>
          }
        />
        <Route
          path="/cocina"
          element={
            <RoleRoute allow={["cocina"]}>
              <Cocina />
            </RoleRoute>
          }
        />
        <Route
          path="/gerente"
          element={
            <RoleRoute allow={["gerente"]}>
              <Gerente />
            </RoleRoute>
          }
        />
        <Route
          path="/caja"
          element={
            <RoleRoute allow={["gerente"]}>
              <Caja />
            </RoleRoute>
          }
        />
        <Route
          path="/usuarios"
          element={
            <RoleRoute allow={["gerente"]}>
              <Usuarios />
            </RoleRoute>
          }
        />
        <Route
          path="/reportes"
          element={
            <RoleRoute allow={["gerente"]}>
              <Reportes />
            </RoleRoute>
          }
        />
        {/* Ruta no encontrada */}
        <Route
          path="*"
          element={<h1 style={{ padding: 24 }}>404 - No econtrado</h1>}
        />
      </Routes>
    </BrowserRouter>
  );
}
