# 🌐 **API BIG CONECT - Documentação Completa**

## 🚀 **VISÃO GERAL**
A **API Big Conect** é uma API completa para integração com WhatsApp Web, permitindo enviar e receber mensagens, gerenciar múltiplas sessões e muito mais através de endpoints REST.

**URL Base:** `http://127.0.0.1:9009`

---

## 📋 **ENDPOINTS PRINCIPAIS**

### 🔄 **GESTÃO DE SESSÕES**

#### **1. Criar Nova Sessão**
```bash
curl -X POST http://127.0.0.1:9009/api/sessions \
  -H "Content-Type: application/json"
```
**Resposta:**
```json
{
  "success": true,
  "data": {
    "sessionId": "82e49c51d6c9efde4feece792e88cc5a",
    "isConnected": false,
    "status": "connecting",
    "createdAt": "2025-11-19T14:49:30.118Z",
    "lastActivity": "2025-11-19T14:49:30.118Z"
  },
  "message": "Session created successfully"
}
```

#### **2. Listar Todas as Sessões**
```bash
curl http://127.0.0.1:9009/api/sessions
```

#### **3. Obter QR Code**
```bash
curl http://127.0.0.1:9009/api/sessions/{sessionId}/qr
```

#### **4. Verificar Status da Sessão**
```bash
curl http://127.0.0.1:9009/api/sessions/{sessionId}/status
```

#### **5. Deletar Sessão**
```bash
curl -X DELETE http://127.0.0.1:9009/api/sessions/{sessionId}
```

---

## 📤 **ENVIO DE MENSAGENS**

### **6. Mensagem de Texto Simples**
```bash
curl -X POST http://127.0.0.1:9009/api/{sessionId}/messages/text \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "text": "Olá! Mensagem via API Big Conect 🚀"
  }'
```

### **7. Mensagem com Formatação**
```bash
curl -X POST http://127.0.0.1:9009/api/{sessionId}/messages/text \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "text": "🚀 *Mensagem Formatada*\n\n✅ Negrito: *texto*\n✅ Itálico: _texto_\n✅ Tachado: ~texto~\n\n*API Big Conect* _funcionando_ ~perfeitamente~!"
  }'
```

### **8. Enviar Imagem**
```bash
curl -X POST http://127.0.0.1:9009/api/{sessionId}/messages/media \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "mediaUrl": "https://example.com/image.jpg",
    "type": "image",
    "caption": "Imagem enviada via API! 🖼️"
  }'
```

### **9. Enviar Vídeo**
```bash
curl -X POST http://127.0.0.1:9009/api/{sessionId}/messages/media \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "mediaUrl": "https://example.com/video.mp4",
    "type": "video", 
    "caption": "Vídeo enviado via API! 🎥"
  }'
```

### **10. Enviar Áudio**
```bash
curl -X POST http://127.0.0.1:9009/api/{sessionId}/messages/media \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "mediaUrl": "https://example.com/audio.mp3",
    "type": "audio"
  }'
```

### **11. Enviar Documento/PDF**
```bash
curl -X POST http://127.0.0.1:9009/api/{sessionId}/messages/media \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "mediaUrl": "https://example.com/document.pdf",
    "type": "document",
    "fileName": "documento.pdf",
    "caption": "Documento importante 📄"
  }'
```

### **12. Mensagem com Botões**
```bash
curl -X POST http://127.0.0.1:9009/api/{sessionId}/messages/buttons \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "text": "Escolha uma opção:",
    "buttons": [
      {"id": "opt1", "text": "✅ Opção 1"},
      {"id": "opt2", "text": "🔍 Opção 2"}, 
      {"id": "opt3", "text": "📞 Opção 3"}
    ],
    "footer": "API Big Conect - Botões Interativos"
  }'
```

### **13. Mensagem com Botões e Imagem**
```bash
curl -X POST http://127.0.0.1:9009/api/{sessionId}/messages/buttons \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999", 
    "text": "Menu Principal:",
    "buttons": [
      {"id": "menu1", "text": "🍕 Pedir Pizza"},
      {"id": "menu2", "text": "📞 Suporte"},
      {"id": "menu3", "text": "ℹ️ Informações"}
    ],
    "image": {
      "url": "https://example.com/menu-image.jpg"
    },
    "footer": "Restaurante Exemplo"
  }'
```

### **14. Mensagem de Lista**
```bash
curl -X POST http://127.0.0.1:9009/api/{sessionId}/messages/list \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "text": "Selecione uma categoria:",
    "buttonText": "Abrir Menu", 
    "title": "Menu de Opções",
    "sections": [
      {
        "title": "🍕 Comidas",
        "rows": [
          {
            "title": "Pizza Margherita",
            "description": "Molho, mussarela, tomate",
            "rowId": "pizza_margherita"
          },
          {
            "title": "Hambúrguer", 
            "description": "Carne, queijo, alface",
            "rowId": "hamburguer"
          }
        ]
      },
      {
        "title": "🥤 Bebidas",
        "rows": [
          {
            "title": "Refrigerante",
            "rowId": "refri"
          },
          {
            "title": "Suco Natural",
            "rowId": "suco" 
          }
        ]
      }
    ]
  }'
```

