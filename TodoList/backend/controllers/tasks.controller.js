const Task = require('../models/task.model');

// GET /api/tasks  (con paginación + cache) 
const getTasks = async (req, res) => {
    try {
        // Parámetros de paginación (defaults: página 1, 10 ítems)
        const page  = Math.max(1, parseInt(req.query.page)  || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const skip  = (page - 1) * limit;

        // Filtro opcional por estado
        const filter = {};
        if (req.query.completed !== undefined) {
            filter.completed = req.query.completed === 'true';
        }

        const [tasks, total] = await Promise.all([
            Task.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Task.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(total / limit);

        // Cache del lado cliente: 30 segundos
        res.set('Cache-Control', 'public, max-age=30');

        res.json({
            data: tasks,
            pagination: {
                total,
                totalPages,
                currentPage: page,
                limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener tareas', error: error.message });
    }
};

//GET /api/tasks/:id
const getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ mensaje: 'Tarea no encontrada' });

        // Cache de tarea individual: 60 segundos
        res.set('Cache-Control', 'public, max-age=60');
        res.json(task);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener tarea', error: error.message });
    }
};

//POST /api/tasks
const createTask = async (req, res) => {
    try {
        const { title, completed, metadata } = req.body;

        if (!title) return res.status(400).json({ mensaje: 'El título es obligatorio' });

        const newTask = await Task.create({
            title,
            completed: completed || false,
            metadata: metadata || []
        });

        res.status(201).json({ mensaje: 'Tarea creada correctamente', tarea: newTask });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear tarea', error: error.message });
    }
};

//PUT /api/tasks/:id
const updateTask = async (req, res) => {
    try {
        const { title, completed, metadata } = req.body;

        const task = await Task.findByIdAndUpdate(
            req.params.id,
            { ...(title !== undefined && { title }),
              ...(completed !== undefined && { completed }),
              ...(metadata !== undefined && { metadata }) },
            { new: true, runValidators: true }
        );

        if (!task) return res.status(404).json({ mensaje: 'Tarea no encontrada' });

        res.json({ mensaje: 'Tarea actualizada correctamente', tarea: task });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar tarea', error: error.message });
    }
};

//PATCH /api/tasks/:id/toggle
// Alterna el estado completed de una tarea sin enviar el body completo
const toggleTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ mensaje: 'Tarea no encontrada' });

        task.completed = !task.completed;
        await task.save();

        res.json({
            mensaje: `Tarea marcada como ${task.completed ? 'completada' : 'pendiente'}`,
            tarea: task
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al alternar tarea', error: error.message });
    }
};

//DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) return res.status(404).json({ mensaje: 'Tarea no encontrada' });

        res.json({ mensaje: 'Tarea eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar tarea', error: error.message });
    }
};

module.exports = { getTasks, getTaskById, createTask, updateTask, toggleTask, deleteTask };
