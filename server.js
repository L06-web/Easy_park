require('dotenv').config();
const express = require('express');
const cors = require('cors');
const userRoutes = require('./src/routes/userRoutes');
const parkingRoutes = require('./src/routes/parkingRoutes'); 
const analyticsRoutes = require('./src/routes/analyticsRoutes');
const analyticsService = require('./src/services/analyticsService');
const supabase = require('./src/config/supabase');
const { agoraBrasiliaISO } = require('./src/utils/brasiliaDate');

const logger = require('./logger');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'EasyPark API' });
});

app.get('/api', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'EasyPark API' });
});

app.use((req, res, next) => {
    if (req.method !== 'OPTIONS') {
        logger.info(`Requisição recebida: ${req.method} ${req.url}`, {
            service: 'backend-api',
            context: { metodo: req.method, rota: req.url, ip: req.ip }
        });
    }
    next();
});

app.use('/api/usuarios', userRoutes);
app.use('/api/vagas', parkingRoutes); 
app.use('/api/analytics', analyticsRoutes);

// ROTA DE HARDWARE - Receber dados de sensores via HTTP (ESP32)
app.post('/api/hardware/sensor', async (req, res) => {
    const { id_sensor, distancia } = req.body;

    // Validação — só precisamos de id_sensor e distancia
    if (!id_sensor || distancia === undefined || distancia === null) {
        logger.warn('Requisição de sensor com dados incompletos', {
            service: 'hardware-api',
            context: { id_sensor, distancia, ip: req.ip }
        });
        return res.status(400).json({ erro: 'Dados incompletos: id_sensor e distancia são obrigatórios' });
    }

    // Calcular status a partir da distância (mesma lógica do arduinoService original)
    const estaOcupada = Number(distancia) > 0 && Number(distancia) <= 30;
    const novoStatus = estaOcupada ? 'O' : 'L';
    const statusBooleano = estaOcupada;

    try {
        const agora = agoraBrasiliaISO();

        logger.info('Dados recebidos de sensor via HTTP', {
            service: 'hardware-api',
            context: { id_sensor, distancia, status_calculado: novoStatus, ip: req.ip }
        });

        // 1. Atualiza ultimo_sinal na tabela sensor
        const { error: erroSensor } = await supabase
            .from('sensor')
            .update({ ultimo_sinal: agora })
            .eq('id_sensor', id_sensor);

        if (erroSensor) {
            logger.error('Erro ao atualizar timestamp do sensor', {
                service: 'backend-api',
                context: { id_sensor, erro: erroSensor.message }
            });
            return res.status(500).json({ erro: 'Erro ao atualizar sensor' });
        }

        // 2. Busca vaga associada ao sensor
        const { data: vaga, error: erroVaga } = await supabase
            .from('vaga')
            .select('id_vaga, status_atual')
            .eq('id_sensor', id_sensor)
            .single();

        if (erroVaga && erroVaga.code !== 'PGRST116') {
            logger.error('Erro ao buscar vaga do sensor', {
                service: 'backend-api',
                context: { id_sensor, erro: erroVaga.message }
            });
            return res.status(500).json({ erro: 'Erro ao buscar vaga' });
        }

        if (!vaga) {
            logger.warn(`Nenhuma vaga encontrada para o sensor ${id_sensor}`, {
                service: 'hardware-api',
                context: { id_sensor }
            });
            return res.status(404).json({ erro: 'Vaga não encontrada para este sensor' });
        }

        // 3. Se estava RESERVADO e leitura indica LIVRE, mantém RESERVADO
        if (vaga.status_atual === 'R' && novoStatus === 'L') {
            console.log(`📌 Vaga ${vaga.id_vaga} mantida como RESERVADO`);
            return res.status(200).json({
                mensagem: 'Sensor atualizado com sucesso',
                vaga_id: vaga.id_vaga,
                status_atual: 'R'
            });
        }

        // 4. Atualiza status da vaga apenas se mudou
        if (vaga.status_atual !== novoStatus) {
            const { error: erroAtualizacao } = await supabase
                .from('vaga')
                .update({ status_atual: novoStatus })
                .eq('id_vaga', vaga.id_vaga);

            if (erroAtualizacao) {
                logger.error('Erro ao atualizar status da vaga', {
                    service: 'backend-api',
                    context: { id_vaga: vaga.id_vaga, novo_status: novoStatus, erro: erroAtualizacao.message }
                });
                return res.status(500).json({ erro: 'Erro ao atualizar vaga' });
            }

            // 5. Registra no histórico
            const { error: erroHistorico } = await supabase
                .from('historico_vaga')
                .insert({
                    id_vaga: vaga.id_vaga,
                    status_registrado: statusBooleano,
                    data_hora: agora
                });

            if (erroHistorico) {
                logger.warn('Erro ao registrar no histórico', {
                    service: 'backend-api',
                    context: { id_vaga: vaga.id_vaga, erro: erroHistorico.message }
                });
            }

            logger.info('Vaga atualizada via HTTP', {
                service: 'hardware-api',
                context: {
                    id_vaga: vaga.id_vaga,
                    id_sensor,
                    status_anterior: vaga.status_atual,
                    status_novo: novoStatus
                }
            });

            console.log(`✅ Vaga ${vaga.id_vaga}: ${vaga.status_atual} → ${novoStatus}`);

            // 6. Registra evento no analytics
            try {
                await analyticsService.registrarEventoVaga({
                    id_vaga: vaga.id_vaga,
                    status_anterior: vaga.status_atual,
                    status_novo: novoStatus,
                    timestamp: agora,
                    sensor_id: id_sensor
                });
            } catch (erroAnalytics) {
                logger.warn('Erro ao registrar analytics', {
                    service: 'analytics',
                    context: { id_vaga: vaga.id_vaga, erro: erroAnalytics.message }
                });
            }
        } else {
            console.log(`📡 Sensor ${id_sensor}: ${distancia}cm — status inalterado (${novoStatus})`);
        }

        res.status(200).json({
            mensagem: 'Sensor atualizado com sucesso',
            vaga_id: vaga.id_vaga,
            status_atual: novoStatus
        });

    } catch (error) {
        logger.error('Erro ao processar dado do sensor via HTTP', {
            service: 'hardware-api',
            context: { erro: error.message, stack: error.stack, body: req.body }
        });
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

app.use((err, req, res, next) => {
    logger.error('Erro interno não tratado no servidor', {
        service: 'backend-api',
        context: { erro: err.message, stack: err.stack, rota_chamada: req.url }
    });
    res.status(500).json({ error: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3000;

function startServer() {
    analyticsService.inicializarServico();

    app.listen(PORT, () => {
        logger.info('Servidor EasyPark iniciado com sucesso', {
            service: 'backend-api',
            context: { porta: PORT, ambiente: process.env.NODE_ENV || 'desenvolvimento' }
        });
        console.log(`🚀 EasyPark Rodando: http://localhost:${PORT}`);
    });
}

if (require.main === module) {
    startServer();

    process.on('SIGINT', () => {
        logger.info('Encerrando servidor EasyPark', { service: 'backend-api' });
        analyticsService.pararServico();
        process.exit(0);
    });
}

module.exports = app;
