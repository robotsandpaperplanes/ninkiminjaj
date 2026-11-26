import test from 'node:test';
import assert from 'node:assert/strict';
import { covers, finishOperation, operationId, recordOperation, resultFor, retryOperation, validDomain, validIP } from '../src/on-prem/model.ts';
import { applyNetworkOutcome } from '../src/on-prem/network-model.ts';
import { certificateGroups, machines, networkProducts, licenseProducts, baseIPs, baseDomains, baseCerts } from '../src/on-prem/fixtures.ts';

const operation = (scenario = 'partial') => ({ id: 'NET-test', started: 100, status: 'running', scenario, nodes: ['web-01', 'media-01', 'gateway-02'], results: {}, failId: 'web-01', attempt: 1, mode: 'apply', rows: [{ node: 'web-01', label: 'Web', before: '10.20.0.11', after: '10.20.0.111' }, { node: 'media-01', label: 'Media', before: '10.20.0.12', after: '10.20.0.112' }], payload: { kind: 'ip', product: 'meet', direct: ['web-01', 'media-01'], targetDomain: 'meet.company.ru', replaceCert: true, certSAN: ['meet.company.ru', 'media.meet.company.ru', 'msg.meet.company.ru'] } });
const config = () => ({ ips: { ...baseIPs }, domains: { ...baseDomains }, certs: structuredClone(baseCerts) });

test('On-Prem fixture IDs are unique and node references resolve without merging product models', () => {
  for (const items of [certificateGroups, certificateGroups.flatMap(g => g.nodes), machines, networkProducts, licenseProducts]) assert.equal(new Set(items.map(item => item.id)).size, items.length);
  const ids = new Set(machines.map(node => node.id));
  for (const node of machines) for (const id of node.deps) assert(ids.has(id));
  for (const product of networkProducts) for (const id of [...product.nodes, ...product.deps]) assert(ids.has(id));
  for (const product of licenseProducts) assert(ids.has(product.node));
  assert.notEqual(certificateGroups.find(g => g.id === 'meet').domains[0], networkProducts.find(g => g.id === 'meet').base);
});

test('mock address validation rejects invalid/conflicting formats and limits wildcard depth', () => {
  for (const ip of ['127.0.0.1', '0.1.2.3', '224.1.2.3', '10.2.3.256', '10.02.3.4', 'example.ru']) assert.equal(validIP(ip), false);
  assert(validIP('10.20.0.111'));
  for (const name of ['https://meet.example.ru', 'meet.example.ru:443', '-meet.example.ru', '10.20.0.1', 'a'.repeat(64) + '.ru']) assert.equal(validDomain(name), false);
  assert(validDomain('media.meet.example.ru'));
  assert(covers(['*.example.ru'], 'meet.example.ru'));
  assert.equal(covers(['*.example.ru'], 'media.meet.example.ru'), false);
  assert.equal(covers(['*.example.ru'], 'example.ru'), false);
});

test('partial IP application changes only confirmed targets; retry preserves successful nodes', () => {
  const before = config();
  const done = finishOperation(operation());
  assert.equal(done.status, 'partial');
  const after = applyNetworkOutcome(before, done);
  assert.equal(after.ips['web-01'], before.ips['web-01']);
  assert.equal(after.ips['media-01'], '10.20.0.112');
  assert.equal(before.ips['media-01'], '10.20.0.12');
  const retry = retryOperation(done, 'retry');
  assert.equal(retry.id, done.id);
  assert.equal(retry.attempt, 2);
  assert.equal(resultFor(retry, 'media-01', retry.started), 'success');
  assert.equal(resultFor(retry, 'web-01', retry.started), 'running');
  const final = applyNetworkOutcome(after, finishOperation(retry));
  assert.equal(final.ips['web-01'], '10.20.0.111');
});

test('unknown FQDN results do not commit a certificate/domain pair until reconciliation', () => {
  const before = config();
  const op = operation('lost'); op.payload.kind = 'fqdn';
  const done = finishOperation(op);
  assert.equal(done.status, 'unknown');
  assert.deepEqual(applyNetworkOutcome(before, done), before);
  const reconcile = retryOperation(done, 'reconcile');
  assert.equal(reconcile.attempt, 1);
  const after = applyNetworkOutcome(before, finishOperation(reconcile));
  assert.equal(after.domains.meet, 'meet.company.ru');
  assert.deepEqual(after.certs.meet, op.payload.certSAN);
  assert.deepEqual(after.ips, before.ips);
  assert.deepEqual(after.certs.platform, before.certs.platform);
});

test('operation IDs remain unique after history truncation; retry replaces only its entry', () => {
  let history = [];
  const ids = new Set();
  for (let i = 0; i < 30; i++) {
    const op = { ...finishOperation(operation('success')), id: operationId('NET') };
    assert(!ids.has(op.id)); ids.add(op.id);
    history = recordOperation(history, op, 5);
  }
  assert.equal(history.length, 5);
  const id = history[2].id;
  history = recordOperation(history, { ...history[2], attempt: 2 }, 5);
  assert.equal(history.length, 5);
  assert.equal(history.filter(item => item.id === id).length, 1);
  assert.equal(history[0].attempt, 2);
});
