const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');

const SALT_ROUNDS = 12;

const UserSchema = new mongoose.Schema(
    {
        name: {
            type:     String,
            required: [true, 'El nombre es obligatorio'],
            trim:     true
        },
        email: {
            type:      String,
            required:  [true, 'El email es obligatorio'],
            unique:    true,
            lowercase: true,
            trim:      true,
            match:     [/^\S+@\S+\.\S+$/, 'Email inválido']
        },
        password: {
            type:     String,
            required: [true, 'La contraseña es obligatoria'],
            minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
            select:   false   // no se devuelve en queries por defecto
        },
        role: {
            type:    String,
            enum:    ['user', 'admin'],
            default: 'user'
        }
    },
    {
        timestamps:  true,
        versionKey:  false
    }
);

// Hash antes de guardar
UserSchema.pre('save', async function (next) {
    // Solo re-hashear si la contraseña fue modificada
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
    next();
});

//Método de instancia para comparar contraseñas
UserSchema.methods.comparePassword = function (plain) {
    return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', UserSchema);
