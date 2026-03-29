const supabase = require('../config/supabase');

exports.cadastrarUsuario = async (req, res) => {
    try {
        const { email, senha, nome_completo, cpf, telefone } = req.body;

        if (!email || !senha || !nome_completo || !cpf) {
            return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios.' });
        }

        const { data: existente } = await supabase.from('usuario').select().eq('cpf', cpf).single();
        if (existente) return res.status(400).json({ erro: 'CPF já registrado.' });

        const { error } = await supabase.from('usuario').insert([{
            nome_completo, cpf, email, telefone, senha
        }]);

        if (error) throw error;
        return res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso!' });

    } catch (err) {
        res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
};