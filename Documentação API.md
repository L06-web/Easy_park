# 📑 Documentação da API - Easy Park

Esta API gerencia o sistema de estacionamento inteligente, conectando sensores físicos (Arduino/ESP32) ao banco de dados, fornecendo dados para o aplicativo mobile e oferecendo análises avançadas de ocupação.

## 📍 Informações Gerais

- **Base URL:** `https://easypar.xyz/`
    
- **Formato de Dados:** JSON

- **Datas e Horários:** campos como `timestamp`, `data_hora` e `ultimo_sinal` usam o fuso de Brasília (`America/Sao_Paulo`) em ISO 8601 com offset, por exemplo `2024-01-15T14:30:00.000-03:00`.
    
- **Autenticação:** No momento, as rotas são públicas.
    
- **Logging:** Todos os eventos são registrados com contexto estruturado para auditoria e troubleshooting.
    

---

## 🛣️ Endpoints de Usuários

Gerencia o cadastro e autenticação de motoristas.

### 1. Cadastrar Usuário

Cria um novo perfil no sistema.

- **URL:** `/api/usuarios/cadastrar`
    
- **Método:** `POST`
    
- **Corpo da Requisição (JSON):**
```json
{
  "nome_completo": "João Daniel",
  "cpf": "123.456.789-00",
  "email": "joaodaniel@email.com",
  "telefone": "11999999999",
  "senha": "minhasenhasecreta"
}
```

- **Validações:**
  - `email` é obrigatório
  - `senha` é obrigatória
  - `nome_completo` é obrigatório
  - `cpf` é obrigatório e único
  - `telefone` é opcional

- **Resposta de Sucesso (201):**   
```json e gerenciar reservas.

### 3. Listar Status das Vagas

Retorna a lista de todas as vagas e seus status.

**Códigos de Status:**
- `L`: livre
- `O`: ocupado
- `R`: reservado

- **URL:** `/api/vagas/status`
    
- **Método:** `GET`
    
- **Parâmetros:** nenhum

- **Resposta de Sucesso (200):**
```json
[
  {
    "id_vaga": 1,
    "status_atual": "L",
    "id_sensor": 1,
    "latitude": -23.5505,
    "longitude": -46.6333
  },
  {
    "id_vaga": 2,
    "status_atual": "O",
    "id_sensor": 2,
    "latitude": -23.5510,
    "longitude": -46.6340
  }
]
```

- **Erros Possíveis:**
  - `500`: Erro ao carregar mapa de vagas

---

### 4. Reservar Vaga

Reserva uma vaga para um motorista.

- **URL:** `/api/vagas/:id/reservar`
    
- **Método:** `POST`
    
- **Parâmetro URL:** 
  - `id` - ID da vaga a ser reservada

- **Corpo da Requisição:** vazio

- **Validações:**
  - Vaga deve estar livre (`L`)
  - Vaga deve existir no banco

- **Resposta de Sucesso (200):**
```json
{
  "mensagem": "Vaga reservada com sucesso!",
  "vaga": {
    "id_vaga": 1,
    "status_atual": "R",
    "id_sensor": 1,
    "latitude": -23.5505,
    "longitude": -46.6333
  },
  "analise": {
    "evento_registrado": true,
    "timestamp": "2024-01-15T14:30:00.000-03:00"
  }
}
```

- **Erros Possíveis:**
  - `400`: ID da vaga não informado
  - `404`: Vaga não encontrada
  - `409`: Vaga não está disponível para reserva
  - `500`: Erro ao reservar vaga

---

### 5. Liberar Vaga (Desfazer Reserva)

Cancela a reserva de uma vaga.

- **URL:** `/api/vagas/:id/liberar`
    
- **Método:** `POST`
    /ESP32)

### 6. Receber Dados de Sensor via HTTP

Endpoint para o ESP32 enviar leituras de distância via HTTP.

- **URL:** `/api/hardware/sensor`
    
- **Método:** `POST`
    
- **Corpo da Requisição (JSON):**
```json
{
  "id_sensor": 1,
  "distancia": 25
}
```

- **Lógica de Negócio:**
    - Distância **<= 30cm**: Vaga marcada como `O` (ocupada)
    - Distância **> 30cm**: Vaga marcada como `L` (livre)
    - Se vaga estava `R` (reservada) e leitura indica `L`, **mantém `R`**

- **Ações Automáticas:**
    1. Atualiza `ultimo_sinal` na tabela `sensor`
    2. Busca vaga associada ao sensor
    3. Atualiza `status_atual` na tabela `vaga` se o status mudou
    4. Registra nova entrada na tabela `historico_vaga` **apenas se o status mudar**

- **Resposta de Sucesso (200):**
```json
{
  "mensagem": "Sensor atualizado com sucesso",
  "vaga_id": 1,
  "status_atual": "L"
}
```

- **Erros Possíveis:**
  - `400`: Dados incompletos (id_sensor e distancia obrigatórios)
  - `404`: Vaga não encontrada para este sensor
  - `500`: Erro ao processar dados do sensor

---

### Fluxo de Dados Serial (Legado)

Alternativamente, o sistema também suporta comunicação serial com Arduino:

- **Porta:** `COM7` (ou configurada via código)
- **Baud Rate:** `9600`
- **Formato:** Mesmo processamento que o endpoint HTTP
    "timestamp": "2024-01-15T14:32:00.000-03:00"
  }
}
```

