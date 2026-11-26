import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRoute, routePath, rememberedRoute } from '../src/app/routes.ts';

test('legacy URLs and remembered Cloud versions keep their destinations', () => {
  globalThis.localStorage = { getItem: key => key === 'mts-link-groups-active-version' ? '3' : null };
  try {
    assert.deepEqual(parseRoute('/', '', '#employees'), { mode: 'cloud', section: 'employees' });
    assert.deepEqual(parseRoute('/', '', '#api'), { mode: 'cloud', section: 'api' });
    assert.deepEqual(parseRoute('/cloud'), { mode: 'cloud', section: 'roles' });
    assert.deepEqual(parseRoute('/on-prem'), { mode: 'on-prem', section: 'certificates' });
    assert.deepEqual(parseRoute('/cloud/groups'), { mode: 'cloud', section: 'groups' });
    assert.deepEqual(parseRoute('/cloud/organization'), { mode: 'cloud', section: 'organization' });
  } finally { delete globalThis.localStorage; }
});

test('route roundtrips preserve entity IDs and network tabs without mixing modes', () => {
  for (const route of [
    { mode: 'cloud', section: 'roles', id: 'role / Кириллица' },
    { mode: 'cloud', section: 'multi-groups', id: 'everyone' },
    ...['permissions', 'settings', 'products'].map(groupTab => ({ mode: 'cloud', section: 'multi-groups', id: 'multi-system-everyone', groupTab })),
    { mode: 'cloud', section: 'security' },
    { mode: 'cloud', section: 'organization' },
    { mode: 'cloud', section: 'federations' },
    { mode: 'on-prem', section: 'network', tab: 'fqdn' },
    { mode: 'on-prem', section: 'network', tab: 'history' },
    { mode: 'on-prem', section: 'license' },
  ]) {
    const url = new URL(routePath(route), 'http://localhost');
    assert.deepEqual(parseRoute(url.pathname, url.search), route);
  }
  assert.equal(parseRoute('/cloud/certificates'), null);
  assert.equal(parseRoute('/on-prem/employees'), null);
  assert.equal(parseRoute('/on-prem/organization'), null);
  assert.equal(parseRoute('/on-prem/federations'), null);
  assert.equal(parseRoute('/cloud/federations/entity'), null);
  assert.equal(parseRoute('/cloud/organization/entity'), null);
  assert.equal(parseRoute('/cloud/roles/%broken'), null);
  assert.equal(parseRoute('/cloud/api/key-id'), null);
  assert.equal(parseRoute('/cloud/security/entity'), null);
  assert.deepEqual(parseRoute('/cloud/multi-groups', '?tab=settings'), { mode: 'cloud', section: 'multi-groups' });
  assert.deepEqual(parseRoute('/cloud/multi-groups/multi-system-everyone', '?tab=members'), { mode: 'cloud', section: 'multi-groups', id: 'multi-system-everyone' });
  assert.equal(parseRoute('/on-prem/network/unrecognized'), null);
  assert.deepEqual(parseRoute('/on-prem/network', '?tab=invalid'), { mode: 'on-prem', section: 'network', tab: 'ip' });
});

test('remembered destinations are mode-scoped and tolerate unavailable storage', () => {
  globalThis.localStorage = { getItem: key => key === 'mts-link-admin-last-on-prem' ? '/cloud/roles' : key === 'mts-link-admin-last-cloud' ? '/cloud/organization' : null };
  assert.deepEqual(rememberedRoute('on-prem'), { mode: 'on-prem', section: 'certificates' });
  assert.deepEqual(rememberedRoute('cloud'), { mode: 'cloud', section: 'organization' });
  globalThis.localStorage = { getItem: () => { throw new Error('blocked'); } };
  try {
    assert.deepEqual(rememberedRoute('cloud'), { mode: 'cloud', section: 'groups' });
    assert.deepEqual(rememberedRoute('on-prem'), { mode: 'on-prem', section: 'certificates' });
  } finally { delete globalThis.localStorage; }
});
