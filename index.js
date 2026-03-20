require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

// 1. IMPORTAR O CORS (Adiciona esta linha junto com os outros 'require')
const cors = require('cors');

const app = express();

// 2. ATIVAR O CORS (Tem de ser logo aqui, antes do express.json e das tuas rotas!)
app.use(cors());

// Permite ao Express entender JSON
app.use(express.json());
// Configurar a conexão com o Supabase usando as chaves secretas
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Criar a rota para cadastrar o usuário (Método POST)
app.post('/cadastrar', async (req, res) => {
    // Extrair o email e a senha que vêm no corpo da requisição (body)
    const { email, senha } = req.body;
    // Validação básica de segurança
    if (!email || !senha) {
        return res.status(400).json({ erro: 'Por favor, envia e-mail e senha.' });
    }
    try {
        const { email, senha, nome_completo, cpf, telefone } = req.body;

        if (!email || !senha || !nome_completo || !cpf) {
            return res.status(400).json({ erro: 'Por favor, preenche todos os campos obrigatórios.' });
        }

        // const { data: authData, error: authError } = await supabase.auth.signUp({
        //     email: email,
        //     password: senha,
        // });

        // if (authError) {
        //     return res.status(400).json({ erro: authError.message });
        // }

        const { data } = await supabase.from('usuario').select().eq('cpf', cpf).single();

        if (data) {
            return res.status(400).json({ erro: 'CPF já registrado.' });
        }


        const { error: dbError } = await supabase
            .from('usuario')
            .insert([
                {
                    nome_completo: nome_completo,
                    cpf: cpf,
                    email: email,
                    telefone: telefone,
                    senha: senha,
                }
            ]);
        if (dbError) {
            console.error("Erro ao gravar na tabela:", dbError);
            return res.status(400).json({ erro: 'Conta criada, mas erro ao guardar perfil.' });
        }
        return res.status(201).json({
            mensagem: 'Usuário e perfil cadastrados com sucesso!'
            // usuario_id: authData.user.id
        });
    } catch (err) {
        console.error('Erro no servidor:', err);
        return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }

});



// Ligar o servidor na porta 3000
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor a rodar na porta http://localhost:${PORT}`);
});