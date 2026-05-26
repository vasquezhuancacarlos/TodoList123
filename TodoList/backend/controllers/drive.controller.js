const path = require('path');
const fs   = require('fs');
const File = require('../models/file.model');

// Carpeta donde se guardan los archivos
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

//GET /api/drive  (listar archivos)
const getFiles = async (req, res) => {
    try {
        const page  = Math.max(1, parseInt(req.query.page)  || 1);
        const limit = Math.min(50, parseInt(req.query.limit) || 10);
        const skip  = (page - 1) * limit;

        const [files, total] = await Promise.all([
            File.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
            File.countDocuments()
        ]);

        res.json({
            data: files,
            pagination: { total, totalPages: Math.ceil(total / limit), currentPage: page, limit }
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al listar archivos', error: error.message });
    }
};

// POST /api/drive/upload
// Multer ya procesó el archivo; viene en req.file
const uploadFile = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ mensaje: 'No se recibió ningún archivo' });

        const { originalname, filename, mimetype, size, path: filePath } = req.file;
        const { replace } = req.body; // 'true' si el usuario confirmó reemplazar

        // Buscar si ya existe un archivo con ese nombre original
        const existing = await File.findOne({ originalName: originalname });

        if (existing) {
            if (replace !== 'true') {
                // Avisar al frontend que ya existe — el archivo temporal se queda en disco
                // hasta que el usuario confirme o cancele
                return res.status(409).json({
                    mensaje: 'Ya existe un archivo con ese nombre',
                    existingFile: {
                        id:          existing._id,
                        originalName: existing.originalName,
                        size:        existing.size,
                        updatedAt:   existing.updatedAt
                    },
                    // Le decimos al frontend el nombre del archivo temporal para el reemplazo
                    tempName: filename
                });
            }

            // Usuario confirmó reemplazo: borrar el archivo viejo de disco
            const oldPath = path.join(UPLOADS_DIR, existing.storedName);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);

            // Actualizar registro en BD
            existing.storedName  = filename;
            existing.mimeType    = mimetype;
            existing.size        = size;
            existing.path        = filePath;
            existing.replaceCount += 1;
            await existing.save();

            return res.json({ mensaje: 'Archivo reemplazado correctamente', file: existing });
        }

        // Archivo nuevo → crear registro
        const newFile = await File.create({
            originalName: originalname,
            storedName:   filename,
            mimeType:     mimetype,
            size,
            path:         filePath
        });

        res.status(201).json({ mensaje: 'Archivo subido correctamente', file: newFile });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al subir archivo', error: error.message });
    }
};

//POST /api/drive/cancel-replace
// Si el usuario cancela el reemplazo, eliminar el temporal
const cancelReplace = async (req, res) => {
    try {
        const { tempName } = req.body;
        if (!tempName) return res.status(400).json({ mensaje: 'tempName requerido' });

        const tempPath = path.join(UPLOADS_DIR, tempName);
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

        res.json({ mensaje: 'Reemplazo cancelado, archivo temporal eliminado' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al cancelar reemplazo', error: error.message });
    }
};

//GET /api/drive/:id/download
const downloadFile = async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) return res.status(404).json({ mensaje: 'Archivo no encontrado' });

        const filePath = path.join(UPLOADS_DIR, file.storedName);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ mensaje: 'Archivo físico no encontrado en servidor' });
        }

        res.download(filePath, file.originalName);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al descargar archivo', error: error.message });
    }
};

//DELETE /api/drive/:id
const deleteFile = async (req, res) => {
    try {
        const file = await File.findByIdAndDelete(req.params.id);
        if (!file) return res.status(404).json({ mensaje: 'Archivo no encontrado' });

        // Borrar del disco
        const filePath = path.join(UPLOADS_DIR, file.storedName);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        res.json({ mensaje: 'Archivo eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar archivo', error: error.message });
    }
};

module.exports = { getFiles, uploadFile, cancelReplace, downloadFile, deleteFile };
