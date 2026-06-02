require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Erro: SUPABASE_URL ou SUPABASE_KEY não definidos no .env");
    module.exports = new Proxy({}, {
        get() {
            throw new Error('SUPABASE_URL ou SUPABASE_KEY não definidos no ambiente.');
        }
    });
    return;
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
