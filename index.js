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

// 1. Copiar archivos del workspace (Template/ → cwd)
const templateSrc  = path.join(__dirname, 'Template');
const templateDest = process.cwd();
copyDir(templateSrc, templateDest);
console.log('✅ Archivos de workspace copiados:');
fs.readdirSync(templateSrc).forEach(f => console.log('   ' + f));

// 2. Instalar skills en ~/.agents/skills/
const skillsSrc  = path.join(__dirname, 'skills');
const skillsDest = path.join(os.homedir(), '.agents', 'skills');
if (fs.existsSync(skillsSrc)) {
  copyDir(skillsSrc, skillsDest);
  console.log('\n✅ Skills instalados en ' + skillsDest + ':');
  fs.readdirSync(skillsSrc).forEach(s => console.log('   ' + s));
}

console.log('\n🚀 Listo. Abre VS Code y usa GitHub Copilot Agent.');
console.log('   Dile: "ejecuta Test Plan 9412, Suite 9418, URL: https://tu-app.com"\n');
