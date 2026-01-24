import "./login.css";
import { login } from "../services/api";
import { FaUser, FaLock } from "react-icons/fa";
import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const data = await login(email, password);

      // Guardar token (simple por ahora)
      localStorage.setItem("token", data.token);

      // Guardar token (simple por ahora)
      localStorage.setItem("token", data.token);

      // ✅ para usar en MesaDetalle y en roles sin jwtDecode
      localStorage.setItem("userName", data.user?.name || "");
      localStorage.setItem("userRole", data.user?.role || "");

      // Redirigir según rol
      if (data.user.role === "mesero") navigate("/mesas");
      else if (data.user.role === "cocina") navigate("/cocina");
      else if (data.user.role === "gerente") navigate("/gerente");
      else setError("Rol desconocido");
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <div className="loginPage">
      <div className="loginCard">
        <div className="brandRow">
          <div className="logoBox">
            <img className="logoImg" src={logo} alt="MesaMaster" />
          </div>
          <div>
            <h1 className="brandName">MesaMaster POS</h1>
            <p className="subtitle">Accede con tu cuenta según tu rol</p>
          </div>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label className="label" htmlFor="email">
              Correo electrónico
            </label>
            <div className="inputWrapper">
              <FaUser className="inputIcon" />
              <input
                id="email"
                className="input withIcon"
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="field">
            <label className="label" htmlFor="password">
              Contraseña
            </label>

            <div className="inputWrapper">
              <FaLock className="inputIcon" />
              <input
                id="password"
                className="input withIcon"
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="row">
            <button className="link" type="button">
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <button className="button" type="submit">
            Iniciar sesión
          </button>

          {error && <p className="error">{error}</p>}

          <p className="help">
            Consejo: usa credenciales de prueba cuando conectemos el backend.
          </p>
        </form>
      </div>
    </div>
  );
}
