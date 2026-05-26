const express    = require('express');
const cors       = require('cors');
const morgan     = require('morgan');
const path       = require('path');

const connectDB  = require('./config/db');
const taskRoutes = require('./routes/tasks.routes');
const driveRoutes = require('./routes/drive.routes');

//  Conectar a MongoDB
connectDB();

const app = express();

//  Middlewares 
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '2gb' }));
app.use(express.urlencoded({ limit: '2gb', extended: true }));

//Rutas de la API
app.get('/', (req, res) => {
    res.json({ mensaje: 'API TodoList + Drive funcionando' });
});

app.use('/api/tasks', taskRoutes);
app.use('/api/drive', driveRoutes);

// Servir React (producción)
// Descomenta estas líneas cuando hagas el build del frontend:
// app.use(express.static(path.join(__dirname, 'client/dist')));
// app.get('*', (req, res) =>
//     res.sendFile(path.join(__dirname, 'client/dist/index.html'))
// );

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
