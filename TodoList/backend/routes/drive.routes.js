const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const { v4: uuidv4 } = require('uuid');

const {
    getFiles,
    uploadFile,
    cancelReplace,
    downloadFile,
    deleteFile
} = require('../controllers/drive.controller');

// Configuración de Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'uploads'));
    },
    filename: (req, file, cb) => {
        // Guardar con UUID para evitar colisiones de nombres en disco
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 * 1024 } // 2g máximo
});

// GET/api/drive → listar archivos
router.get('/',getFiles);

// POST/api/drive/upload → subir archivo
router.post('/upload',upload.single('file'), uploadFile);

// POST/api/drive/cancel-replace → cancelar reemplazo pendiente
router.post('/cancel-replace',cancelReplace);

// GET/api/drive/:id/download → descargar archivo
router.get('/:id/download',downloadFile);

// DELETE /api/drive/:id → eliminar archivo
router.delete('/:id',deleteFile);

module.exports = router;
