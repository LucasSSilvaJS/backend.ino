# Projeto: ThingSpeak + MongoDB Monolito

## Descrição

Este projeto é um sistema monolito em Node.js que:

- Consulta dados de um canal ThingSpeak.
- Salva as leituras em um banco MongoDB usando Mongoose.
- Disponibiliza uma API REST para consultar os últimos registros.

O sistema é simples, com tudo em um único arquivo (`index.js`). Serve como prova de conceito ou base para projetos maiores.

---

## Tecnologias Utilizadas

- **Node.js**
- **Express** (API REST)
- **Axios** (requisições HTTP para ThingSpeak)
- **MongoDB + Mongoose** (armazenamento de dados)
- **dotenv** (variáveis de ambiente)

---

## Estrutura do Projeto

```
projeto-thingspeak/
│── index.js          # Código principal
│── package.json
│── .env              # Variáveis de ambiente
```

---

## Configuração

1. **Instalar dependências**
   ```bash
   npm install express mongoose axios dotenv
   ```

2. **Criar arquivo `.env`**
   ```
   MONGO_URI=mongodb://localhost:27017/thingspeak
   THINGSPEAK_CHANNEL_ID=SEU_CHANNEL_ID
   THINGSPEAK_API_KEY=SUA_API_KEY
   PORT=3000
   ```

- `MONGO_URI`: URL do MongoDB (local ou Atlas)
- `THINGSPEAK_CHANNEL_ID`: ID do canal ThingSpeak
- `THINGSPEAK_API_KEY`: Chave de leitura do canal
- `PORT`: Porta onde o servidor vai rodar

---

## Executando o Projeto

1. Suba o MongoDB (local ou remoto).
2. Rode o projeto:
   ```bash
   node index.js
   ```

O servidor estará disponível em:  
`http://localhost:3000`

---

## Endpoints

### GET `/`

Mensagem de teste para verificar se a API está rodando.

### GET `/leituras`

Retorna os últimos 100 registros do ThingSpeak salvos no MongoDB, ordenados do mais recente para o mais antigo.

**Exemplo de resposta:**
```json
[
  {
    "_id": "652d3a7c8b2a9b0012345678",
    "created_at": "2025-09-30T18:00:00Z",
    "temperatura": 25.3,
    "umidade": 60,
    "iluminacao": 120,
    "createdAt": "2025-09-30T18:01:00Z",
    "updatedAt": "2025-09-30T18:01:00Z",
    "__v": 0
  }
]
```

---

## Atualização Automática

Os dados do ThingSpeak são importados a cada 1 minuto automaticamente:

```js
setInterval(importarDados, 60000);
```

---

## Observações

- Projeto monolito, tudo em um único arquivo, ideal para testes e protótipos.
- Pode ser estendido para usar rotas separadas, controllers e serviços (padrão MVC).
- Para produção, recomenda-se implementar validação de dados e tratamento de erros mais robusto.

[Confira a API](https://backend-ino.onrender.com/leituras)