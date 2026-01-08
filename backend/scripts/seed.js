require("dotenv").config();
const bcrypt = require("bcrypt");
const pool = require("../db");

async function run() {
  const password = "1234"; // contraseña demo
  const hash = await bcrypt.hash(password, 10);

  const users = [
    ["Mesero 1", "mesero@demo.com", hash, "mesero"],
    ["Cocina 1", "cocina@demo.com", hash, "cocina"],
    ["Gerente 1", "gerente@demo.com", hash, "gerente"],
  ];

  for (const u of users) {
    await pool.query(
      "INSERT IGNORE INTO users (name, email, password_hash, role) VALUES (?,?,?,?)",
      u
    );
  }

  console.log(" Usuarios demo creados. Password: 1234");
  process.exit(0);
}

run().catch((e) => {
  console.error("Seed error:", e.message);
  process.exit(1);
});
