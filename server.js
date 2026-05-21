require('dotenv').config();
const express = require('express');
const cors = require('cors');
const userRoutes = require('./src/routes/userRoutes');
const initArduino = require('./src/services/arduinoService');
const parkingRoutes = require('./src/routes/parkingRoutes'); 
const analyticsRoutes = require('./src/routes/analyticsRoutes');
const analyticsService = require('./src/services/analyticsService');

// 1. IMPORTANDO O LOGGER
const logger = require('./logger');

const app = express();

app.use(cors());
app.use(express.json());

// 2. MIDDLEWARE DE LOG DE REQUISIÇÕES (Novo!)
// Toda vez que seu app mobile ou frontend chamar a API, isso vai gerar um log.
app.use((req, res, next) => {
    // Ignora requisições de 'OPTIONS' (geradas automaticamente pelo CORS) para não poluir
    if (req.method !== 'OPTIONS') {
        logger.info(`Requisição recebida: ${req.method} ${req.url}`, {
            service: 'backend-api',
            context: {
                metodo: req.method,
                rota: req.url,
                ip: req.ip
            }
        });
    }
    next();
});

// Rotas da API
app.use('/api/usuarios', userRoutes);
app.use('/api/vagas', parkingRoutes); 
app.use('/api/analytics', analyticsRoutes);

// Inicia a escuta do hardware
initArduino();
analyticsService.inicializarServico();

// 3. MIDDLEWARE GLOBAL DE ERROS (Novo!)
// Se alguma das suas rotas falhar e não tiver um bloco try/catch adequado,
// o Express joga o erro para cá. Isso evita que o servidor "caia" em silêncio.
app.use((err, req, res, next) => {
    logger.error('Erro interno não tratado no servidor', {
        service: 'backend-api',
        context: {
            erro: err.message,
            stack: err.stack, // Mostra em qual linha do código o erro aconteceu
            rota_chamada: req.url
        }
    });
    res.status(500).json({ error: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    // 4. LOG ESTRUTURADO DE INICIALIZAÇÃO
    logger.info('Servidor EasyPark iniciado com sucesso', {
        service: 'backend-api',
        context: {
            porta: PORT,
            ambiente: process.env.NODE_ENV || 'desenvolvimento'
        }
    });

    // Mantemos o console.log com emoji para facilitar a leitura no terminal
    console.log(`🚀 EasyPark Rodando: http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
    logger.info('Encerrando servidor EasyPark', {
        service: 'backend-api'
    });

    analyticsService.pararServico();
    process.exit(0);
});
