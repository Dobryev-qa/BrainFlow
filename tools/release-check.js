#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const requiredFiles = [
  'manifest.json',
  'src/background.js',
  'src/content.js',
  'src/content.css',
  'src/popup.html',
  'src/popup.js',
  'src/options/options.html',
  'src/options/options.js',
  'src/stats.html',
  'src/stats.js',
  'assets/icons/icon-16.png',
  'assets/icons/icon-32.png',
  'assets/icons/icon-48.png',
  'assets/icons/icon-128.png',
  'PRIVACY_POLICY.md'
];

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exitCode = 1;
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

for (const rel of requiredFiles) {
  if (!exists(rel)) fail(`missing ${rel}`);
}

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  ok('manifest.json parse');
} catch (e) {
  fail(`manifest parse error: ${e.message}`);
  process.exit(1);
}

if (manifest.manifest_version !== 3) fail('manifest_version must be 3');
else ok('manifest_version = 3');

const perms = new Set(manifest.permissions || []);
['storage', 'tabs', 'scripting'].forEach((p) => {
  if (!perms.has(p)) fail(`missing permission: ${p}`);
  else ok(`permission present: ${p}`);
});

if (!Array.isArray(manifest.host_permissions) || !manifest.host_permissions.includes('<all_urls>')) {
  fail('host_permissions must include <all_urls>');
} else {
  ok('host_permissions include <all_urls>');
}

const bg = manifest.background || {};
if (bg.service_worker !== 'src/background.js') fail('background.service_worker must be src/background.js');
else ok('background service worker path');

if (manifest.options_page !== 'src/options/options.html') fail('options_page must be src/options/options.html');
else ok('options_page path');

const icons = manifest.icons || {};
['16', '32', '48', '128'].forEach((k) => {
  if (!icons[k] || !exists(icons[k])) fail(`icon ${k} missing or path invalid`);
  else ok(`icon ${k} exists`);
});

if (process.exitCode) {
  console.error('\nRelease check finished with errors.');
  process.exit(process.exitCode);
}
console.log('\nRelease check passed.');
