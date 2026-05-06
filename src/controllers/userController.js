const supabase = require('../config/supabase');
const { removerSenha, senhaConfere } = require('../services/authService');

exports.cadastrarUsuario = async (req, res) => {
    try {
        const { email, senha, nome_completo, cpf, telefone } = req.body;

        if (!email || !senha || !nome_completo || !cpf) {
            return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios.' });
        }

        const { data: existente } = await supabase.from('usuario').select().eq('cpf', cpf).single();
        if (existente) return res.status(400).json({ erro: 'CPF já registrado.' });

        const { data, error } = await supabase.from('usuario').insert([{
            nome_completo, cpf, email, telefone, senha
        }]).select().single();

        if (error) throw error;
        return res.status(201).json({
            mensagem: 'Usuário cadastrado com sucesso!',
            usuario: removerSenha(data),
        });

    } catch (err) {
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
            .single();

        if (error || !senhaConfere(usuario, senha)) {
            return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
        }

        return res.status(200).json({
            mensagem: 'Login realizado com sucesso!',
            usuario: removerSenha(usuario),
        });
    } catch (err) {
        res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
};

exports.loginGoogle = async (req, res) => {
    try {
        const { email, nome_completo, google_id } = req.body;

        if (!email || !nome_completo || !google_id) {
            return res.status(400).json({ erro: 'Dados do Google incompletos.' });
        }

        const { data: existente } = await supabase
            .from('usuario')
            .select()
            .eq('email', email)
            .maybeSingle();

        if (existente) {
            return res.status(200).json({
                mensagem: 'Login com Google realizado com sucesso!',
                usuario: removerSenha(existente),
            });
        }

        const { data, error } = await supabase
            .from('usuario')
            .insert([{
                nome_completo,
                email,
                cpf: `google:${google_id}`,
                telefone: null,
                senha: null,
            }])
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json({
            mensagem: 'Usuário cadastrado com Google!',
            usuario: removerSenha(data),
        });
    } catch (err) {
        res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
};