- **Erros Possíveis:**
  - `400`: ID da vaga não informado
  - `404`: Vaga não encontrada
  - `409`: Apenas vagas reservadas podem ser liberadas
  - `500`: Erro ao desfazer reserva*Método:** `POST`
    
- **Corpo da Requisição (JSON):**
```json
{
  "email": "itachi@clauchiha.com",
  "senha": "minhasenhasecreta"
}
```

- **Validações:**
  - `email` é obrigatório
  - `senha` é obrigatória

- **Resposta de Sucesso (200):**   
```json
{
  "mensagem": "Login realizado com sucesso!",
  "usuario": {
    "id": 1,
    "nome_completo": "Itachi Uchiha",
    "cpf": "123.456.789-00",
    "email": "itachi@clauchiha.com",
    "telefone": "11999999999"
  }
}
```

- **Erros Possíveis:**
  - `400`: Email ou senha não informados
  - `401`: Credenciais inválidas
  - `500`: Erro ao processar requisição

---

## 🅿️ Endpoints de Vagas (Estacionamento)

Utilizados pelo Aplicativo Mobile para exibir o status real do pátio.

### 2. Listar Status das Vagas

Retorna a lista de todas as vagas e se estão livres ou ocupadas.

O campo `status_atual` é armazenado com códigos compactos:

- `L`: livre
- `O`: ocupado
- `R`: reservado

- **URL:** `/api/vagas/status`
    
- **Método:** `GET`
    
- **Resposta de Sucesso (200):**
```json
    [
      {
        "id_vaga": 1,
        "status_atual": "L",
        "id_sensor": 1,
        "ultimo_sinal": "2023-10-27T14:30:00.000-03:00"
      }
    ]
```
---� Endpoints de Analytics

Fornecem análises avançadas sobre padrões de ocupação e anomalias.

### 7. Obter KPIs em Tempo Real

Retorna indicadores-chave de performance do estacionamento.

- **URL:** `/api/analytics/kpis`
    
- **Método:** `GET`
    
- **Parâmetros Query (opcionais):**
  - `periodo` - Período de análise (padrão: `agora`)

- **Resposta de Sucesso (200):**
```json
{
  "ocupacao": {
    "taxa_percentual": 75.5,
    "vagas_ocupadas": 151,
    "vagas_livres": 49,
    "total_vagas": 200
  },
  "tendencia": {
    "direcao": "crescente",
    "variabilidade": "alta",
    "desvio_padrao": 12.5
  },
  "timestamp": "2024-01-15T14:30:00.000-03:00"
}
```

