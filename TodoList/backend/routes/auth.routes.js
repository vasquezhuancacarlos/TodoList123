const express = require('express');
const router  = express.Router();

const { register, login, getMe } = require('../controllers/auth.controller');
const { verifyToken }            = require('../middleware/auth.middleware');

// POST /api/auth/register  →  crear cuenta
router.post('/register', register);

// POST /api/auth/login     →  obtener token
router.post('/login', login);

// GET  /api/auth/me        →  perfil (ruta protegida)
router.get('/me', verifyToken, getMe);

module.exports = router;
