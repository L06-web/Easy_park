const supabase = require('../config/supabase');
const logger = require('../../logger');

exports.listarVagas = async (req, res) => {
    try {
        // Buscamos todas as colunas da tabela 'vaga'
        const { data: vagas, error } = await supabase
            .from('vaga')
            .select('*') //id_vaga, status_atual, latitude, longitude
            .order('id_vaga', { ascending: true }); // Organiza por ID

        if (error) throw error;

        // --- NOVO: LOG DE SUCESSO ESTRUTURADO ---
        // É interessante saber quantas vagas foram retornadas na consulta
        logger.info('Listagem de vagas consultada com sucesso', {
            service: 'backend-api',
            context: {
                controller: 'parkingController.listarVagas',
                quantidade_vagas: vagas ? vagas.length : 0
            }
        });

        // Retornamos um JSON limpo para o Frontend
        return res.status(200).json(vagas);

    } catch (err) {
        // --- NOVO: LOG DE ERRO ESTRUTURADO ---
        logger.error('Erro ao buscar mapa de vagas no banco de dados', {
            service: 'backend-api',
            context: {
                controller: 'parkingController.listarVagas',
                erro: err.message
            }
        });
        
        // Mantemos o console.error para facilitar a leitura no terminal durante o desenvolvimento
        console.error('❌ Erro ao buscar vagas:', err.message);
        
        return res.status(500).json({ erro: 'Erro ao carregar mapa de vagas.' });
    }
};