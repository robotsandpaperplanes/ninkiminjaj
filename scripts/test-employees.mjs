import test from 'node:test';
import assert from 'node:assert/strict';
import { employeeSeed, addedIdentities, createEmployeeDatabase, loadEmployeeDatabase, removeEmployees, approveEmployee, saveEmployeeProfileField, EMPLOYEE_STORAGE } from '../src/employee-data.ts';

test('working copy is isolated and reset restores deleted records and settings', () => {
  const db = createEmployeeDatabase();
  assert.equal(db.employees.length, 200);
  db.employees[0].name = 'Изменённое имя';
  db.settings.autoRecord = true;
  const removed = removeEmployees(db, db.employees.map(e => e.id));
  assert.equal(removed.employees.length, 1);
  assert.equal(removed.employees[0].role, 'owner');
  const reset = createEmployeeDatabase();
  assert.equal(reset.employees.length, 200);
  assert.equal(reset.employees[0].name, 'Фома Йоркин');
  assert.equal(reset.settings.autoRecord, false);
  assert.equal(employeeSeed[0].name, 'Фома Йоркин');
});

test('approval moves only a request to employees and keeps other states intact', () => {
  const db = createEmployeeDatabase();
  assert.equal(db.employees.filter(e => e.status === 'requested').length, 4);
  assert.equal(db.employees.filter(e => e.status === 'invited').length, 4);
  const request = db.employees.find(e => e.status === 'requested');
  const updated = approveEmployee(db, request.id);
  assert.equal(updated.employees.filter(e => e.status === 'active').length, 193);
  assert.equal(request.status, 'requested');
  const invited = db.employees.find(e => e.status === 'invited');
  assert.equal(approveEmployee(db, invited.id).employees.find(e => e.id === invited.id).status, 'invited');
});

test('saved working copy survives loading; corrupt or unavailable storage restores seed', () => {
  const db = removeEmployees(createEmployeeDatabase(), ['employee-002']);
  globalThis.localStorage = { getItem(key) { assert.equal(key, EMPLOYEE_STORAGE); return JSON.stringify(db); } };
  assert.deepEqual(loadEmployeeDatabase(), db);
  for (const invalid of ['{broken', '{"version":0}', '{"version":1,"employees":[]}']) {
    globalThis.localStorage = { getItem() { return invalid; } };
    assert.equal(loadEmployeeDatabase().employees.length, 200);
  }
  delete globalThis.localStorage;
  assert.equal(loadEmployeeDatabase().employees.length, 200);
});


test('email aliases are unique and the original guests become employees', () => {
  const db = createEmployeeDatabase();
  assert.equal(new Set(db.employees.map(e => e.email)).size, 200);
  assert.equal(db.employees.find(e => e.name === 'Эдуард Обрин').email, 'e.obrien@dundermifflinpaper.com');
  assert.equal(db.employees.find(e => e.name === 'Фома Йоркин').email, 't.yorke@dundermifflinpaper.com');
  assert.equal(db.employees.filter(e => e.role === 'guest').length, 5);
  for (const id of ['employee-039', 'employee-040', 'employee-041']) assert.equal(db.employees.find(e => e.id === id).role, 'employee');
  assert(db.employees.every(e => /^[a-z0-9.]+@dundermifflinpaper[.]com$/.test(e.email)));
});

test('v1 upgrade preserves deletions, approvals and settings, adds guests and new users once', () => {
  const old = createEmployeeDatabase();
  old.version = 1;
  old.employees = old.employees.slice(0, 69).filter(e => e.id !== 'employee-002');
  old.employees.forEach(e => { e.email = e.id + '@old.example'; });
  old.employees.find(e => e.id === 'employee-039').role = 'guest';
  old.employees.find(e => e.id === 'employee-066').status = 'active';
  old.settings.autoRecord = true;
  globalThis.localStorage = { getItem() { return JSON.stringify(old); } };
  const upgraded = loadEmployeeDatabase();
  assert.equal(upgraded.version, 3);
  assert.equal(upgraded.employees.length, 199);
  assert(!upgraded.employees.some(e => e.id === 'employee-002'));
  assert.equal(upgraded.employees.find(e => e.id === 'employee-066').status, 'active');
  assert.equal(upgraded.settings.autoRecord, true);
  assert.equal(upgraded.employees.find(e => e.id === 'employee-039').role, 'employee');
  assert.equal(upgraded.employees[0].email, 't.yorke@dundermifflinpaper.com');
  const deletedGuest = removeEmployees(upgraded, ['employee-070']);
  globalThis.localStorage = { getItem() { return JSON.stringify(deletedGuest); } };
  assert.deepEqual(loadEmployeeDatabase(), deletedGuest);
  delete globalThis.localStorage;
});


