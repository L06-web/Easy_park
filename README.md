# Easy Park

Easy Park e um sistema de estacionamento inteligente que integra uma API Node.js, um aplicativo mobile em Expo/React Native, banco de dados Supabase e sensores fisicos via ESP32/Arduino. O objetivo do projeto e permitir que usuarios consultem vagas em tempo real, reservem vagas disponiveis e acompanhem indicadores de ocupacao do estacionamento.

## Como o projeto funciona

O fluxo principal do sistema e:

1. Sensores medem a distancia em cada vaga.
2. O ESP32 envia a leitura para a API no endpoint `/api/hardware/sensor`.
3. A API calcula o status da vaga:
   - `L`: livre
   - `O`: ocupada
   - `R`: reservada
4. O status e salvo no Supabase nas tabelas de vagas, sensores e historico.
5. O aplicativo consulta a API para mostrar vagas, login/cadastro e funcionalidades de reserva.
6. O modulo de analytics calcula KPIs, tendencias, horarios de pico e anomalias.

## Tecnologias

- Node.js com Express
- Supabase como banco de dados e persistencia de logs
- Winston para logging estruturado
- Expo/React Native no app mobile
- ESP32/Arduino para leitura e envio dos dados de sensores
- Vercel para deploy da API

## Estrutura do projeto

```text
.
|-- server.js                         # Entrada principal da API Express
|-- api/index.js                      # Adaptador para deploy serverless
|-- logger.js                         # Configuracao de logs
|-- src/
|   |-- config/supabase.js            # Cliente Supabase
|   |-- controllers/                  # Regras dos endpoints
|   |-- routes/                       # Rotas da API
|   |-- services/                     # Servicos auxiliares
|   `-- analytics/                    # Calculo de indicadores, padroes e anomalias
|-- arduino/esp32_sensor_bridge/      # Sketch do ESP32
|-- public/EasyApp/                   # Aplicativo Expo/React Native
|-- logs/                             # Logs locais em desenvolvimento
|-- Documentacao API.md               # Documentacao detalhada da API
`-- validar-sistema.js                # Script legado de validacao
```

## Requisitos

- Node.js instalado
- npm instalado
- Conta/projeto Supabase configurado
- Expo CLI ou uso via `npx expo`
- ESP32/Arduino IDE, caso use a integracao fisica

## Configuracao do backend

Crie um arquivo `.env` na raiz do projeto com as variaveis abaixo:

```env
SUPABASE_URL=sua_url_do_supabase
SUPABASE_KEY=sua_chave_do_supabase
DATABASE_URL=sua_url_de_conexao_se_necessaria
PORT=3000
NODE_ENV=development
```

Instale as dependencias da API:

```bash
npm install
```

Execute o servidor:

```bash
npm start
```

Ou em modo de desenvolvimento:

```bash
npm run dev
```

Por padrao, a API sobe em:

```text
http://localhost:3000
```

Os endpoints de health check sao:

```text
GET /
GET /api
```

## Configuracao do aplicativo mobile

O app esta em `public/EasyApp`.

```bash
cd public/EasyApp
npm install
npm start
```

Para rodar em plataformas especificas:

```bash
npm run android
npm run ios
npm run web
```

O app resolve a URL da API automaticamente. Para configurar manualmente, crie ou ajuste `public/EasyApp/.env`:

```env
EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:3000
```

Em dispositivo fisico, use o IP da maquina na mesma rede do celular, nao `localhost`.

## Principais endpoints

### Usuarios

| Metodo | Rota | Descricao |
|---|---|---|
| `POST` | `/api/usuarios/cadastrar` | Cadastra um usuario |
| `POST` | `/api/usuarios/login` | Realiza login |

Exemplo de cadastro:

```bash
curl -X POST http://localhost:3000/api/usuarios/cadastrar \
  -H "Content-Type: application/json" \
  -d '{
    "nome_completo": "Joao Silva",
    "cpf": "123.456.789-00",
    "email": "joao@email.com",
    "telefone": "11999999999",
    "senha": "senha123"
  }'
```

### Vagas

| Metodo | Rota | Descricao |
|---|---|---|
| `GET` | `/api/vagas/status` | Lista todas as vagas |
| `POST` | `/api/vagas/:id/reservar` | Reserva uma vaga livre |
| `POST` | `/api/vagas/:id/liberar` | Cancela uma reserva |