### **15. Enviar Reação**
```bash
curl -X POST http://127.0.0.1:9009/api/{sessionId}/messages/reaction \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "messageId": "3EB0C3C04A87168A8F130E", 
    "reaction": "👍"
  }'
```

### **16. Envio em Lote (Múltiplas Mensagens)**
```bash
curl -X POST http://127.0.0.1:9009/api/{sessionId}/messages/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "to": "5511999999999",
        "text": "Primeira mensagem do lote 📨"
      },
      {
        "to": "5511999999999",
        "text": "Segunda mensagem do lote 📨" 
      },
      {
        "to": "5511999999999",
        "text": "Terceira mensagem do lote 📨"
      }
    ],
    "delayBetweenMessages": 2000
  }'
```

---

## 🎯 **EXEMPLOS PRÁTICOS**

### **Marketing/Promoção**
```bash
curl -X POST http://127.0.0.1:9009/api/{sessionId}/messages/text \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "text": "🎉 *PROMOÇÃO ESPECIAL!*\n\n📱 _Nova coleção chegando_ \n💰 *50% OFF* na primeira compra\n\n🚚 Frete grátis acima de R$99\n⏰ Oferta válida por 24h!\n\n👉 Acesse: loja.com/promocao"
  }'
```

### **Suporte ao Cliente**
```bash
curl -X POST http://127.0.0.1:9009/api/{sessionId}/messages/buttons \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "text": "Olá! Como podemos ajudar você hoje?",
    "buttons": [
      {"id": "suporte", "text": "📞 Falar com Atendente"},
      {"id": "pedido", "text": "📦 Status do Pedido"},
      {"id": "duvidas", "text": "❓ Dúvidas Frequentes"}
    ],
    "footer": "Suporte Big Conect - Horário: 8h às 18h"
  }'
```

### **Lembretes/Notificações**
```bash
curl -X POST http://127.0.0.1:9009/api/{sessionId}/messages/text \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999", 
    "text": "🔔 *LEMBRETE IMPORTANTE*\n\n💊 Hora de tomar seu remédio\n⏰ Próxima dose: 20:00\n\n🏥 Não se esqueça da sua saúde! 💙"
  }'
```

---

## 🛠 **CONFIGURAÇÃO E MONITORAMENTO**

### **Health Check**
```bash
curl http://127.0.0.1:9009/health
```

### **Informações da API**
```bash
curl http://127.0.0.1:9009/
```

---

## ⚙️ **CONFIGURAÇÕES**

### **Variáveis de Ambiente (.env)**
```env
NODE_ENV=development
PORT=9009
IPV4=127.0.0.1
VIEW_QRCODE_TERMINAL=1
PATCH_TOKENS=./sessions
DEVICE_NAME=Big-Conect-API
WEBHOOK_URL=https://seu-webhook.com/api
LOG_LEVEL=debug
```

---

## 🛡 **RECURSOS DE SEGURANÇA**

### **Anti-Ban System**
- ✅ Limite de mensagens por minuto/hora/dia
- ✅ Delays aleatórios entre mensagens
- ✅ User Agents rotativos
- ✅ Comportamento humano simulado

### **Persistência**
- ✅ Sessões salvas automaticamente
- ✅ Reconexão automática
- ✅ Backup de credenciais

---

## 📊 **RESPOSTAS DE SUCESSO**
```json
{
  "success": true,
  "data": {
    "messageId": "3EB0C3C04A87168A8F130E",
    "timestamp": "2025-11-19T14:53:24.226Z"
  },
  "message": "Message sent successfully"
}
```

## ❌ **RESPOSTAS DE ERRO**
```json
{
  "success": false,
  "error": "Session not connected",
  "message": "Failed to send message"
}
```

---

## 💡 **DICAS IMPORTANTES**

1. **Formato de Número:** `CódigoPaís + DDD + Número` (ex: 5511999999999)
2. **Session ID:** Use o ID retornado ao criar a sessão
3. **URLs de Mídia:** Devem ser públicas e acessíveis
4. **QR Code:** Escaneie com WhatsApp → Dispositivos Conectados

---

## 🚀 **FLUXO DE USO**

1. **Criar Sessão** → Obter Session ID
2. **Obter QR Code** → Escanear com WhatsApp
3. **Verificar Status** → Confirmar conexão
4. **Enviar Mensagens** → Usar endpoints disponíveis
5. **Monitorar** → Usar webhooks para receber respostas

---

## 🎉 **RECURSOS EXCLUSIVOS**

- ✅ **Multi-sessões** → Vários números simultâneos
- ✅ **Persistência** → Sessões sobrevivem a reinicializações
- ✅ **Anti-detecção** → Comportamento humano realista
- ✅ **Webhooks** → Receba mensagens automaticamente
- ✅ **Tipagem Forte** → TypeScript para confiabilidade
- ✅ **Logs Detalhados** → Monitoramento completo

**API Big Conect - Sua solução completa para WhatsApp Business!** 🚀# big-conect-api
