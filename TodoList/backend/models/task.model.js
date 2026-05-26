const mongoose = require('mongoose');

// Esquema de Metadatos
// Permite adjuntar pares clave-valor arbitrarios a cada tarea.
// Ejemplo: { priority: 'high', tags: ['trabajo', 'urgente'], color: '#ff0000' }
const MetadataSchema = new mongoose.Schema(
    {
        key:   { type: String, required: true, trim: true },
        value: { type: mongoose.Schema.Types.Mixed, required: true }
    },
    { _id: false } // No necesitamos _id en cada par
);

//Esquema Principal de Tarea
const TaskSchema = new mongoose.Schema(
    {
        // Título de la tarea (obligatorio)
        title: {
            type: String,
            required: [true, 'El título es obligatorio'],
            trim: true
        },

        // Estado completado / pendiente
        completed: {
            type: Boolean,
            default: false
        },

        // Lista de metadatos clave-valor
        // Ejemplos de uso: prioridad, etiquetas, color, categoría, etc.
        metadata: {
            type: [MetadataSchema],
            default: []
        }
    },
    {
        // Agrega automáticamente createdAt y updatedAt
        timestamps: true,

        // Incluye la versión del documento al serializar
        versionKey: false
    }
);

module.exports = mongoose.model('Task', TaskSchema);
