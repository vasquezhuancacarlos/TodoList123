const jwt  = require('jsonwebtoken');
const User = require('../models/user.model');

const JWT_SECRET  = process.env.JWT_SECRET  || 'cambia_este_secreto_en_produccion';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';   // RFC 7519 – campo "exp"

// Helpers

/** Genera un JWT firmado con el payload mínimo necesario */
const signToken = (user) =>
    jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES, algorithm: 'HS256' }   // HS256 es la suite HMAC del RFC 7518
    );

/** Respuesta limpia: nunca devolver el hash de la contraseña */
const sanitizeUser = (user) => ({
    id:        user._id,
    name:      user.name,
    email:     user.email,
    role:      user.role,
    createdAt: user.createdAt
});

// POST /api/auth/register
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ mensaje: 'Nombre, email y contraseña son obligatorios' });
        }

        // Verificar duplicado antes de intentar insertar (mejor mensaje de error)
        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(409).json({ mensaje: 'Ya existe una cuenta con ese email' });
        }

        // El pre-save hook se encarga del hash bcrypt
        const user = await User.create({ name, email, password });

        const token = signToken(user);

        return res.status(201).json({
            mensaje: 'Usuario registrado correctamente',
            token,
            usuario: sanitizeUser(user)
        });
    } catch (err) {
        // Error de validación de Mongoose
        if (err.name === 'ValidationError') {
            const errores = Object.values(err.errors).map((e) => e.message);
            return res.status(400).json({ mensaje: 'Error de validación', errores });
        }
        return res.status(500).json({ mensaje: 'Error al registrar usuario', error: err.message });
    }
};

// POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ mensaje: 'Email y contraseña son obligatorios' });
        }

        // `select('+password')` porque el campo tiene select:false en el esquema
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            // Mismo mensaje para email y contraseña → evita user enumeration
            return res.status(401).json({ mensaje: 'Credenciales inválidas' });
        }

        const match = await user.comparePassword(password);
        if (!match) {
            return res.status(401).json({ mensaje: 'Credenciales inválidas' });
        }

        const token = signToken(user);

        return res.json({
            mensaje: 'Login exitoso',
            token,
            usuario: sanitizeUser(user)
        });
    } catch (err) {
        return res.status(500).json({ mensaje: 'Error al iniciar sesión', error: err.message });
    }
};

// GET /api/auth/me
// Ruta protegida de ejemplo: devuelve el perfil del usuario autenticado
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        return res.json({ usuario: sanitizeUser(user) });
    } catch (err) {
        return res.status(500).json({ mensaje: 'Error al obtener perfil', error: err.message });
    }
};

module.exports = { register, login, getMe };
