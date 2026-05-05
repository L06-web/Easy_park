const winston = require('winston');
const Transport = require('winston-transport');
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (use suas chaves reais)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/combined.log' }), // Mantém no arquivo
        new SupabaseTransport() // Adiciona o envio para o Supabase
    ],
});

module.exports = logger;