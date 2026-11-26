import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { availableScopes, keyStatus, initialApiState, generateDemoSecret, transitionApiKey, changeAdminAccess, loadApiState } from '../src/api-model.ts';

test('new audit events snapshot the current organization name', () => {
  const original = initialApiState();
  const next = changeAdminAccess(original, 'dwight', true, 'Учебная организация');
  assert.equal(next.events[0].organization, 'Учебная организация');
  assert.deepEqual(next.events.slice(1), original.events);
});

test('new and legacy keys cannot cross their scope boundaries', () => {
  const modern = availableScopes('secure').map(s => s.code);
  const legacy = availableScopes('legacy').map(s => s.code);
  assert(!modern.includes('userapi_organization'));
  assert(!modern.includes('userapi_link_chats'));
  assert(modern.includes('userapi_organization_read'));
  assert(modern.includes('userapi_employees_write'));
  assert(!legacy.includes('userapi_employees_write'));
  assert(!legacy.includes('userapi_organization_email'));
});

test('expiry is inclusive and takes precedence over enabled flag', () => {
  const key = initialApiState().keys[0];
  const expiry = Date.parse(key.expiresAt);
  assert.equal(keyStatus(key, expiry - 1), 'active');
  assert.equal(keyStatus(key, expiry), 'expired');
  assert.equal(keyStatus({ ...key, enabled: false }, expiry), 'expired');
  assert.equal(keyStatus({ ...key, expiresAt: null, enabled: false }, expiry), 'disabled');
});

test('disable, rotate, enable and delete preserve audit without exposing modern secrets', async () => {
  const original = initialApiState();
  const key = original.keys[0];
  const secret = await generateDemoSecret();
  assert.equal(secret.hash, createHash('sha256').update(secret.value).digest('hex'));
  assert.notEqual(secret.value, (await generateDemoSecret()).value);
  let state = transitionApiKey(original, key.id, 'disable');
  state = transitionApiKey(state, key.id, 'rotate', secret, 365);
  assert.equal(state.keys.find(k => k.id === key.id).enabled, false);
  assert.equal(state.keys.find(k => k.id === key.id).secretHash, secret.hash);
  assert(!JSON.stringify(state).includes(secret.value));
  state = transitionApiKey(state, key.id, 'enable');
  assert.equal(keyStatus(state.keys.find(k => k.id === key.id)), 'active');
  state = transitionApiKey(state, key.id, 'delete');
  assert(!state.keys.some(k => k.id === key.id));
  assert.equal(state.events.length, original.events.length + 4);
  assert.equal(new Set(state.events.map(e => e.requestId)).size, state.events.length);
  assert.deepEqual(state.events.slice(4), original.events);
  assert(state.events.slice(0, 4).every(e => e.integrationId === key.id && e.responsible === key.creatorName));
  assert.equal(original.keys[0].enabled, true);
});

test('invalid rotation and expired-key activation leave state untouched', async () => {
  const state = initialApiState();
  const before = JSON.stringify(state);
  const secret = await generateDemoSecret();
  for (const days of [0, -1, 366, 1.5, NaN]) assert.throws(() => transitionApiKey(state, state.keys[0].id, 'rotate', secret, days));
  assert.throws(() => transitionApiKey(state, state.keys.find(k => keyStatus(k) === 'expired').id, 'enable'));
  assert.equal(JSON.stringify(state), before);
});

test('permission revocation keeps issued keys working, preserves owner permission and logs changes', () => {
  const original = initialApiState();
  let state = changeAdminAccess(original, 'jim', false);
  assert.deepEqual(state.keys, original.keys);
  assert.equal(state.admins.find(a => a.id === 'jim').allowed, false);
  assert.equal(state.events[0].operation, 'Отзыв полномочия');
  assert.strictEqual(changeAdminAccess(state, 'owner', false), state);
  state = changeAdminAccess(state, 'jim', true);
  assert.equal(state.events.length, original.events.length + 2);
  assert.equal(state.events[0].operation, 'Выдача полномочия');
});

test('legacy rotation remains readable and does not introduce expiry or new scopes', async () => {
  const original = initialApiState();
  const key = original.keys.find(k => k.kind === 'legacy');
  const secret = await generateDemoSecret();
  const state = transitionApiKey(original, key.id, 'rotate', secret);
  const updated = state.keys.find(k => k.id === key.id);
  assert.equal(updated.legacyValue, secret.value);
  assert.equal(updated.expiresAt, null);
  assert.deepEqual(updated.scopes, key.scopes);
  assert(!JSON.stringify(state.events).includes(secret.value));
  assert.equal(updated.createdBy, null);
});

test('no storage and invalid JSON fall back without modifying groups storage', () => {
  const reads = [];
  globalThis.localStorage = { getItem(key) { reads.push(key); return '{broken'; } };
  assert.equal(loadApiState().keys.length, 5);
  assert.deepEqual(reads, ['mts-link-admin-userapi-v1']);
  delete globalThis.localStorage;
  assert.equal(loadApiState().keys.length, 5);
});
