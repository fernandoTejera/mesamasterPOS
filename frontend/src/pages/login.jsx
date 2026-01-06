import "./login.css";
import { FaUser, FaLock } from "react-icons/fa";
import logo from "../assets/logo.png";

export default function Login() {
  function handleSubmit(e) {
    e.preventDefault();
    alert("Login (solo UI por ahora)");
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
            <label className="label" htmlFor="email">Correo electrónico</label>

            <div className="inputWrapper">
              <FaUser className="inputIcon" />
              <input
                id="email"
                className="input withIcon"
                type="email"
                placeholder="Correo electrónico"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="field">
            <label className="label" htmlFor="password">Contraseña</label>

            <div className="inputWrapper">
              <FaLock className="inputIcon" />
              <input
                id="password"
                className="input withIcon"
                type="password"
                placeholder="Contraseña"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <div className="row">
            <button className="link" type="button">
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <button className="button" type="submit">Iniciar sesión</button>

          <p className="help">
            Consejo: usa credenciales de prueba cuando conectemos el backend.
          </p>
        </form>
      </div>
    </div>
  );
}
