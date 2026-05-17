const supabase = require('../config/supabase');
const { removerSenha, senhaConfere } = require('../services/authService');

exports.cadastrarUsuario = async (req, res) => {
    try {
        const { email, senha, nome_completo, cpf, telefone } = req.body;

        if (!email || !senha || !nome_completo || !cpf) {
            return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios.' });
        }

        const { data: existente } = await supabase.from('usuario').select().eq('cpf', cpf).maybeSingle();
        if (existente) return res.status(400).json({ erro: 'CPF já registrado.' });

        const usuarioData = {
            nome_completo,
            cpf,
            email,
            telefone,
            senha,
        };

        const { data, error } = await supabase.from('usuario').insert([usuarioData]).select().single();

        if (error) throw error;
        return res.status(201).json({
            mensagem: 'Usuário cadastrado com sucesso!',
            usuario: removerSenha(data),
        });

    } catch (err) {
        console.error('Erro ao cadastrar usuário:', err);
        res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
};

exports.loginUsuario = async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ erro: 'Informe e-mail e senha.' });
        }

        const { data: usuario, error } = await supabase
            .from('usuario')
            .select()
            .eq('email', email)
            .maybeSingle();

        if (error) throw error;

        if (!usuario || !senhaConfere(usuario, senha)) {
            return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
        }

        return res.status(200).json({
            mensagem: 'Login realizado com sucesso!',
            usuario: removerSenha(usuario),
        });
    } catch (err) {
        console.error('Erro ao fazer login:', err);
        res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
};
