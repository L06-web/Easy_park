const supabase = require('../config/supabase');
const logger = require('../../logger');

const STATUS = {
    LIVRE: 'L',
    OCUPADO: 'O',
    RESERVADO: 'R',
};

function normalizarStatus(status) {
    const mapa = {
        L: STATUS.LIVRE,
        LIVRE: STATUS.LIVRE,
        O: STATUS.OCUPADO,
        OCUPADO: STATUS.OCUPADO,
        R: STATUS.RESERVADO,
        RESERVADO: STATUS.RESERVADO,
    };

    return mapa[status] || status;
}

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

exports.reservarVaga = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ erro: 'Informe a vaga que deseja reservar.' });
        }

        const { data: vagaAtual, error: erroConsulta } = await supabase
            .from('vaga')
            .select('*')
            .eq('id_vaga', id)
            .maybeSingle();

        if (erroConsulta) throw erroConsulta;

        if (!vagaAtual) {
            return res.status(404).json({ erro: 'Vaga não encontrada.' });
        }

        if (normalizarStatus(vagaAtual.status_atual) !== STATUS.LIVRE) {
            return res.status(409).json({ erro: 'Esta vaga não está disponível para reserva.' });
        }

        const { data: vagaReservada, error: erroReserva } = await supabase
            .from('vaga')
            .update({ status_atual: STATUS.RESERVADO })
            .eq('id_vaga', id)
            .select('*')
            .single();

        if (erroReserva) throw erroReserva;

        logger.info('Vaga reservada com sucesso', {
            service: 'backend-api',
            context: {
                controller: 'parkingController.reservarVaga',
                id_vaga: id
            }
        });

        return res.status(200).json({
            mensagem: 'Vaga reservada com sucesso!',
            vaga: vagaReservada,
        });
    } catch (err) {
        const mensagem = err.message || 'Erro ao reservar vaga.';

        logger.error('Erro ao reservar vaga', {
            service: 'backend-api',
            context: {
                controller: 'parkingController.reservarVaga',
                erro: mensagem
            }
        });

        console.error('❌ Erro ao reservar vaga:', mensagem);

        return res.status(500).json({
            erro: process.env.NODE_ENV === 'production' ? 'Erro ao reservar vaga.' : mensagem,
        });
    }
};

exports.liberarVaga = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ erro: 'Informe a vaga que deseja liberar.' });
        }

        const { data: vagaAtual, error: erroConsulta } = await supabase
            .from('vaga')
            .select('*')
            .eq('id_vaga', id)
            .maybeSingle();

        if (erroConsulta) throw erroConsulta;

        if (!vagaAtual) {
            return res.status(404).json({ erro: 'Vaga não encontrada.' });
        }

        if (normalizarStatus(vagaAtual.status_atual) !== STATUS.RESERVADO) {
            return res.status(409).json({ erro: 'Apenas vagas reservadas podem ser liberadas.' });
        }

        const { data: vagaLiberada, error: erroLiberacao } = await supabase
            .from('vaga')
            .update({ status_atual: STATUS.LIVRE })
            .eq('id_vaga', id)
            .select('*')
            .single();

        if (erroLiberacao) throw erroLiberacao;

        logger.info('Reserva desfeita com sucesso', {
            service: 'backend-api',
            context: {
                controller: 'parkingController.liberarVaga',
                id_vaga: id
            }
        });

        return res.status(200).json({
            mensagem: 'Reserva desfeita com sucesso!',
            vaga: vagaLiberada,
        });
    } catch (err) {
        const mensagem = err.message || 'Erro ao desfazer reserva.';

        logger.error('Erro ao desfazer reserva', {
            service: 'backend-api',
            context: {
                controller: 'parkingController.liberarVaga',
                erro: mensagem
            }
        });

        console.error('❌ Erro ao desfazer reserva:', mensagem);

        return res.status(500).json({
            erro: process.env.NODE_ENV === 'production' ? 'Erro ao desfazer reserva.' : mensagem,
        });
    }
};
