/**
 * upload-evidence.js
 * Sube resultados de ejecución a Azure DevOps como comentarios en los Work Items
 * Suite 9418 — Sesión
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuración ADO
const ORG = 'AutoregPR';
const PROJECT = 'AUTOREG';
const PAT = process.env.ADO_PAT;
const AUTH = Buffer.from(`:${PAT}`).toString('base64');

// Resultados de ejecución
const results = [
  {
    tcId: 9433,
    wiId: 9433,
    title: 'TC-015 — Logout desde el menú',
    suite: 'Suite 5 — Sesión',
    planId: 9412,
    steps: [
      { step: 1, action: 'Iniciar sesión con usuario: standard_user y contraseña: secret_sauce', expected: 'El login es exitoso y se muestra el catálogo', status: 'PASSED' },
      { step: 2, action: 'Hacer clic en el ícono de menú (hamburger) en la esquina superior izquierda', expected: 'El menú lateral se despliega mostrando las opciones disponibles', status: 'PASSED' },
      { step: 3, action: 'Hacer clic en "Logout"', expected: 'El sistema redirige a la página de login y la sesión queda cerrada', status: 'PASSED' }
    ],
    overall: 'PASSED',
    duration: '4.5s'
  },
  {
    tcId: 9434,
    wiId: 9434,
    title: 'TC-016 — Sesión no persiste después del logout',
    suite: 'Suite 5 — Sesión',
    planId: 9412,
    steps: [
      { step: 1, action: 'Iniciar sesión con usuario: standard_user y contraseña: secret_sauce', expected: 'El login es exitoso y se muestra el catálogo', status: 'PASSED' },
      { step: 2, action: 'Hacer logout desde el menú lateral', expected: 'El sistema redirige a la página de login', status: 'PASSED' },
      { step: 3, action: 'Intentar navegar directamente a https://www.saucedemo.com/inventory.html', expected: 'El sistema redirige al login en lugar de mostrar el inventario, confirmando que la sesión no persiste', status: 'PASSED' }
    ],
    overall: 'PASSED',
    duration: '5.7s'
  }
];

function adoRequest(method, url, body, contentType) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    let postData;
    const headers = {
      Authorization: `Basic ${AUTH}`,
      'Content-Type': contentType || 'application/json',
      Accept: 'application/json',
    };
    if (body) {
      if (Buffer.isBuffer(body)) {
        postData = body;
        headers['Content-Length'] = body.length;
      } else if (typeof body === 'string') {
        postData = body;
        headers['Content-Length'] = Buffer.byteLength(body);
      } else {
        postData = JSON.stringify(body);
        headers['Content-Length'] = Buffer.byteLength(postData);
      }
    }
    const options = { hostname: parsed.hostname, path: parsed.pathname + parsed.search, method, headers };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(data)); } catch { resolve(data); }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 500)}`));
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

function buildCommentHtml(tc) {
  const date = new Date().toISOString().split('T')[0];
  const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const overallIcon = tc.overall === 'PASSED' ? '✅ PASSED' : '❌ FAILED';
  
  let stepsHtml = '';
  for (const step of tc.steps) {
    const statusColor = step.status === 'PASSED' ? '#1a7f37' : '#c0392b';
    const statusIcon = step.status === 'PASSED' ? '✅' : '❌';
    stepsHtml += `
    <tr>
      <td><b>STEP ${step.step}</b></td>
      <td>${step.action}</td>
      <td>${step.expected}</td>
      <td style="color:${statusColor};font-weight:bold;text-align:center;">${statusIcon} ${step.status}</td>
    </tr>`;
  }

  return `
<h2>📋 ${tc.tcId} — ${tc.title} ${overallIcon}</h2>
<p style="font-size:14px;"><b>Plan:</b> ${tc.planId} | <b>Suite:</b> ${tc.suite} | <b>Fecha:</b> ${date} ${time} | <b>Duración:</b> ${tc.duration}</p>

<table border="1" cellpadding="10" cellspacing="0" style="border-collapse:collapse;font-size:15px;width:100%;">
  <thead>
    <tr style="background:#0078d4;color:white;font-size:16px;font-weight:bold;">
      <th style="width:10%;padding:12px;">Fase</th>
      <th style="width:38%;padding:12px;">Acción</th>
      <th style="width:38%;padding:12px;">Resultado Esperado</th>
      <th style="width:14%;padding:12px;">Estado</th>
    </tr>
  </thead>
  <tbody>${stepsHtml}
  </tbody>
</table>

<br/>
<p style="font-size:13px;color:#666;"><i>📎 Evidencia: Tests automatizados con Playwright — capturas disponibles bajo demanda en modo headed.</i></p>

<hr/><small>🤖 GitHub Copilot Agent — Escenario A (Playwright) — ${date}</small>
`;
}

async function addComment(wiId, html) {
  const url = `https://dev.azure.com/${ORG}/${PROJECT}/_apis/wit/workItems/${wiId}/comments?api-version=7.0-preview.3`;
  const body = { text: html };
  return adoRequest('POST', url, body);
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📤 Subiendo resultados a Azure DevOps');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!PAT) {
    console.error('❌ Error: ADO_PAT no está definido. Ejecuta primero el script de extracción de PAT.');
    process.exit(1);
  }

  for (const tc of results) {
    console.log(`📤 TC-${tc.tcId} (WI ${tc.wiId}) — ${tc.title}`);
    try {
      const html = buildCommentHtml(tc);
      await addComment(tc.wiId, html);
      console.log(`   ✅ Comentario publicado correctamente\n`);
    } catch (err) {
      console.error(`   ❌ Error: ${err.message}\n`);
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Proceso completado');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main();
