#!/usr/bin/env node
const fs   = require('fs');
const path = require('path');
const os   = require('os');

function copyDir(srcDir, destDir) {
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  fs.readdirSync(srcDir).forEach(file => {
    const srcFile  = path.join(srcDir, file);
    const destFile = path.join(destDir, file);
    if (fs.lstatSync(srcFile).isDirectory()) {
      copyDir(srcFile, destFile);
    } else {
      fs.copyFileSync(srcFile, destFile);
    }
  });
}

// Helper: copy a file only if it does NOT already exist in the destination
function copyIfMissing(src, dest) {
  if (!fs.existsSync(dest) && fs.existsSync(src)) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    return true;
  }
  return false;
}

// 1. Copiar archivos del workspace (Template/ → cwd)
const templateSrc  = path.join(__dirname, 'Template');
const templateDest = process.cwd();
copyDir(templateSrc, templateDest);
console.log('✅ Archivos de workspace copiados:');
fs.readdirSync(templateSrc).forEach(f => console.log('   ' + f));

// 2. Copiar archivos de configuración Playwright si no existen en el proyecto
const configFiles = ['playwright.config.ts', 'tsconfig.json'];
const copied = [];
for (const file of configFiles) {
  const src  = path.join(__dirname, file);
  const dest = path.join(process.cwd(), file);
  if (copyIfMissing(src, dest)) copied.push(file);
}
if (copied.length > 0) {
  console.log('\n✅ Archivos de configuración Playwright copiados (no existían):');
  copied.forEach(f => console.log('   ' + f));
} else {
  console.log('\n⏭  playwright.config.ts / tsconfig.json ya existen — no sobreescritos.');
}

// 3. Instalar skills en ~/.agents/skills/
const skillsSrc  = path.join(__dirname, 'skills');
const skillsDest = path.join(os.homedir(), '.agents', 'skills');
if (fs.existsSync(skillsSrc)) {
  copyDir(skillsSrc, skillsDest);
  console.log('\n✅ Skills instalados en ' + skillsDest + ':');
  fs.readdirSync(skillsSrc).forEach(s => console.log('   ' + s));
}

console.log('\n📦 Próximos pasos sugeridos:');
console.log('   npm install              → instalar dependencias Playwright');
console.log('   npm run codegen          → grabar un flujo interactivo');
console.log('   npm run test:headed      → correr tests con browser visible');
console.log('   npm run test:one -- login → correr solo tests que contengan "login"');
console.log('\n🚀 Listo. Abre VS Code y usa GitHub Copilot Agent.');
console.log('   Dile: "TC 1234, URL: https://tu-app.com, user/pass"\n');
