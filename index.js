#!/usr/bin/env node
const fs   = require('fs');
const path = require('path');
const os   = require('os');

const force = process.argv.includes('--force');

function copyDir(srcDir, destDir) {
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  fs.readdirSync(srcDir).forEach(file => {
    const srcFile  = path.join(srcDir, file);
    const destFile = path.join(destDir, file);
    if (fs.lstatSync(srcFile).isDirectory()) {
      copyDir(srcFile, destFile);
    } else if (!force && fs.existsSync(destFile)) {
      console.log('   ⚠️  Skip (ya existe): ' + path.relative(process.cwd(), destFile) + '  — usa --force para sobreescribir');
    } else {
      fs.copyFileSync(srcFile, destFile);
    }
  });
}

// 1. Copiar archivos del workspace (Template/ → cwd)
const templateSrc  = path.join(__dirname, 'Template');
const templateDest = process.cwd();
copyDir(templateSrc, templateDest);
console.log('\n✅ Archivos de workspace copiados a: ' + templateDest);

// 2. Instalar skills en ~/.agents/skills/
const skillsSrc  = path.join(__dirname, 'skills');
const skillsDest = path.join(os.homedir(), '.agents', 'skills');
if (fs.existsSync(skillsSrc)) {
  copyDir(skillsSrc, skillsDest);
  console.log('\n✅ Skills instalados en ' + skillsDest + ':');
  fs.readdirSync(skillsSrc).forEach(s => console.log('   📦 ' + s));
}

// 3. Crear carpeta .agent-state/ si no existe
const agentStateDir = path.join(process.cwd(), '.agent-state');
if (!fs.existsSync(agentStateDir)) {
  fs.mkdirSync(agentStateDir, { recursive: true });
  console.log('\n✅ Carpeta .agent-state/ creada');
}

// 4. Crear .env.playwright a partir del ejemplo (solo si no existe)
const envDest    = path.join(process.cwd(), '.env.playwright');
const envExample = path.join(templateDest, '.env.playwright.example');
if (!fs.existsSync(envDest) && fs.existsSync(envExample)) {
  fs.copyFileSync(envExample, envDest);
  console.log('\n✅ .env.playwright creado — completa APP_URL, TEST_USER, TEST_PASS');
} else if (fs.existsSync(envDest)) {
  console.log('\n   ⚠️  .env.playwright ya existe — no sobreescrito');
}

console.log('\n🚀 Listo. Abre VS Code y usa GitHub Copilot Agent.');
console.log('   Completa .env.playwright con las credenciales del entorno.');
console.log('   Dile al agente: "ejecuta Test Plan 9361, Suite 9363, URL: https://tu-app.com"\n');
if (!force) console.log('   Tip: usa --force para sobreescribir archivos existentes en re-instalaciones.\n');
