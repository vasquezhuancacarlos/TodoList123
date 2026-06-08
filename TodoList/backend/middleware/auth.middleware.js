const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cambia_este_secreto_en_produccion';

/**
 * verifyToken  – Middleware que protege rutas.
 * Espera el header:  Authorization: Bearer <token>
 * Si el token es válido, inyecta `req.user` con el payload decodificado.
 */
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ mensaje: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // jwt.verify lanza si el token está expirado o la firma es inválida
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;   // { id, email, role, iat, exp }
        next();
    } catch (err) {
        const mensaje =
            err.name === 'TokenExpiredError'
                ? 'Token expirado'
                : 'Token inválido';
        return res.status(401).json({ mensaje });
    }
};

/**
 * requireAdmin  – Middleware adicional para rutas de administrador.
 * Usar DESPUÉS de verifyToken.
 */
const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ mensaje: 'Acceso denegado: se requiere rol admin' });
    }
    next();
};

module.exports = { verifyToken, requireAdmin };
