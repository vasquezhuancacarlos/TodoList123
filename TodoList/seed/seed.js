/**
 * Semilla de base de datos para TodoList + Drive
 * Se ejecuta automaticamente cuando MongoDB inicia por primera vez (Docker).
 * Para carga manual: mongosh todolist < seed/seed.js
 *
 * Contrasenas de prueba (bcrypt, 10 rondas):
 *   usuario1@demo.com  →  demo1234
 *   usuario2@demo.com  →  demo1234
 */

db = db.getSiblingDB('todolist');

// Usuarios
db.users.drop();
db.users.insertMany([
  {
    name: "Ana Demo",
    email: "usuario1@demo.com",
    // bcrypt hash de "demo1234"
    password: "$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Carlos Demo",
    email: "usuario2@demo.com",
    password: "$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

const userIds = db.users.find({}, { _id: 1 }).toArray().map(u => u._id);
const [uid1, uid2] = userIds;

//  Tareas para usuario 1
db.tasks.drop();
db.tasks.insertMany([
  { title: "Configurar servidor HTTPS",  completed: true,  userId: uid1, createdAt: new Date("2025-06-01"), updatedAt: new Date() },
  { title: "Generar certificados .pem",  completed: true,  userId: uid1, createdAt: new Date("2025-06-01"), updatedAt: new Date() },
  { title: "Revisar redirección HTTP→HTTPS", completed: false, userId: uid1, createdAt: new Date("2025-06-02"), updatedAt: new Date() },
  { title: "Probar API con Postman",     completed: false, userId: uid1, createdAt: new Date("2025-06-02"), updatedAt: new Date() },
  { title: "Desplegar en Docker",        completed: false, userId: uid1, createdAt: new Date("2025-06-03"), updatedAt: new Date() },
  { title: "Escribir README",            completed: true,  userId: uid1, createdAt: new Date("2025-06-03"), updatedAt: new Date() },
  { title: "Subir al repositorio",       completed: false, userId: uid1, createdAt: new Date("2025-06-04"), updatedAt: new Date() },
  // Tareas para usuario 2
  { title: "Instalar dependencias",      completed: true,  userId: uid2, createdAt: new Date("2025-06-01"), updatedAt: new Date() },
  { title: "Conectar MongoDB Atlas",     completed: false, userId: uid2, createdAt: new Date("2025-06-02"), updatedAt: new Date() },
  { title: "Agregar paginacion a tareas", completed: false, userId: uid2, createdAt: new Date("2025-06-03"), updatedAt: new Date() },
]);

print("Semilla cargada: " + db.users.countDocuments() + " usuarios, " + db.tasks.countDocuments() + " tareas.");
