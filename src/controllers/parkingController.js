const supabase = require('../config/supabase');

exports.listarVagas = async (req, res) => {
    try {
        // Buscamos todas as colunas da tabela 'vaga'
        const { data: vagas, error } = await supabase
            .from('vaga')
            .select('*') //id_vaga, status_atual, latitude, longitude
            .order('id_vaga', { ascending: true }); // Organiza por ID

        if (error) throw error;

        // Retornamos um JSON limpo para o Frontend
        return res.status(200).json(vagas);

    } catch (err) {
        console.error('❌ Erro ao buscar vagas:', err.message);
        return res.status(500).json({ erro: 'Erro ao carregar mapa de vagas.' });
    }
};