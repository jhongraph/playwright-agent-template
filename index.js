#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'template');
const dest = process.cwd();

function copyDir(srcDir, destDir) {
  fs.readdirSync(srcDir).forEach(file => {
    const srcFile = path.join(srcDir, file);
    const destFile = path.join(destDir, file);

    if (fs.lstatSync(srcFile).isDirectory()) {
      if (!fs.existsSync(destFile)) fs.mkdirSync(destFile);
      copyDir(srcFile, destFile);
    } else {
      fs.copyFileSync(srcFile, destFile);
    }
  });
}

copyDir(src, dest);
console.log('Framework E2E instalado');