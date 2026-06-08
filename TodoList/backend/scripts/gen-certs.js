#!/usr/bin/env node
/**
 * Genera un certificado SSL auto-firmado para desarrollo local.
 * Requiere que 'openssl' este instalado en el sistema.
 * Uso: npm run gen-certs
 */
const { execSync } = require('child_process');
const path = require('path');
const fs   = require('fs');

const CERT_DIR = path.join(__dirname, '..', 'certs');
fs.mkdirSync(CERT_DIR, { recursive: true });

const keyFile  = path.join(CERT_DIR, 'server.key');
const certFile = path.join(CERT_DIR, 'server.crt');

console.log('Generando clave privada y certificado auto-firmado...');

execSync(
  `openssl req -x509 -newkey rsa:4096 -keyout "${keyFile}" -out "${certFile}" -days 365 -nodes -subj "/C=BO/ST=Cochabamba/L=Cochabamba/O=Dev/OU=Dev/CN=localhost"`,
  { stdio: 'inherit' }
);

console.log('\nCertificados generados en: ' + CERT_DIR);
console.log('  server.key  -> clave privada');
console.log('  server.crt  -> certificado publico (365 dias)');
console.log('\nATENCION: Solo para desarrollo. NO subir al repositorio.');
