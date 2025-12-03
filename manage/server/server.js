const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// NATIVE FETCH (NODE 18+) REPLACES AXIOS
// No need to install axios anymore!

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'flows.json');

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// --- DATABASE SIMULATION ---
const getFlows = () => {
    if (!fs.existsSync(DB_FILE)) return [];
    try {
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) { return []; }
};

const saveFlows = (flows) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(flows, null, 2));
};

// --- ENGINE LOGIC (SERVER SIDE) ---
const resolveVariable = (expression, context) => {
    if (!expression || typeof expression !== 'string') return expression;
    if (!expression.includes('{{') || !expression.includes('}}')) return expression;

    let path = expression.replace(/\{\{/g, '').replace(/\}\}/g, '').trim();

    if (path.startsWith('$json.')) {
        path = path.replace('$json.', '');
        const parts = path.split('.');
        let current = context.$json;
        for (const part of parts) {
            if (current === undefined || current === null) return '';
            current = current[part];
        }
        return current !== undefined ? current : '';
    }
    if (path === 'from') return context.from;
    return expression;
};

const interpolateString = (text, context) => {
    if (!text) return '';
    return text.replace(/\{\{(.*?)\}\}/g, (match) => {
        const val = resolveVariable(match, context);
        return val !== undefined && val !== null ? String(val) : '';
    });
};

const evaluateCondition = (val1, operator, val2, context) => {
    const v1 = interpolateString(val1, context);
    const v2 = interpolateString(val2, context);
    console.log(`[ENGINE] Comparando: "${v1}" ${operator} "${v2}"`);

    switch (operator) {
        case 'equals': return v1.toLowerCase() === v2.toLowerCase();
        case 'not_equals': return v1.toLowerCase() !== v2.toLowerCase();
        case 'contains': return v1.toLowerCase().includes(v2.toLowerCase());
        case 'greater_than': return Number(v1) > Number(v2);
        case 'less_than': return Number(v1) < Number(v2);
        default: return false;
    }
};

const executeNode = async (node, flow, context, apiHost, apiKey) => {
    const params = node.parameters;
    
    if (!apiHost.startsWith('http')) apiHost = `http://${apiHost}`;

    const headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
    };

    try {
        switch (node.type) {
            case 'text':
                if (!params.text) return true;
                const textBody = {
                    to: params.to ? interpolateString(params.to, context) : context.from,
                    text: interpolateString(params.text, context)
                };
                console.log(`[ACTION] Enviando Texto para ${textBody.to}`);
                
                await fetch(`${apiHost}/api/${flow.sessionId}/messages/text`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(textBody)
                });
                return true;

            case 'media':
                if (!params.mediaUrl) return true;
                const mediaBody = {
                    to: params.to ? interpolateString(params.to, context) : context.from,
                    mediaUrl: params.mediaUrl,
                    caption: params.caption ? interpolateString(params.caption, context) : '',
                    type: 'image'
                };
                console.log(`[ACTION] Enviando Mídia para ${mediaBody.to}`);
                
                await fetch(`${apiHost}/api/${flow.sessionId}/messages/media`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(mediaBody)
                });
                return true;

            case 'condition':
                if (!params.condition) return true;
                return evaluateCondition(params.condition.value1, params.condition.operator, params.condition.value2, context);

            case 'wait':
                const sec = params.seconds || 1;
                console.log(`[WAIT] Aguardando ${sec}s...`);
                await new Promise(resolve => setTimeout(resolve, sec * 1000));
                return true;
        }
    } catch (error) {
        console.error(`[ERROR] Falha no nó ${node.name}:`, error.message);
    }
    return true;
};

const processFlow = async (flow, payload) => {
    if (!flow.active) {
        console.log(`[INFO] Fluxo ${flow.name} está inativo.`);
        return;
    }

    const fromNumber = payload?.data?.from || payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from || '';
    
    const context = {
        $json: { body: payload },
        from: fromNumber
    };

    console.log(`[START] Executando fluxo "${flow.name}" para ${fromNumber}`);

    const API_HOST = process.env.API_HOST || "http://localhost:9009"; 
    const API_KEY = process.env.API_KEY || "123456789";

    const startNode = flow.nodes.find(n => n.type === 'webhook');
    if (!startNode) return;

    const sortedNodes = [...flow.nodes]
        .filter(n => n.id !== startNode.id)
        .sort((a, b) => a.position.y - b.position.y);

    let stopExecution = false;

    for (const node of sortedNodes) {
        if (stopExecution) break;
        if (node.disabled) continue;

        console.log(`[STEP] Nó: ${node.name} (${node.type})`);
        
        const result = await executeNode(node, flow, context, API_HOST, API_KEY);

        if (node.type === 'condition' && result === false) {
            console.log(`[LOGIC] Condição falsa. Parando fluxo.`);
            stopExecution = true;
        }
        
        await new Promise(r => setTimeout(r, 200));
    }
    
    flow.lastRun = new Date().toISOString();
    
    const currentFlows = getFlows();
    const index = currentFlows.findIndex(f => f.id === flow.id);
    if (index >= 0) {
        currentFlows[index] = flow;
        saveFlows(currentFlows);
    }
    
    console.log(`[END] Fluxo finalizado.`);
};

// --- ROUTES ---

app.all('/webhook/:slug', async (req, res) => {
    const slug = req.params.slug;
    const method = req.method;
    const payload = req.method === 'GET' ? req.query : req.body;
    
    console.log(`\n🔔 [WEBHOOK] ${method} /webhook/${slug}`);
    
    const flows = getFlows();
    const flow = flows.find(f => {
        const webhookNode = f.nodes.find(n => n.type === 'webhook');
        return webhookNode && 
               webhookNode.parameters.path === slug && 
               (webhookNode.parameters.httpMethod === method || !webhookNode.parameters.httpMethod || webhookNode.parameters.httpMethod === 'GET');
    });

    if (!flow) {
        console.log(`[404] Nenhum fluxo encontrado para este webhook.`);
        return res.status(404).json({ error: 'Webhook not found for this path/method' });
    }

    res.json({ success: true, message: 'Workflow triggered' });
    processFlow(flow, payload).catch(err => console.error(err));
});

app.get('/api/flows', (req, res) => {
    res.json(getFlows());
});

app.post('/api/flows', (req, res) => {
    const flow = req.body;
    const flows = getFlows();
    const index = flows.findIndex(f => f.id === flow.id);
    
    if (index >= 0) {
        flows[index] = flow;
    } else {
        flows.push(flow);
    }
    
    saveFlows(flows);
    res.json({ success: true });
});

app.delete('/api/flows/:id', (req, res) => {
    const { id } = req.params;
    let flows = getFlows();
    flows = flows.filter(f => f.id !== id);
    saveFlows(flows);
    res.json({ success: true });
});

app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`\n🚀 SERVIDOR DE AUTOMAÇÃO RODANDO NA PORTA ${PORT}`);
    console.log(`🔗 Webhook Base URL: http://localhost:${PORT}/webhook/{seu-path}`);
    console.log(`📝 Flows Database: ${DB_FILE}`);
});