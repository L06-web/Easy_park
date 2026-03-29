
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const userRoutes = require('./src/routes/userRoutes');
const initArduino = require('./src/services/arduinoService');
const parkingRoutes = require('./src/routes/parkingRoutes'); 
const app = express();

app.use(cors());
app.use(express.json());

// Rotas da API
app.use('/api/usuarios', userRoutes);
app.use('/api/vagas', parkingRoutes); 

// Inicia a escuta do hardware
initArduino();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 EasyPark Rodando: http://localhost:${PORT}`);
});