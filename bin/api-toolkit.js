#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const { validate, security, test } = require('../src/index');
const [cmd, target] = process.argv.slice(2);
const show = issues => issues.forEach(i => console.log(`${i.level === 'error' ? '✗' : '⚠'} ${i.msg}`));
(async () => {
  if (cmd === 'validate' && target) {
    const issues = validate(JSON.parse(fs.readFileSync(target, 'utf8')));
    show(issues); const errs = issues.filter(i => i.level === 'error').length;
    console.log(`\n${errs} errors, ${issues.length - errs} warnings`); process.exit(errs ? 1 : 0);
  } else if (cmd === 'security' && target) {
    const r = await security(target); console.log(`HTTP ${r.status}`); show(r.issues);
    console.log(r.issues.length ? `\n${r.issues.length} issues` : '✓ no issues found'); process.exit(r.issues.some(i => i.level === 'error') ? 1 : 0);
  } else if (cmd === 'test' && target) {
    console.log(await test(target));
  } else {
    console.log('Usage:\n  api-toolkit validate <openapi.json>\n  api-toolkit security <url>\n  api-toolkit test <url>');
  }
})().catch(e => { console.error(e.message); process.exit(2); });
