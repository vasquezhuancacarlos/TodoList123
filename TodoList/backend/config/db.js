const mongoose = require('mongoose');

// URI leida siempre desde variable de entorno (ver .env.example)
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('ERROR: La variable MONGO_URI no esta definida.');
    console.error('Crea un archivo .env basado en .env.example y define MONGO_URI.');
    process.exit(1);
}

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB conectado correctamente.');
    } catch (error) {
        console.error('Error al conectar MongoDB:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
