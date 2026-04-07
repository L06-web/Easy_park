# 📑 Documentação da API - Easy Park

Esta API gerencia o sistema de estacionamento inteligente, conectando sensores físicos (Arduino) ao banco de dados e fornecendo dados para o aplicativo mobile.

## 📍 Informações Gerais

- **Base URL (Local):** `http://localhost:3000` (servidor ainda está rodando localmente)
    
- **Formato de Dados:** JSON
    
- **Autenticação:** No momento, as rotas são públicas.
    

---

## 🛣️ Endpoints de Usuários

Gerencia o cadastro e futuramente a autenticação de motoristas.

### 1. Cadastrar Usuário

Cria um novo perfil no sistema.

- **URL:** `/api/usuarios/cadastrar`
    
- **Método:** `POST`
    
- **Corpo da Requisição (JSON):**
```json
    {
      "nome_completo": "Itachi Uchiha",
      "cpf": "123.456.789-00",
      "email": "itachi@clauchiha.com",
      "telefone": "11999999999",
      "senha": "minhasenhasecreta"
    }
```
- **Resposta de Sucesso (201):**   
```json
      { "mensagem": "Usuário cadastrado com sucesso!" }
```

---

## 🅿️ Endpoints de Vagas (Estacionamento)

Utilizados pelo Aplicativo Mobile para exibir o status real do pátio.

### 2. Listar Status das Vagas

Retorna a lista de todas as vagas e se estão livres ou ocupadas.

- **URL:** `/api/vagas/status`
    
- **Método:** `GET`
    
- **Resposta de Sucesso (200):**
```json
    [
      {
        "id_vaga": 1,
        "status_atual": "LIVRE",
        "id_sensor": 1,
        "ultimo_sinal": "2023-10-27T14:30:00Z"
      }
    ]
```
---

## 🛰️ Integração com Hardware (Arduino)

Não é um endpoint HTTP, mas uma rotina de serviço interna.

### Fluxo de Dados Serial

- **Porta:** `COM7` (ou configurada via código)
    
- **Baud Rate:** `9600`
    
- **Lógica de Negócio:**
    
    - Distância **<= 30cm**: Vaga marcada como `OCUPADA`.
        
    - Distância **> 30cm**: Vaga marcada como `LIVRE`.
        
- **Ações Automáticas:**
    
    1. Atualiza `ultimo_sinal` na tabela `sensor`.
        
    2. Atualiza `status_atual` na tabela `vaga`.
        
    3. Registra nova entrada na tabela `historico_vaga` **apenas se o status mudar**.
        

---

## 🗄️ Estrutura do Banco de Dados (Supabase)

|**Tabela**|**Função**|**Colunas Principais**|
|---|---|---|
|**usuario**|Dados dos clientes|`id`, `cpf`, `email`, `senha`|
|**vaga**|Estado atual das vagas|`id_vaga`, `status_atual`, `id_sensor`|
|**sensor**|Telemetria do hardware|`id_sensor`, `ultimo_sinal`|
|**historico_vaga**|Logs de rotatividade|`id_vaga`, `status_registrado`, `data_hora`|

---

## ⚠️ Códigos de Erro Comuns

|**Código**|**Descrição**|**Solução**|
|---|---|---|
|**400**|Bad Request|Verifique se enviou todos os campos obrigatórios no JSON.|
|**404**|Not Found|A vaga ou usuário com aquele ID não existe no banco.|
|**500**|Internal Server Error|Geralmente erro de conexão com o Supabase ou porta serial ocupada.|