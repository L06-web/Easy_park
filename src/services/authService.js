function removerSenha(usuario) {
    if (!usuario) return null;

    const { senha, ...usuarioSemSenha } = usuario;
    return usuarioSemSenha;
}

function senhaConfere(usuario, senhaInformada) {
    return Boolean(usuario && usuario.senha === senhaInformada);
}

module.exports = {
    removerSenha,
    senhaConfere,
};
