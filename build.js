#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the static files
const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scriptJs = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');
const stylesCSS = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');

// Read the worker template
const workerTemplate = fs.readFileSync(path.join(__dirname, 'worker.js'), 'utf8');

// Escape backticks and ${} in the content
function escapeContent(content) {
  return content
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
}

// Replace the placeholders with actual content
const workerContent = workerTemplate
  .replace('`<!-- Content loaded from index.html -->`', '`' + escapeContent(indexHtml) + '`')
  .replace('`// Content loaded from script.js`', '`' + escapeContent(scriptJs) + '`')
  .replace('`/* Content loaded from styles.css */`', '`' + escapeContent(stylesCSS) + '`');

// Write the bundled worker
fs.writeFileSync(path.join(__dirname, 'dist', 'worker.js'), workerContent);

console.log('✅ Worker bundle created successfully!');
