const logger = require('../../logger');

function removerSenha(usuario) {
    if (!usuario) return null;

    const { senha, ...usuarioSemSenha } = usuario;
    return usuarioSemSenha;
}

function senhaConfere(usuario, senhaInformada) {
    const resultado = Boolean(usuario && usuario.senha === senhaInformada);
    
    if (!resultado) {
        logger.debug('Falha na verificação de senha', {
            service: 'backend-api',
            context: {
                servico: 'authService.senhaConfere',
                usuario_existe: !!usuario
            }
        });
    }
    
    return resultado;
}

module.exports = {
    removerSenha,
    senhaConfere,
};
