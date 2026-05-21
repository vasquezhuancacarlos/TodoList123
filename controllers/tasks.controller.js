// Importamos las tareas
const tasks = require('../data/tasks');

// Obtener todas las tareas
const getTasks = (req, res) => {
    res.json(tasks);
};

// Obtener tarea por ID
const getTaskById = (req, res) => {

    // Convertimos el ID a número
    const id = parseInt(req.params.id);

    // Buscar tarea
    const task = tasks.find(t => t.id === id);

    // Validar si existe
    if (!task) {
        return res.status(404).json({
            mensaje: 'Tarea no encontrada'
        });
    }

    res.json(task);
};

// Crear nueva tarea
const createTask = (req, res) => {

    // Obtener datos enviados
    const { title, completed } = req.body;

    // Validar título
    if (!title) {
        return res.status(400).json({
            mensaje: 'El título es obligatorio'
        });
    }

    // Crear objeto
    const newTask = {
        id: tasks.length + 1,
        title,
        completed: completed || false
    };

    // Guardar tarea
    tasks.push(newTask);

    res.status(201).json({
        mensaje: 'Tarea creada correctamente',
        tarea: newTask
    });
};
// Actualizar tarea
const updateTask = (req, res) => {

    const id = parseInt(req.params.id);
    const { title, completed } = req.body;

    // Buscar tarea
    const task = tasks.find(t => t.id === id);

    // Validar existencia
    if (!task) {
        return res.status(404).json({
            mensaje: 'Tarea no encontrada'
        });
    }

    // Actualizar datos
    if (title !== undefined) {
        task.title = title;
    }

    if (completed !== undefined) {
        task.completed = completed;
    }

    res.json({
        mensaje: 'Tarea actualizada correctamente',
        tarea: task
    });
};

// Eliminar tarea
const deleteTask = (req, res) => {

    const id = parseInt(req.params.id);

    // Buscar índice
    const index = tasks.findIndex(t => t.id === id);

    // Validar existencia
    if (index === -1) {
        return res.status(404).json({
            mensaje: 'Tarea no encontrada'
        });
    }

    // Eliminar tarea
    tasks.splice(index, 1);

    res.json({
        mensaje: 'Tarea eliminada correctamente'
    });
};

// Exportamos funciones
module.exports = {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask
};