const supabase = require('../config/supabase');
const logger = require('../../logger');
const { removerSenha, senhaConfere } = require('../services/authService');

exports.cadastrarUsuario = async (req, res) => {
    try {
        const { email, senha, nome_completo, cpf, telefone } = req.body;

        if (!email || !senha || !nome_completo || !cpf) {
            logger.warn('Tentativa de cadastro com dados incompletos', {
                service: 'backend-api',
                context: {
                    controller: 'userController.cadastrarUsuario',
                    campos_faltantes: {
                        email: !email,
                        senha: !senha,
                        nome_completo: !nome_completo,
                        cpf: !cpf
                    }
                }
            });
            return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios.' });
        }

        const { data: existente } = await supabase.from('usuario').select().eq('cpf', cpf).maybeSingle();
        if (existente) {
            logger.warn('Tentativa de cadastro com CPF já registrado', {
                service: 'backend-api',
                context: {
                    controller: 'userController.cadastrarUsuario',
                    cpf: cpf
                }
            });
            return res.status(400).json({ erro: 'CPF já registrado.' });
        }

        const usuarioData = {
            nome_completo,
            cpf,
            email,
            telefone,
            senha,
        };

        const { data, error } = await supabase.from('usuario').insert([usuarioData]).select().single();

        if (error) throw error;

        logger.info('Usuário cadastrado com sucesso', {
            service: 'backend-api',
            context: {
                controller: 'userController.cadastrarUsuario',
                email: email,
                cpf: cpf
            }
        });

        return res.status(201).json({
            mensagem: 'Usuário cadastrado com sucesso!',
            usuario: removerSenha(data),
        });

    } catch (err) {
        logger.error('Erro ao cadastrar usuário', {
            service: 'backend-api',
            context: {
                controller: 'userController.cadastrarUsuario',
                erro: err.message,
                stack: err.stack
            }
        });
        console.error('Erro ao cadastrar usuário:', err);
        res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
};

exports.loginUsuario = async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            logger.warn('Tentativa de login com credenciais incompletas', {
                service: 'backend-api',
                context: {
                    controller: 'userController.loginUsuario',
                    email: email || 'não informado'
                }
            });
            return res.status(400).json({ erro: 'Informe e-mail e senha.' });
        }

        const { data: usuario, error } = await supabase
            .from('usuario')
            .select()
            .eq('email', email)
            .maybeSingle();

        if (error) throw error;

        if (!usuario || !senhaConfere(usuario, senha)) {
            logger.warn('Tentativa de login com credenciais inválidas', {
                service: 'backend-api',
                context: {
                    controller: 'userController.loginUsuario',
                    email: email,
                    usuario_encontrado: !!usuario
                }
            });
            return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
        }

        logger.info('Login realizado com sucesso', {
            service: 'backend-api',
            context: {
                controller: 'userController.loginUsuario',
                email: email
            }
        });

        return res.status(200).json({
            mensagem: 'Login realizado com sucesso!',
            usuario: removerSenha(usuario),
        });
    } catch (err) {
        logger.error('Erro ao fazer login', {
            service: 'backend-api',
            context: {
                controller: 'userController.loginUsuario',
                erro: err.message,
                stack: err.stack
            }
        });
        console.error('Erro ao fazer login:', err);
        res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
};