---, `nome_completo`, `telefone`|
|**vaga**|Estado atual das vagas|`id_vaga`, `status_atual`, `id_sensor`, `latitude`, `longitude`|
|**sensor**|Telemetria do hardware|`id_sensor`, `ultimo_sinal`|
|**historico_vaga**|Logs de rotatividade|`id_vaga`, `status_registrado`, `data_hora`|
|**padroes_ocupacao**|Padrões de ocupação por hora/dia|`hora`, `dia_semana`, `taxa_media`, `desvio_padrao`|
|**anomalias**|Anomalias detectadas|`id`, `tipo`, `timestamp`, `status`, `ocupacao_observad
Retorna a tendência de ocupação em tempo real.

- **URL:** `/api/analytics/tendencia`
    
- **Método:** `GET`

- **Resposta de Sucesso (200):**
```json
{
  "direcao": "crescente",
  "variabilidade": "alta",
  "desvio_padrao": 12.5,
  "ocupacao_atual": 75.5,
  "timestamp": "2024-01-15T14:30:00.000-03:00"
}
```

---

### 9. Obter Indicadores Históricos

Retorna indicadores históricos em um período.

- **URL:** `/api/analytics/indicadores`
    
- **Método:** `GET`

- **Parâmetros Query (opcionais):**
  - `periodo` - Período de análise (padrão: `24h`). Valores: `24h`, `7d`, `30d`

- **Resposta de Sucesso (200):**
```json
[
  {
    "timestamp": "2024-01-15T13:00:00.000-03:00",
    "taxa_ocupacao": 72.0,
    "rotatividade": 45,
    "tempo_medio_ocupacao": 45
  },
  {
    "timestamp": "2024-01-15T14:00:00.000-03:00",
    "taxa_ocupacao": 75.5,
    "rotatividade": 52,
    "tempo_medio_ocupacao": 48
  }
]
```

---

### 10. Obter Horários de Pico

Retorna padrões de horários com maior ocupação.

- **URL:** `/api/analytics/horarios-pico`
    
- **Método:** `GET`

- **Resposta de Sucesso (200):**
```json
{
  "horarios_pico": [
    {
      "hora": 12,
      "ocupacao_media": 88.5,
      "confianca": 0.95
    },
    {
      "hora": 13,
      "ocupacao_media": 92.0,
      "confianca": 0.94
    },
    {
      "hora": 18,
      "ocupacao_media": 85.5,
      "confianca": 0.93
    }
  ]
}
```

---

### 11. Obter Padrão de Ocupação

Retorna padrão esperado para uma hora/dia específica.

- **URL:** `/api/analytics/padroes/:hora/:dia`
    
- **Método:** `GET`

- **Parâmetros URL:**
  - `hora` - Hora do dia (0-23)
  - `dia` - Dia da semana (0=domingo, 6=sábado)

- **Resposta de Sucesso (200):**
```json
{
  "hora": 12,
  "dia": 2,
  "taxa_esperada": 85.0,
  "confianca": 0.92,
  "desvio_padrao": 8.5
}
```

- **Erros Possíveis:**
  - `400`: Hora e dia devem ser números válidos
  - `404`: Padrão não encontrado

---

### 12. Atualizar Padrões de Ocupação

Recalcula os padrões baseado nos dados históricos.

- **URL:** `/api/analytics/atualizar-padroes`
    
- **Método:** `POST`

- **Corpo da Requisição:** vazio

- **Resposta de Sucesso (200):**
```json
{
  "mensagem": "Padrões atualizados com sucesso",
  "padroes_atualizados": 168
}
```

---

### 13. Obter Anomalias Detectadas

Retorna anomalias encontradas no comportamento de ocupação.

- **URL:** `/api/analytics/anomalias`
    
- **Método:** `GET`

- **Parâmetros Query (opcionais):**
  - `status` - Filtro por status (padrão: `pendentes`). Valores: `pendentes`, `todas`
  - `limite` - Quantidade máxima de resultados (padrão: `20`)

- **Resposta de Sucesso (200):**
```json
[
  {
    "id": 1,
    "tipo": "pico_anomalo",
    "timestamp": "2024-01-15T14:30:00.000-03:00",
    "ocupacao_observada": 98.5,
    "ocupacao_esperada": 75.0,
    "status": "pendente"
  },
  {
    "id": 2,
    "tipo": "queda_abrupta",
    "timestamp": "2024-01-15T15:00:00.000-03:00",
    "ocupacao_observada": 15.0,
    "ocupacao_esperada": 78.0,
    "status": "pendente"
  }
]
```

---

### 14. Resolver Anomalia

Marca uma anomalia como resolvida.

- **URL:** `/api/analytics/anomalias/:id/resolver`
    
- **Método:** `POST`

- **Parâmetro URL:**
  - `id` - ID da anomalia

- **Corpo da Requisição:** vazio

- **Resposta de Sucesso (200):**
```json
{
  "mensagem": "Anomalia marcada como resolvida",
  "anomalia": {
    "id": 1,
    "status": "resolvida"
  }
}
```

---

### 15. Obter Dashboard

Retorna um resumo consolidado para o dashboard.

- **URL:** `/api/analytics/dashboard`
    
- **Método:** `GET`

- **Resposta de Sucesso (200):**
```json
{
  "kpis": {
    "ocupacao": { "taxa_percentual": 75.5 },
    "tendencia": { "direcao": "crescente" }
  },
  "anomalias_pendentes": 2,
  "horarios_pico": [12, 13, 18],
  "timestamp": "2024-01-15T14:30:00.000-03:00"
}
```

---

## �

## 🛰️ Integração com Hardware (Arduino)

Não é um endpoint HTTP, mas uma rotina de serviço interna.

### Fluxo de Dados Serial

- **Porta:** `COM7` (ou configurada via código)
    
- **Baud Rate:** `9600`
    
- **Lógica de Negócio:**
    
    - Distância **<= 30cm**: Vaga marcada como `O`.
        
    - Distância **> 30cm**: Vaga marcada como `L`.
        
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
|---|1**|Unauthorized|Credenciais inválidas (email/senha incorretos).|
|**404**|Not Found|A vaga, usuário ou recurso solicitado não existe no banco.|
|**409**|Conflict|Conflito de estado (ex: tentar reservar vaga ocupada).|
|**500**|Internal Server Error|Erro de conexão com o Supabase, porta serial ocupada ou erro no processamento.|

## 📝 Exemplo de Fluxo Completo

### Exemplo 1: Cadastro e Login de Usuário

1. **Cadastro:**
```bash
curl -X POST https://easypar.xyz/api/usuarios/cadastrar \
  -H "Content-Type: application/json" \
  -d '{
    "nome_completo": "João Silva",
    "cpf": "123.456.789-00",
    "email": "joao@email.com",
    "telefone": "11999999999",
    "senha": "senha123"
  }'
