// Importamos Express
const express = require('express');

// Importamos CORS para permitir conexiones externas
const cors = require('cors');

// Importamos Morgan para ver peticiones en consola
const morgan = require('morgan');

// Importamos las rutas
const taskRoutes = require('./routes/tasks.routes');

// Inicializamos Express
const app = express();

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Ruta principal
app.get('/', (req, res) => {
    res.json({
        mensaje: 'Servidor Todo List funcionando correctamente'
    });
});

// Ruta de tareas
app.use('/api/tasks', taskRoutes);

// Puerto del servidor
const PORT = 3000;

// Ejecutar servidor
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
