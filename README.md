# 🌐 **API BIG CONECT - Documentação Completa**

## 🚀 **O QUE É A API BIG CONECT?**

A **API Big Conect** é uma solução completa de automação para WhatsApp baseada na biblioteca **Baileys** e no fork **whaileys**, desenvolvida para fornecer uma interface REST robusta e confiável para integração com o WhatsApp Web.

### ⚠️ **AVISO IMPORTANTE**
Esta é uma **API não-oficial** do WhatsApp. Utilize com responsabilidade e respeite os limites de uso para evitar bloqueios. Recomendamos uso para:
- Chatbots empresariais
- Sistemas de notificação
- Integração com CRM/ERP
- Automação de atendimento

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

### **10. Enviar Áudio** 🎵 **NOVO!**
```bash
curl -X POST http://127.0.0.1:9009/api/{sessionId}/messages/media \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "mediaUrl": "https://example.com/audio.mp3",
    "type": "audio",
    "ptt": true
  }'
```

**📌 Parâmetro `ptt` (Push-to-Talk):**
- `"ptt": true` → **Envia como mensagem de voz** (recomendado)
- `"ptt": false` → Envia como arquivo de áudio normal

**🎯 Formatos Suportados:**
- ✅ MP3 (`audio/mpeg`)
- ✅ WAV (`audio/wav`) 
- ✅ OGG (`audio/ogg`)
- ✅ AAC (`audio/aac`)
- ✅ M4A (`audio/mp4`)
- ✅ AMR (`audio/amr`) - **Formato nativo do WhatsApp**

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

## 🎯 **CASOS DE USO PRÁTICOS**

### **💼 Para Empresas:**
- **Atendimento ao Cliente**: Chatbots automatizados
- **Notificações**: Alertas de pedidos, agendamentos
- **Marketing**: Campanhas promocionais segmentadas
- **Suporte Técnico**: Respostas automáticas e encaminhamento

### **👥 Para Desenvolvedores:**
- **Integração com Sistemas**: CRM, ERP, sistemas internos
- **Automação de Processos**: Mensagens programadas
- **Webhooks**: Recebimento de mensagens em tempo real
- **Multi-sessões**: Gerenciamento de vários números

### **📱 Para Usuários Finais:**
- **Comunicação em massa**: Envio para múltiplos contatos
- **Agendamento**: Mensagens programadas
- **Personalização**: Conteúdo dinâmico e formatado

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

### **Suporte ao Cliente com Áudio** 🎵
```bash
curl -X POST http://127.0.0.1:9009/api/{sessionId}/messages/media \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "mediaUrl": "https://exemplo.com/boas-vindas.mp3",
    "type": "audio",
    "ptt": true
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

## 🛡 **RECURSOS DE SEGURANÇA E ANTI-BAN**

### **Sistema Anti-Ban Avançado**
- ✅ **Limite inteligente** de mensagens por minuto/hora/dia
- ✅ **Delays aleatórios** entre mensagens simulando comportamento humano
- ✅ **User Agents rotativos** para evitar detecção
- ✅ **Validação de números** para evitar spam
- ✅ **Monitoramento contínuo** da saúde da sessão

### **Persistência e Confiabilidade**
- ✅ **Sessões salvas automaticamente** - Sobrevivem a reinicializações
- ✅ **Reconexão automática** em caso de desconexão
- ✅ **Backup de credenciais** seguro
- ✅ **Logs detalhados** para troubleshooting

---

## 🎯 **TECNOLOGIAS E BASE TÉCNICA**

### **📚 Base Tecnológica:**
- **Baileys**: Biblioteca principal para conexão WhatsApp
- **whaileys**: Fork otimizado e estável do Baileys
- **Node.js + TypeScript**: Backend robusto e tipado
- **Express.js**: API REST moderna e performática

### **⚡ Características Técnicas:**
- **Multi-sessões**: Múltiplos números simultâneos
- **WebSocket**: Conexão em tempo real com WhatsApp
- **Arquitetura Modular**: Fácil extensão e manutenção
- **Tipagem Forte**: Menos bugs, mais confiabilidade

---

## 📊 **RESPOSTAS DE SUCESSO**
```json
{
  "success": true,
  "data": {
    "messageId": "3EB0C3C04A87168A8F130E",
    "timestamp": "2025-11-19T14:53:24.226Z",
    "type": "audio",
    "ptt": true
  },
  "message": "Media message sent successfully as voice message"
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

### **📞 Formato de Números:**
- Use: `CódigoPaís + DDD + Número` (ex: 5511999999999)
- Sem caracteres especiais: `+55 (11) 99999-9999` → `5511999999999`

### **🔐 Gerenciamento de Sessões:**
- **Session ID**: Use o ID retornado ao criar a sessão
- **QR Code**: Escaneie com WhatsApp → Dispositivos Conectados
- **Persistência**: Sessões são mantidas entre reinicializações

### **📁 Envio de Mídia:**
- **URLs públicas**: Arquivos devem ser acessíveis via internet
- **Formatos suportados**: JPG, PNG, MP4, MP3, PDF, etc.
- **Tamanho máximo**: 16MB para áudios e documentos

### **🎵 Dicas de Áudio:**
- Use `"ptt": true` para melhor entrega de áudios
- Formatos nativos (AMR, M4A) têm melhor compatibilidade
- Áudios curtos (até 10 minutos) têm melhor performance

---

## 🚀 **FLUXO DE USO RECOMENDADO**

1. **📱 Criar Sessão** → Obter Session ID único
2. **🔗 Obter QR Code** → Escanear com WhatsApp mobile
3. **✅ Verificar Status** → Confirmar conexão estabelecida  
4. **📤 Enviar Mensagens** → Utilizar endpoints apropriados
5. **🔄 Monitorar** → Usar webhooks para receber respostas
6. **⚡ Manutenção** → Verificar saúde das sessões periodicamente

---

## 🎉 **RECURSOS EXCLUSIVOS**

### **🌟 Diferenciais da API Big Conect:**
- ✅ **Multi-sessões simultâneas** - Vários números na mesma instância
- ✅ **Persistência avançada** - Sessões sobrevivem a reinicializações
- ✅ **Sistema anti-ban inteligente** - Comportamento humano realista
- ✅ **Webhooks nativos** - Receba mensagens automaticamente
- ✅ **Tipagem TypeScript** - Desenvolvimento mais seguro
- ✅ **Logs detalhados** - Monitoramento completo em tempo real
- ✅ **Envio de áudio otimizado** - Suporte a mensagens de voz PTT
- ✅ **API REST moderna** - Documentação completa e exemplos práticos

### **🛠 Para Desenvolvedores:**
- **Documentação completa** com exemplos práticos
- **Código aberto** para customizações
- **Arquitetura modular** de fácil extensão
- **Comunidade ativa** para suporte e melhorias

---

## ⚠️ **LIMITAÇÕES E BOAS PRÁTICAS**

### **🚫 O que evitar:**
- Spam ou envio em massa para números não solicitantes
- Uso para atividades ilegais ou fraudulentas  
- Exceder limites razoáveis de mensagens
- Compartilhar sessões entre múltiplos usuários indiscriminadamente

### **✅ Boas Práticas:**
- Mantenha as sessões ativas e verifique status regularmente
- Use delays entre mensagens em massa
- Respeite a política de uso do WhatsApp
- Mantenha o software atualizado

---

**🚀 API Big Conect - Sua solução completa e confiável para automação WhatsApp Business!**

*Baseada nas melhores bibliotecas open-source do mercado, desenvolvida para performance e estabilidade em ambientes produtivos.*