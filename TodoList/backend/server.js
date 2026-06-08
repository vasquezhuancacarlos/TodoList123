const express    = require('express');
const https      = require('https');
const http       = require('http');
const cors       = require('cors');
const morgan     = require('morgan');
const path       = require('path');
const fs         = require('fs');
require('dotenv').config();

const connectDB   = require('./config/db');
const taskRoutes  = require('./routes/tasks.routes');
const driveRoutes = require('./routes/drive.routes');
const authRoutes  = require('./routes/auth.routes');

// Conectar a MongoDB
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '2gb' }));
app.use(express.urlencoded({ limit: '2gb', extended: true }));

// Rutas de la API
app.get('/', (req, res) => {
    res.json({ mensaje: 'API TodoList + Drive funcionando (HTTPS)' });
});

app.use('/api/auth',  authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/drive', driveRoutes);

//Cargar certificados SSL
const CERT_DIR  = path.join(__dirname, 'certs');
const keyPath   = path.join(CERT_DIR, 'key.pem');
const certPath  = path.join(CERT_DIR, 'cert.pem');

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.error('❌  Certificados no encontrados en /certs/');
    console.error('    Ejecuta: npm run gen-certs');
    process.exit(1);
}

const sslOptions = {
    key:  fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
};

// Iniciar servidor HTTPS 
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

https.createServer(sslOptions, app).listen(HTTPS_PORT, () => {
    console.log(`✅  Servidor HTTPS corriendo en https://localhost:${HTTPS_PORT}`);
});

//Redireccionador HTTP → HTTPS (opcional, puerto 3000)
const HTTP_PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    const host = req.headers.host?.replace(/:\d+$/, '');
    res.writeHead(301, { Location: `https://${host}:${HTTPS_PORT}${req.url}` });
    res.end();
}).listen(HTTP_PORT, () => {
    console.log(`↪   Redireccionador HTTP en http://localhost:${HTTP_PORT}  →  HTTPS`);
});
