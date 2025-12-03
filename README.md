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
# Copie o arquivo de exemplo
cp .env-exemplo .env

# Edite o arquivo .env com suas configurações
nano .env  # ou use seu editor preferido
```

**Conteúdo do arquivo `.env`:**

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

#### **4. Em caso de erro na instalação:**

```bash
rm -rf node_modules package-lock.json
npm install
```

#### **5. Execute a API**

```bash
npm run dev
```

#### **6. Configure a sessão WhatsApp**

1. Crie a sessão:

```bash
curl -X POST http://127.0.0.1:9009/api/sessions \
  -H "Content-Type: application/json" \
  -H "x-api-key: 123456789"
```

2. Obtenha QR Code:

```bash
curl http://127.0.0.1:9009/api/sessions/{sessionId}/qr \
  -H "x-api-key: 123456789"
```

3. Escaneie com WhatsApp (Dispositivos Conectados)
4. Verifique status:

```bash
curl http://127.0.0.1:9009/api/sessions/{sessionId}/status \
  -H "x-api-key: 123456789"
```

---

## 💻 **USO DA API COM X-API-KEY**

> Todas as requisições REST devem usar o header `x-api-key` configurado no `.env`.

Exemplo:

```bash
curl -X GET http://127.0.0.1:9009/api/sessions \
  -H "x-api-key: 123456789"
```

**Exemplo de resposta atualizada:**

```json
{
  "success": true,
  "data": [
    {
      "sessionId": "6a593d1c8fe06bda72f47002a495b080",
      "isConnected": false,
      "status": "connecting",
      "createdAt": "2025-12-03T15:32:43.922Z",
      "lastActivity": "2025-12-03T15:32:43.922Z",
      "user": {
        "id": "6a593d1c8fe06bda72f47002a495b080",
        "name": "MeuDevice"
      }
    },
    {
      "sessionId": "4174496f0536c893ba23e34a219ffd0d",
      "isConnected": false,
      "status": "connected",
      "createdAt": "2025-11-19T15:33:48.362Z",
      "lastActivity": "2025-12-03T15:13:53.682Z"
    }
  ]
}
```

---

## 📤 **ENVIO DE MENSAGENS**

> Todos os endpoints seguem o padrão de envio com `x-api-key`:

Exemplo de mensagem de texto:

```bash
curl -X POST http://127.0.0.1:9009/api/{sessionId}/messages/text \
  -H "Content-Type: application/json" \
  -H "x-api-key: 123456789" \
  -d '{
    "to": "5511999999999",
    "text": "Olá! Mensagem via API Big Conect 🚀"
  }'
```

Exemplo de envio de imagem:

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

---

## ⚙️ **CONFIGURAÇÕES E SEGURANÇA**

* **X-API-KEY**: obrigatória em todas as requisições
* **SECRET_KEY**: usada internamente para tokens e segurança
* **Persistência de sessão**: salva em `./sessions`
* **Recomendação**: usar `IPV4=0.0.0.0` para acesso remoto seguro com firewall

---

## 🛡 **RECURSOS AVANÇADOS**

* Multi-sessões simultâneas
* Reconexão automática
* Sistema anti-ban inteligente
* Webhooks nativos para mensagens recebidas
* Logs detalhados
* Envio otimizado de áudio PTT

---

## 💡 **DICAS IMPORTANTES**

* Use **Session ID** retornado ao criar a sessão
* Escaneie o QR Code via WhatsApp (Dispositivos Conectados)
* Sempre envie `x-api-key` nas requisições
* URLs de mídia devem ser públicas e acessíveis
* Respeite limites de envio para evitar bloqueios

---

<div align="center">

**🚀 API Big Conect - Desenvolvido com ❤️ por System Help**

*Solução profissional para automação WhatsApp Business*

[![GitHub](https://img.shields.io/badge/GitHub-Repository-black)](https://github.com/systemhelpcod/big-conect-api)
[![PIX](https://img.shields.io/badge/Doação-PIX-green)](https://nubank.com.br/pagar)

</div>

