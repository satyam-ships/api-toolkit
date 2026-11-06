'use strict';
const t = require('node:test'); const assert = require('node:assert');
const { validate, security } = require('../src/index');
t.test('detects undeclared path param', () => {
  const i = validate({ openapi: '3.0.0', info: { title: 'a', version: '1' }, paths: { '/x/{id}': { get: { responses: { 200: {} } } } } });
  assert.ok(i.some(x => /path parameter "id"/.test(x.msg)));
});
t.test('detects duplicate operationId', () => {
  const op = { operationId: 'a', responses: { 200: {} } };
  const i = validate({ openapi: '3.0.0', info: { title: 'a', version: '1' }, paths: { '/a': { get: op }, '/b': { get: op } } });
  assert.ok(i.some(x => /duplicate/.test(x.msg)));
});
t.test('security flags missing headers', async () => {
  const fake = async () => ({ status: 200, headers: new Map([['x-powered-by', 'Express']]) });
  const r = await security('https://a.test', fake);
  assert.ok(r.issues.some(x => /x-powered-by/.test(x.msg)));
});
