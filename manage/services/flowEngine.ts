
import { AutomationFlow, FlowNode, ExecutionContext, ConditionOperator } from '../types';
import { api } from './api';

/**
 * ENGINE DE EXECUÇÃO REAL (N8n-Compatible)
 */
export const flowEngine = {

  /**
   * Resolve variáveis no estilo n8n: {{ $json.body.data.message }}
   * Navega profundamente no objeto de contexto.
   */
  resolveVariable: (expression: string, context: ExecutionContext): any => {
    if (!expression) return '';
    
    // Se não tiver {{ }}, retorna o valor literal
    if (!expression.includes('{{') || !expression.includes('}}')) {
        return expression;
    }

    // Remove {{ }} e espaços
    let path = expression.replace(/\{\{/g, '').replace(/\}\}/g, '').trim();

    // Suporte a sintaxe n8n ($json.)
    if (path.startsWith('$json.')) {
        path = path.replace('$json.', '');
        const parts = path.split('.');
        
        let current: any = context.$json;
        for (const part of parts) {
            if (current === undefined || current === null) return '';
            current = current[part];
        }
        return current !== undefined ? current : '';
    }

    // Suporte legado/simplificado (context.from)
    if (path === 'from') return context.from;

    return expression; // Retorna original se não resolver
  },

  /**
   * Processa uma string inteira que pode conter múltiplas variáveis
   * Ex: "Olá, recebemos sua msg: {{ $json.body.text }}"
   */
  interpolateString: (text: string, context: ExecutionContext): string => {
    if (!text) return '';
    return text.replace(/\{\{(.*?)\}\}/g, (match) => {
        const val = flowEngine.resolveVariable(match, context);
        return val !== undefined && val !== null ? String(val) : '';
    });
  },

  /**
   * Avalia lógica de condição (If/Else)
   */
  evaluateCondition: (
    val1: string, 
    operator: ConditionOperator, 
    val2: string, 
    context: ExecutionContext
  ): boolean => {
    const v1 = flowEngine.interpolateString(val1, context);
    const v2 = flowEngine.interpolateString(val2, context);

    console.log(`[ENGINE] Condition Check: "${v1}" ${operator} "${v2}"`);

    switch (operator) {
        case 'equals': return v1.toLowerCase() === v2.toLowerCase();
        case 'not_equals': return v1.toLowerCase() !== v2.toLowerCase();
        case 'contains': return v1.toLowerCase().includes(v2.toLowerCase());
        case 'greater_than': return Number(v1) > Number(v2);
        case 'less_than': return Number(v1) < Number(v2);
        default: return false;
    }
  },

  /**
   * Executa o fluxo
   */
  executeFlow: async (
    flow: AutomationFlow,
    host: string,
    apiKey: string,
    pinData: any, // O JSON complexo do Webhook (pinData do n8n)
    onStepChange?: (nodeId: string) => void
  ) => {
    console.log(`[ENGINE REAL] Iniciando com PinData n8n:`, pinData);

    // 1. Constrói Contexto de Execução estilo n8n
    // O pinData geralmente é um array no n8n, pegamos o primeiro item ou o objeto direto
    const jsonBody = Array.isArray(pinData) ? pinData[0] : pinData;
    
    // Tenta extrair o 'from' automaticamente para facilitar ações de envio
    // Baseado na estrutura da API Big Conect fornecida
    const fromNumber = jsonBody?.body?.data?.from || jsonBody?.body?.from || '';

    const context: ExecutionContext = {
        $json: jsonBody,
        from: fromNumber
    };

    if (!context.from) {
        throw new Error("Não foi possível identificar o número 'from' no JSON de teste. Verifique o PinData.");
    }

    const startNode = flow.nodes.find(n => n.type === 'webhook');
    if (!startNode) throw new Error("Fluxo sem gatilho inicial.");

    // Ordenação Linear (Top-Down)
    const sortedNodes = [...flow.nodes]
      .filter(n => n.id !== startNode.id)
      .sort((a, b) => a.position.y - b.position.y);

    if (onStepChange) onStepChange(startNode.id);
    await new Promise(r => setTimeout(r, 500));

    let stopExecution = false;

    for (const node of sortedNodes) {
      if (stopExecution) break;
      if (node.disabled) continue;
      
      if (onStepChange) onStepChange(node.id);
      console.log(`[ENGINE] Executando nó: ${node.name}`);

      try {
        const result = await flowEngine.executeNode(node, flow.sessionId, host, apiKey, context);
        
        // Se o nó for uma condição e retornar FALSE, paramos a execução 
        // (Em um sistema gráfico real, iria para o ramo 'False', aqui simulamos parada)
        if (node.type === 'condition' && result === false) {
            console.log(`[ENGINE] Condição FALHA. Parando fluxo (Branch False).`);
            stopExecution = true;
        }

      } catch (error: any) {
        console.error(`[ENGINE] Erro no nó ${node.id}:`, error);
        throw new Error(`Falha em "${node.name}": ${error.message}`);
      }

      await new Promise(r => setTimeout(r, 500));
    }
  },

  executeNode: async (
    node: FlowNode, 
    sessionId: string,
    host: string, 
    apiKey: string,
    context: ExecutionContext
  ): Promise<boolean | void> => {
    const params = node.parameters;

    switch (node.type) {
      case 'text':
        if (!params.text) return;
        const textToSend = flowEngine.interpolateString(params.text, context);
        const toNum = params.to ? flowEngine.interpolateString(params.to, context) : context.from;
        
        await api.sendMessage(host, apiKey, sessionId, { to: toNum, text: textToSend });
        return true;

      case 'media':
        if (!params.mediaUrl) return;
        const mediaTo = params.to ? flowEngine.interpolateString(params.to, context) : context.from;
        await api.sendMessage(host, apiKey, sessionId, {
          to: mediaTo,
          mediaUrl: params.mediaUrl,
          caption: params.caption ? flowEngine.interpolateString(params.caption, context) : '',
          type: 'image'
        });
        return true;

      case 'condition':
        if (!params.condition) return true; // Sem config, passa
        const { value1, operator, value2 } = params.condition;
        const result = flowEngine.evaluateCondition(value1, operator, value2, context);
        return result; // Retorna boolean para o loop principal controlar o fluxo

      case 'wait':
        const sec = params.seconds || 1;
        await new Promise(resolve => setTimeout(resolve, sec * 1000));
        return true;
        
      case 'buttons':
        const btnTo = params.to ? flowEngine.interpolateString(params.to, context) : context.from;
        await api.sendMessage(host, apiKey, sessionId, {
             to: btnTo,
             text: params.text ? flowEngine.interpolateString(params.text, context) : 'Escolha:',
             buttons: params.buttons || [{ id: '1', text: 'Opção' }],
             footer: params.footer
         });
        return true;
    }
    return true;
  }
};
