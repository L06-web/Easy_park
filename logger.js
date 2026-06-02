const winston = require('winston');
const Transport = require('winston-transport');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey);
const isVercel = Boolean(process.env.VERCEL);
const supabase = hasSupabaseConfig ? createClient(supabaseUrl, supabaseKey) : null;

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
            if (!supabase) {
                callback();
                return;
            }

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

const transports = [
    new winston.transports.Console()
];

if (!isVercel) {
    transports.push(new winston.transports.File({ filename: 'logs/combined.log' }));
}

if (hasSupabaseConfig) {
    transports.push(new SupabaseTransport());
}

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        // 2. Aplicando a função timezoned no formato do timestamp
        winston.format.timestamp({ format: timezoned }),
        // Adicionar propriedades customizadas ao log
        winston.format.printf(({ timestamp, level, message, service, context, ...rest }) => {
            const logObj = {
                timestamp,
                level: level.toUpperCase(),
                message,
                service: service || 'backend-api',
                context: context || {},
                ...rest
            };
            return JSON.stringify(logObj);
        })
    ),
    transports,
});

if (!isVercel) {
    logger.exceptions.handle(new winston.transports.File({ filename: 'logs/exceptions.log' }));
}

module.exports = logger;
