import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/login";
import Mesas from "./pages/mesas";
import Cocina from "./pages/cocina";
import Gerente from "./pages/gerente";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Cuando alguien entra a "/", lo mandamos a /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/mesas" element={<Mesas/>} />
        <Route path="/cocina" element={<Cocina/>} />
        <Route path="/gerente" element={<Gerente/>} />

        {/* Ruta no encontrada */}
        <Route path="*" element ={<h1 style={{padding: 24}}>404 - No econtrado</h1> }/>
      </Routes>
    </BrowserRouter>
  );
}