```

2. **Login:**
```bash
curl -X POST https://easypar.xyz/api/usuarios/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@email.com",
    "senha": "senha123"
  }'
```

### Exemplo 2: Consultar Vagas e Fazer Reserva

1. **Listar vagas:**
```bash
curl -X GET https://easypar.xyz/api/vagas/status
```

2. **Reservar vaga (ID 5):**
```bash
curl -X POST https://easypar.xyz/api/vagas/5/reservar
```

3. **Desfazer reserva:**
```bash
curl -X POST https://easypar.xyz/api/vagas/5/liberar
```

### Exemplo 3: ESP32 Enviando Dados de Sensor

```bash
curl -X POST https://easypar.xyz/api/hardware/sensor \
  -H "Content-Type: application/json" \
  -d '{
    "id_sensor": 1,
    "distancia": 25
  }'
```

### Exemplo 4: Verificar Analytics

1. **KPIs em tempo real:**
```bash
curl -X GET https://easypar.xyz/api/analytics/kpis
```

2. **Horários de pico:**
```bash
curl -X GET https://easypar.xyz/api/analytics/horarios-pico
```

3. **Anomalias:**
```bash
curl -X GET "https://easypar.xyz/api/analytics/anomalias?status=pendentes&limite=10"
```

## 📋 Resumo de Mudanças Recentes

### v2.0 - Analytics e Reservas

- ✅ Adicionado sistema de reservas de vagas
- ✅ Adicionado endpoint HTTP para ESP32 (complementa comunicação serial)
- ✅ Novo módulo de Analytics com detecção de padrões e anomalias
- ✅ Novos endpoints para KPIs, tendências e indicadores
- ✅ Sistema de login de usuários implementado
- ✅ Estrutura de logging melhorada com contexto estruturado
- ✅ Suporte a coordenadas geográficas (latitude/longitude) nas vagas
|**404**|Not Found|A vaga ou usuário com aquele ID não existe no banco.|
|**500**|Internal Server Error|Geralmente erro de conexão com o Supabase ou porta serial ocupada.|