Exemplo:

```bash
curl http://localhost:3000/api/vagas/status
```

### Hardware

| Metodo | Rota | Descricao |
|---|---|---|
| `POST` | `/api/hardware/sensor` | Recebe dados de distancia enviados pelo ESP32 |

Payload esperado:

```json
{
  "id_sensor": 1,
  "distancia": 25
}
```

Regras:

- Distancia maior que `0` e menor ou igual a `30cm`: vaga ocupada (`O`)
- Distancia maior que `30cm`: vaga livre (`L`)
- Se a vaga estiver reservada (`R`) e o sensor indicar livre, a reserva e mantida

### Analytics

| Metodo | Rota | Descricao |
|---|---|---|
| `GET` | `/api/analytics/kpis` | KPIs em tempo real |
| `GET` | `/api/analytics/tendencia` | Tendencia atual de ocupacao |
| `GET` | `/api/analytics/indicadores` | Indicadores historicos |
| `GET` | `/api/analytics/horarios-pico` | Horarios com maior ocupacao |
| `GET` | `/api/analytics/padroes/:hora/:dia` | Padrao esperado por hora/dia |
| `POST` | `/api/analytics/atualizar-padroes` | Recalcula padroes de ocupacao |
| `GET` | `/api/analytics/anomalias` | Lista anomalias |
| `POST` | `/api/analytics/anomalias/:id/resolver` | Marca anomalia como resolvida |
| `GET` | `/api/analytics/dashboard` | Dados consolidados do dashboard |

## Banco de dados

O projeto usa Supabase. As principais tabelas esperadas sao:

| Tabela | Funcao |
|---|---|
| `usuario` | Armazena dados de cadastro e login |
| `vaga` | Guarda status atual, sensor associado e coordenadas da vaga |
| `sensor` | Guarda telemetria e ultimo sinal recebido |
| `historico_vaga` | Registra mudancas de ocupacao |
| `padroes_ocupacao` | Guarda padroes usados pelo analytics |
| `anomalias` | Guarda anomalias detectadas |
| `system_logs` | Guarda logs estruturados quando Supabase esta configurado |

Datas e horarios gravados pela API usam o fuso de Brasilia (`America/Sao_Paulo`) no formato ISO 8601 com offset, por exemplo `2024-01-15T14:30:00.000-03:00`.

## Integracao com ESP32

O sketch esta em:

```text
arduino/esp32_sensor_bridge/esp32_sensor_bridge.ino
```

Ele le JSON recebido via serial e envia para:

```text
https://easypar.xyz/api/hardware/sensor
```

Antes de gravar no ESP32, ajuste no sketch:

- `WIFI_SSID`
- `WIFI_PASS`
- `SERVER_URL`, caso a API esteja rodando localmente ou em outro dominio

Formato esperado do JSON enviado pelo hardware:

```json
{
  "id_sensor": 1,
  "distancia": 25
}
```

## Logs

O projeto usa `logger.js` com Winston.

Em desenvolvimento, os logs podem ser gravados em:

```text
logs/combined.log
logs/exceptions.log
```

Quando `SUPABASE_URL` e `SUPABASE_KEY` estao configurados, os logs tambem podem ser enviados para a tabela `system_logs`.

## Deploy

O projeto possui `vercel.json` e `api/index.js`, permitindo deploy da API na Vercel. O arquivo `api/index.js` exporta o `server.js`, mantendo a mesma aplicacao Express.

Depois do deploy, configure as variaveis de ambiente no painel da Vercel:

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `DATABASE_URL`, se usada pelo ambiente
- `NODE_ENV=production`

## Observacoes importantes

- As rotas estao publicas no estado atual do projeto.
- As senhas sao persistidas conforme a implementacao atual em `userController`/`authService`; para producao, recomenda-se usar hash seguro de senha e autenticacao com tokens.
- O arquivo `validar-sistema.js` parece refletir uma fase anterior do projeto e ainda procura chamada direta ao `initArduino()` no `server.js`. A implementacao atual prioriza o endpoint HTTP `/api/hardware/sensor`.
- Evite versionar arquivos `.env`, logs, builds e `node_modules`.

## Documentacao adicional

A documentacao detalhada dos endpoints esta em:

```text
Documentacao API.md
```
