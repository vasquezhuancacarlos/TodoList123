const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema(
    {
        // Nombre original del archivo subido por el usuario
        originalName: {
            type: String,
            required: true,
            trim: true
        },

        // Nombre interno único con el que se guarda en disco (evita colisiones)
        storedName: {
            type: String,
            required: true,
            unique: true
        },

        // Tipo MIME del archivo (image/png, application/pdf, etc.)
        mimeType: {
            type: String,
            required: true
        },

        // Tamaño en bytes
        size: {
            type: Number,
            required: true
        },

        // Ruta relativa en el servidor donde está guardado
        path: {
            type: String,
            required: true
        },

        // Cuántas veces fue reemplazado (histórico de versiones)
        replaceCount: {
            type: Number,
            default: 0
        },

        // Metadatos opcionales (clave-valor libre)
        metadata: {
            type: Map,
            of: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

module.exports = mongoose.model('File', FileSchema);
