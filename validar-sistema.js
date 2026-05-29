#!/usr/bin/env node

/**
 * Script de Validação Completa do Sistema Arduino + Node.js
 * Verifica todos os pontos de conexão e configuração
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 INICIANDO VALIDAÇÃO COMPLETA DO SISTEMA\n');
console.log('═'.repeat(60));

let erros = [];
let avisos = [];
let sucessos = [];

// ============================================
// 1. VERIFICAR ARQUIVOS NECESSÁRIOS
// ============================================
console.log('\n1️⃣  Verificando Arquivos...');

const arquivosNecessarios = [
    'package.json',
    'src/services/arduinoService.js',
    'src/config/supabase.js',
    'src/services/analyticsService.js',
    '.env'
];

arquivosNecessarios.forEach(arquivo => {
    const caminho = path.join(__dirname, arquivo);
    if (fs.existsSync(caminho)) {
        sucessos.push(`✅ ${arquivo} encontrado`);
    } else {
        erros.push(`❌ ${arquivo} FALTA`);
    }
});

// ============================================
// 2. VERIFICAR VARIÁVEIS DE AMBIENTE
// ============================================
console.log('\n2️⃣  Verificando Variáveis de Ambiente...');

try {
    require('dotenv').config();
    
    const variavelNecessarias = [
        'SUPABASE_URL',
        'SUPABASE_KEY',
        'DATABASE_URL'
    ];

    variavelNecessarias.forEach(varavel => {
        if (process.env[varavel]) {
            sucessos.push(`✅ ${varavel} configurada`);
        } else {
            erros.push(`❌ ${varavel} NÃO CONFIGURADA`);
        }
    });
} catch (err) {
    erros.push(`❌ Erro ao ler .env: ${err.message}`);
}

// ============================================
// 3. VERIFICAR DEPENDÊNCIAS DO PACKAGE.JSON
// ============================================
console.log('\n3️⃣  Verificando Dependências...');

try {
    const packageJson = require('./package.json');
    
    const dependenciasNecessarias = [
        'serialport',
        '@serialport/parser-readline',
        'express',
        '@supabase/supabase-js'
    ];

    dependenciasNecessarias.forEach(dep => {
        if (packageJson.dependencies[dep]) {
            sucessos.push(`✅ ${dep} @${packageJson.dependencies[dep]}`);
        } else if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
            sucessos.push(`✅ ${dep} @${packageJson.devDependencies[dep]} (dev)`);
        } else {
            erros.push(`❌ ${dep} NÃO INSTALADO`);
        }
    });
} catch (err) {
    erros.push(`❌ Erro ao ler package.json: ${err.message}`);
}

// ============================================
// 4. VERIFICAR CÓDIGO DO ARDUINO SERVICE
// ============================================
console.log('\n4️⃣  Verificando Código Arduino Service...');

try {
    const arduinoService = fs.readFileSync('src/services/arduinoService.js', 'utf-8');
    
    const verificacoes = [
        { nome: 'SENSORES array', regex: /const SENSORES = \[.*\]/ },
        { nome: 'Padrão Sensor Regex', regex: /Sensor\s+\(\d+\).*\d+.*cm/i },
        { nome: 'procesarDadosSensor function', regex: /const procesarDadosSensor/ },
        { nome: 'initArduino function', regex: /const initArduino/ },
        { nome: 'SerialPort import', regex: /SerialPort/ },
        { nome: 'Supabase import', regex: /require.*supabase/ }
    ];

    verificacoes.forEach(v => {
        if (v.regex.test(arduinoService)) {
            sucessos.push(`✅ ${v.nome} implementado`);
        } else {
            erros.push(`❌ ${v.nome} NÃO ENCONTRADO`);
        }
    });

    // Verificar se há ID 2 na lista de sensores
    const matchSensores = arduinoService.match(/const SENSORES = \[(.*?)\]/);
    if (matchSensores && matchSensores[1].includes('2')) {
        sucessos.push(`✅ Sensor ID 2 configurado`);
    } else {
        avisos.push(`⚠️  Sensor ID 2 pode não estar na lista SENSORES`);
    }

} catch (err) {
    erros.push(`❌ Erro ao verificar arduinoService.js: ${err.message}`);
}

// ============================================
// 5. VERIFICAR ESTRUTURA DE BANCO DE DADOS
// ============================================
console.log('\n5️⃣  Verificando Configuração Supabase...');

try {
    const supabaseConfig = fs.readFileSync('src/config/supabase.js', 'utf-8');
    
    if (supabaseConfig.includes('createClient')) {
        sucessos.push(`✅ Supabase client configurado`);
    } else {
        erros.push(`❌ Supabase client NÃO CONFIGURADO`);
    }

    if (supabaseConfig.includes('SUPABASE_URL') && supabaseConfig.includes('SUPABASE_KEY')) {
        sucessos.push(`✅ Variáveis de ambiente Supabase utilizadas`);
    } else {
        erros.push(`❌ Variáveis Supabase NÃO UTILIZADAS`);
    }
} catch (err) {
    erros.push(`❌ Erro ao verificar supabase.js: ${err.message}`);
}

// ============================================
// 6. VERIFICAR SERVER.JS
// ============================================
console.log('\n6️⃣  Verificando Server.js...');

try {
    const serverJs = fs.readFileSync('server.js', 'utf-8');
    
    if (serverJs.includes('initArduino')) {
        sucessos.push(`✅ initArduino() chamado no server`);
    } else {
        erros.push(`❌ initArduino() NÃO está sendo chamado`);
    }

    if (serverJs.includes('require') && serverJs.includes('arduinoService')) {
        sucessos.push(`✅ arduinoService importado`);
    } else {
        erros.push(`❌ arduinoService NÃO IMPORTADO`);
    }
} catch (err) {
    erros.push(`❌ Erro ao verificar server.js: ${err.message}`);
}

// ============================================
// RELATÓRIO FINAL
// ============================================
console.log('\n' + '═'.repeat(60));
console.log('\n📊 RESULTADO DA VALIDAÇÃO\n');

if (sucessos.length > 0) {
    console.log(`✅ SUCESSOS (${sucessos.length}):`);
    sucessos.forEach(s => console.log(`   ${s}`));
}

if (avisos.length > 0) {
    console.log(`\n⚠️  AVISOS (${avisos.length}):`);
    avisos.forEach(a => console.log(`   ${a}`));
}

if (erros.length > 0) {
    console.log(`\n❌ ERROS (${erros.length}):`);
    erros.forEach(e => console.log(`   ${e}`));
}

console.log('\n' + '═'.repeat(60));

// Status Final
if (erros.length === 0) {
    console.log('\n🎉 VALIDAÇÃO COMPLETADA COM SUCESSO!');
    console.log('   Sistema pronto para usar. Conecte o Arduino em COM7.\n');
    process.exit(0);
} else {
    console.log(`\n🚨 VALIDAÇÃO COM FALHAS (${erros.length} erro(s) encontrado(s))`);
    console.log('   Corrija os erros acima antes de continuar.\n');
    process.exit(1);
}
