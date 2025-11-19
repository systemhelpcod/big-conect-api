// /root/api/big2/beta/api-big-conect/debug.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== DIAGNÓSTICO DO SISTEMA ===');

// 1. Verificar estrutura de pastas
console.log('\n1. Estrutura de pastas:');
try {
  const sessionsDir = './sessions';
  if (fs.existsSync(sessionsDir)) {
    console.log('✓ Pasta sessions existe');
    const sessionFolders = fs.readdirSync(sessionsDir);
    console.log(`✓ Pastas de sessão: ${sessionFolders.join(', ')}`);
  } else {
    console.log('✗ Pasta sessions NÃO existe');
  }
} catch (error) {
  console.log('Erro ao verificar pastas:', error.message);
}

// 2. Verificar permissões
console.log('\n2. Permissões:');
try {
  const testWrite = './sessions/test-write';
  fs.writeFileSync(testWrite, 'test');
  fs.unlinkSync(testWrite);
  console.log('✓ Permissões de escrita OK');
} catch (error) {
  console.log('✗ Problema com permissões de escrita:', error.message);
}

// 3. Verificar dependências
console.log('\n3. Dependências:');
try {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  console.log('✓ package.json carregado');
  
  const deps = Object.keys(packageJson.dependencies || {});
  console.log(`✓ ${deps.length} dependências instaladas`);
} catch (error) {
  console.log('✗ Erro ao verificar dependências:', error.message);
}

console.log('\n=== FIM DO DIAGNÓSTICO ===');