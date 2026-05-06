const winston = require('winston');
const Transport = require('winston-transport');
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (use suas chaves reais)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. Função para gerar a data no fuso horário de Brasília
const timezoned = () => {
    return new Date().toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

// Criando um destino customizado para o Supabase
class SupabaseTransport extends Transport {
    constructor(opts) {
        super(opts);
    }

    async log(info, callback) {
        setImmediate(() => { this.emit('logged', info); });

        try {
            await supabase.from('system_logs').insert([{
                level: info.level.toUpperCase(),
                service: info.service || 'backend-api',
                message: info.message,
                context: info.context || {}
            }]);
        } catch (error) {
            console.error('Falha ao salvar log no Supabase:', error);
        }

        callback();
    }
}

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        // 2. Aplicando a função timezoned no formato do timestamp
        winston.format.timestamp({ format: timezoned }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/combined.log' }), // Mantém no arquivo local
        new SupabaseTransport() // Envia para a tabela system_logs no Supabase
    ],
});

module.exports = logger;