test('the 126 appended identities have stable IDs, Cyrillic names and deterministic unique aliases', () => {
  assert.equal(addedIdentities.length, 126);
  assert.equal(employeeSeed.length, 200);
  assert(Object.isFrozen(employeeSeed));
  assert.equal(new Set(employeeSeed.map(e => e.id)).size, 200);
  assert.equal(new Set(employeeSeed.map(e => e.email)).size, 200);
  assert.equal(new Set(employeeSeed.map(e => e.name)).size, 200);
  const used = new Set(employeeSeed.slice(0, 74).map(e => e.email));
  for (const [index, identity] of addedIdentities.entries()) {
    const user = employeeSeed[index + 74];
    assert.equal(user.id, `employee-${String(index + 75).padStart(3, '0')}`);
    assert.equal(user.name, identity.name);
    assert(/^[\p{Script=Cyrillic}\s-]+$/u.test(user.name));
    const last = identity.last.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/gi, '').toLowerCase();
    const base = `${identity.first[0].toLowerCase()}.${last}`;
    let expected = `${base}@dundermifflinpaper.com`;
    for (let suffix = 2; used.has(expected); suffix++) expected = `${base}${suffix}@dundermifflinpaper.com`;
    assert.equal(user.email, expected);
    assert.equal(user.role, 'employee');
    assert.equal(user.status, 'active');
    assert.equal(user.avatar, undefined);
    used.add(expected);
  }
  assert.equal(employeeSeed.filter(e => e.status === 'active').length, 192);
  assert.equal(employeeSeed.filter(e => e.status === 'invited').length, 4);
  assert.equal(employeeSeed.filter(e => e.status === 'requested').length, 4);
  assert.equal(employeeSeed.filter(e => e.role === 'guest').length, 5);
  assert.equal(employeeSeed.filter(e => e.role === 'admin').length, 2);
  assert.equal(employeeSeed.filter(e => e.role === 'owner').length, 1);
});

test('v2 migration appends new IDs without changing curated records or restoring deletions', () => {
  const old = createEmployeeDatabase();
  old.version = 2;
  old.employees = old.employees.slice(0, 74).filter(e => e.id !== 'employee-002');
  old.employees.find(e => e.id === 'employee-001').name = 'Переименованный сотрудник';
  old.employees.find(e => e.id === 'employee-066').status = 'active';
  old.settings.camera = true;
  globalThis.localStorage = { getItem() { return JSON.stringify(old); } };
  const migrated = loadEmployeeDatabase();
  assert.equal(migrated.version, 3);
  assert.equal(migrated.employees.length, 199);
  assert.equal(migrated.employees.find(e => e.id === 'employee-001').name, 'Переименованный сотрудник');
  assert.equal(migrated.employees.find(e => e.id === 'employee-066').status, 'active');
  assert.equal(migrated.settings.camera, true);
  assert(!migrated.employees.some(e => e.id === 'employee-002'));
  assert.deepEqual(migrated.employees.slice(0, 73), old.employees);
  globalThis.localStorage = { getItem() { return JSON.stringify(migrated); } };
  assert.deepEqual(loadEmployeeDatabase(), migrated);
  delete globalThis.localStorage;
});

test('profile field definitions save by ID without changing employee values and reset restores the baseline', () => {
  const db = createEmployeeDatabase();
  const original = db.profileFields[0];
  db.employees[0].customFieldValues = { [original.id]: 'Тестовое значение' };
  const renamed = saveEmployeeProfileField(db, { ...original, name: '  Город  ', hint: 'Введите город' }, true);
  assert.equal(renamed.profileFields[0].id, original.id);
  assert.equal(renamed.profileFields[0].name, 'Город');
  assert.equal(renamed.profileFields[0].hint, 'Введите город');
  assert.deepEqual(renamed.employees, db.employees);
  assert.equal(db.profileFields[0].name, 'Локация');

  const field = { id: 'test-field', name: 'Город', hint: '', ssoKey: 'city' };
  assert.equal(saveEmployeeProfileField(renamed, { ...field, name: '   ' }, false), renamed);
  const added = saveEmployeeProfileField(renamed, field, false);
  assert.deepEqual(added.profileFields.at(-1), field);
  assert.deepEqual(createEmployeeDatabase().profileFields, db.profileFields);
});

test('legacy working copies gain profile definitions without losing employee edits', () => {
  const db = createEmployeeDatabase();
  const { profileFields, ...legacy } = db;
  legacy.employees[0].name = 'Изменённое имя';
  legacy.employees[0].customFieldValues = { [profileFields[0].id]: 'Тестовое значение' };
  legacy.settings.camera = true;
  globalThis.localStorage = { getItem: () => JSON.stringify(legacy) };
  try {
    assert.deepEqual(loadEmployeeDatabase(), { ...legacy, profileFields });
  } finally {
    delete globalThis.localStorage;
  }
});
