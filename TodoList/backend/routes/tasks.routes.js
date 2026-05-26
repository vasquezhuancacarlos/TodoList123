const express = require('express');
const router  = express.Router();

const {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    toggleTask,
    deleteTask
} = require('../controllers/tasks.controller');

// GET/api/tasks → lista paginada
router.get('/',getTasks);

// GET/api/tasks/:id → tarea por ID
router.get('/:id',getTaskById);

// POST/api/tasks → crear tarea
router.post('/',createTask);

// PUT/api/tasks/:id → actualizar tarea completa
router.put('/:id',updateTask);

// PATCH  /api/tasks/:id/toggle → alternar completed (sin body)
router.patch('/:id/toggle',toggleTask);

// DELETE /api/tasks/:id → eliminar tarea
router.delete('/:id',deleteTask);

module.exports = router;
