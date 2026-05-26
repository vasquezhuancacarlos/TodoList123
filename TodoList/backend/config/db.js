const mongoose = require('mongoose');

// URL de conexión a MongoDB (puedes cambiarla por tu URI de Atlas u otro host)
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://lucas:lucas1234@cluster0.hn5psnf.mongodb.net/todolist?appName=Cluster0';

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log(`MongoDB conectado: ${MONGO_URI}`);
    } catch (error) {
        console.error('Error al conectar MongoDB:', error.message);
        process.exit(1); // Detener el servidor si falla la conexión
    }
};

module.exports = connectDB;
