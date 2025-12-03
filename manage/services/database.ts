
import { AutomationFlow } from '../types';

const DB_KEYS = {
  AUTOMATIONS: 'big_conect_db_automations',
  WEBHOOKS: 'big_conect_db_webhooks'
};

const SERVER_URL = window.location.protocol + '//' + window.location.hostname + ':3000';

export const db = {
  // --- Automations Table ---

  getAllAutomations: async (): Promise<AutomationFlow[]> => {
    try {
        // 1. Tenta buscar do servidor Real
        const res = await fetch(`${SERVER_URL}/api/flows`, { method: 'GET' });
        if (res.ok) {
            const data = await res.json();
            // Atualiza cache local
            localStorage.setItem(DB_KEYS.AUTOMATIONS, JSON.stringify(data));
            return data;
        }
    } catch (e) {
        // Falha silenciosa, usa local
    }

    try {
      const data = localStorage.getItem(DB_KEYS.AUTOMATIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveAutomation: async (flow: AutomationFlow): Promise<void> => {
    // 1. Salva Local
    const flowsLocal = localStorage.getItem(DB_KEYS.AUTOMATIONS);
    let flows: AutomationFlow[] = flowsLocal ? JSON.parse(flowsLocal) : [];
    
    const index = flows.findIndex(f => f.id === flow.id);
    if (index >= 0) {
      flows[index] = { ...flow, lastRun: flows[index].lastRun };
    } else {
      flows.push({ ...flow, createdAt: new Date().toISOString() });
    }
    localStorage.setItem(DB_KEYS.AUTOMATIONS, JSON.stringify(flows));

    // 2. Sincroniza com Servidor (Para o Webhook funcionar)
    try {
        await fetch(`${SERVER_URL}/api/flows`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(flow)
        });
    } catch (e) {
        console.warn("Servidor de automação offline. O webhook real não funcionará até que o servidor suba.");
    }
  },

  deleteAutomation: async (id: string): Promise<void> => {
    const flowsLocal = localStorage.getItem(DB_KEYS.AUTOMATIONS);
    if (flowsLocal) {
        let flows = JSON.parse(flowsLocal) as AutomationFlow[];
        flows = flows.filter(f => f.id !== id);
        localStorage.setItem(DB_KEYS.AUTOMATIONS, JSON.stringify(flows));
    }

    try {
        await fetch(`${SERVER_URL}/api/flows/${id}`, { method: 'DELETE' });
    } catch (e) {}
  },

  // Síncrono apenas para UI inicial, ideal migrar para async
  getAllAutomationsSync: (): AutomationFlow[] => {
      try {
        const data = localStorage.getItem(DB_KEYS.AUTOMATIONS);
        return data ? JSON.parse(data) : [];
      } catch (e) { return []; }
  }
};
