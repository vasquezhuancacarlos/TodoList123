// Importamos Express
const express = require('express');

// Creamos router
const router = express.Router();

// Importamos controladores
const {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask
} = require('../controllers/tasks.controller');

// GET todas las tareas
router.get('/', getTasks);

// GET tarea por ID
router.get('/:id', getTaskById);

// POST crear tarea
router.post('/', createTask);

// PUT actualizar tarea
router.put('/:id', updateTask);

// DELETE eliminar tarea
router.delete('/:id', deleteTask);

// Exportar rutas
module.exports = router;

