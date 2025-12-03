# 🌐 **API BIG CONECT - Documentação Completa**

<div align="center">

<img src="https://raw.githubusercontent.com/systemhelpcod/big-conect-api/main/Imagem-exemplos/logoapi.jpeg" alt="Big Conect Logo" width="200" height="200" />

**Solução Profissional de Automação WhatsApp Business**

[![CNPJ](https://img.shields.io/badge/CNPJ-48.590.314/0001--18-blue)](https://receitaws.com.br/cnpj/48590314000118)
[![WhatsApp API](https://img.shields.io/badge/WhatsApp-API-green)](https://github.com/systemhelpcod/big-conect-api)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

*Sua solução completa para automação WhatsApp Business*

</div>

---

## 🚀 **INSTALAÇÃO RÁPIDA**

### **Pré-requisitos**

* Node.js 16+ instalado
* Git instalado
* WhatsApp no celular para escanear QR Code

### **Passo a Passo para Instalação**

#### **1. Clone o repositório**

```bash
git clone https://github.com/systemhelpcod/big-conect-api.git
cd big-conect-api
```

#### **2. Configure as variáveis de ambiente**

```bash
cp .env-exemplo .env
nano .env
```

**Exemplo `.env`:**

```env
NODE_ENV=development
PORT=9009
IPV4=0.0.0.0
IPV6=
DOMAIN_SSL=
VIEW_QRCODE_TERMINAL=1
PATCH_TOKENS=./sessions
DEVICE_NAME=Big-Conect-API
HOST_NAME=BigConectAPI
WA_VERSION=
WA_URL=
AUTO_CLOSE=15
SECRET_KEY=123456789
SECRET_APIKEY=123456789
WEBHOOK_URL=https://exemplo/webhook-test/api
LOG_LEVEL=debug
ALLOWED_ORIGINS=*
```

#### **3. Instale as dependências**

```bash
npm install
```

#### **4. Caso ocorra erro na instalação**

```bash
rm -rf node_modules package-lock.json
npm install
```

#### **5. Execute a API**

```bash
npm run dev
```

#### **6. Configure a sessão WhatsApp**

1. Crie a sessão: `POST /api/sessions`
2. Obtenha QR Code: `GET /api/sessions/{sessionId}/qr`
3. Escaneie com WhatsApp (Dispositivos Conectados)
4. API pronta para uso 🎉

---

## 💻 **USO DA API COM X-API-KEY**

> Todos os endpoints exigem o header `x-api-key` com a chave do `.env` (`SECRET_APIKEY`).

```http
x-api-key: 123456789
```

Exemplo `curl` para criar sessão:

```bash
curl -X POST http://127.0.0.1:9009/api/sessions \
  -H "Content-Type: application/json" \
  -H "x-api-key: 123456789"
```

---

## 📋 **ENDPOINTS PRINCIPAIS**

### 🔄 **Gestão de Sessões**

* **Criar Nova Sessão**

```bash
curl -X POST http://127.0.0.1:9009/api/sessions \
  -H "Content-Type: application/json" \
  -H "x-api-key: 123456789"
```

* **Listar Sessões**

```bash
curl -X GET http://127.0.0.1:9009/api/sessions \
  -H "x-api-key: 123456789"
```

* **Obter QR Code**

```bash
curl -X GET http://127.0.0.1:9009/api/sessions/{sessionId}/qr \
  -H "x-api-key: 123456789"
```

* **Status da Sessão**

```bash
curl -X GET http://127.0.0.1:9009/api/sessions/{sessionId}/status \
  -H "x-api-key: 123456789"
```

* **Deletar Sessão**

```bash
curl -X DELETE http://127.0.0.1:9009/api/sessions/{sessionId} \
  -H "x-api-key: 123456789"
```

---

## 📤 **Envio de Mensagens**

> Todos os endpoints abaixo exigem `x-api-key`.

* **Mensagem de Texto**

```bash
curl -X POST http://127.0.0.1:9009/api/{sessionId}/messages/text \
  -H "Content-Type: application/json" \
  -H "x-api-key: 123456789" \
  -d '{"to":"5511999999999","text":"Olá! Mensagem via API Big Conect 🚀"}'
```

* **Mensagem Formatada**

```bash
curl -X POST http://127.0.0.1:9009/api/{sessionId}/messages/text \
  -H "Content-Type: application/json" \
  -H "x-api-key: 123456789" \
  -d '{
    "to": "5511999999999",
    "text": "🚀 *Mensagem Formatada*\n✅ Negrito: *texto*\n✅ Itálico: _texto_\n✅ Tachado: ~texto~"
  }'
```

* **Imagem**

```bash
curl -X POST http://127.0.0.1:9009/api/{sessionId}/messages/media \
  -H "Content-Type: application/json" \
  -H "x-api-key: 123456789" \
  -d '{
    "to": "5511999999999",
    "mediaUrl": "https://raw.githubusercontent.com/systemhelpcod/big-conect-api/main/Imagem-exemplos/logoapi.jpeg",
    "type": "image",
    "caption": "Logo Big Conect 🖼️"
  }'
```

* **Vídeo**

```bash
curl -X POST http://127.0.0.1:9009/api/{sessionId}/messages/media \
  -H "Content-Type: application/json" \
  -H "x-api-key: 123456789" \
  -d '{
    "to": "5511999999999",
    "mediaUrl": "https://example.com/video.mp4",
    "type": "video",
    "caption": "Vídeo enviado via API! 🎥"
  }'
```

* **Áudio PTT**

```bash
curl -X POST http://127.0.0.1:9009/api/{sessionId}/messages/media \
  -H "Content-Type: application/json" \
  -H "x-api-key: 123456789" \
  -d '{
    "to": "5511999999999",
    "mediaUrl": "https://example.com/audio.mp3",
    "type": "audio",
    "ptt": true,
    "forceOpus": true
  }'
```

* **Documento/PDF**

```bash
curl -X POST http://127.0.0.1:9009/api/{sessionId}/messages/media \
  -H "Content-Type: application/json" \
  -H "x-api-key: 123456789" \
  -d '{
    "to": "5511999999999",
    "mediaUrl": "https://example.com/document.pdf",
    "type": "document",
    "fileName": "documento.pdf",
    "caption": "Documento importante 📄"
  }'
```

* **Botões**

```bash
curl -X POST http://127.0.0.1:9009/api/{sessionId}/messages/buttons \
  -H "Content-Type: application/json" \
  -H "x-api-key: 123456789" \
  -d '{
    "to": "5511999999999",
    "text": "Escolha uma opção:",
    "buttons": [
      {"id": "btn1", "text": "Opção 1"},
      {"id": "btn2", "text": "Opção 2"}
    ]
  }'
```

* **Listas**

```bash
curl -X POST http://127.0.0.1:9009/api/{sessionId}/messages/list \
  -H "Content-Type: application/json" \
  -H "x-api-key: 123456789" \
  -d '{
    "to": "5511999999999",
    "text": "Selecione um item:",
    "sections": [
      {
        "title": "Seção 1",
        "rows": [
          {"id": "item1", "title": "Item 1"},
          {"id": "item2", "title": "Item 2"}
        ]
      }
    ]
  }'
```

* **Reações**

```bash
curl -X POST http://127.0.0.1:9009/api/{sessionId}/messages/reactions \
  -H "Content-Type: application/json" \
  -H "x-api-key: 123456789" \
  -d '{
    "to": "5511999999999",
    "messageId": "ABCD1234",
    "reaction": "👍"
  }'
```

* **Mensagens em Lote**

```bash
curl -X POST http://127.0.0.1:9009/api/{sessionId}/messages/batch \
  -H "Content-Type: application/json" \
  -H "x-api-key: 123456789" \
  -d '[
    {"to":"5511999999999","text":"Mensagem 1"},
    {"to":"5511999999998","text":"Mensagem 2"}
  ]'
```

---

## 🛠 **CONFIGURAÇÃO E MONITORAMENTO**

* **Health Check**

```bash
curl -X GET http://127.0.0.1:9009/health \
  -H "x-api-key: 123456789"
```

* **Informações da API**

```bash
curl -X GET http://127.0.0.1:9009/ \
  -H "x-api-key: 123456789"
```

---

## ✅ **NOTAS IMPORTANTES**

1. `x-api-key` obrigatório em todos os endpoints
2. `.env` atualizado com `SECRET_APIKEY`
3. Use sempre `IPV4=0.0.0.0` para conexões externas
4. Sessões retornam `user.id` e `user.name`
5. Mensagens multimídia, botões, listas e reações seguem padrão do header `x-api-key`

---

<div align="center">

**🚀 API Big Conect - Desenvolvido com ❤️ por System Help**

*Solução profissional para automação WhatsApp Business*

[![GitHub](https://img.shields.io/badge/GitHub-Repository-black)](https://github.com/systemhelpcod/big-conect-api)
[![PIX](https://img.shields.io/badge/Doação-PIX-green)](https://nubank.com.br/pagar)

</div>

---
