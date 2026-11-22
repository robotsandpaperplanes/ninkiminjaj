import test from 'node:test';
import assert from 'node:assert/strict';
import { employeeSeed, createEmployeeDatabase, loadEmployeeDatabase, removeEmployees, approveEmployee, EMPLOYEE_STORAGE } from '../src/employee-data.ts';

test('working copy is isolated and reset restores deleted records and settings', () => {
  const db = createEmployeeDatabase();
  assert.equal(db.employees.length, 74);
  db.employees[0].name = 'Изменённое имя';
  db.settings.autoRecord = true;
  const removed = removeEmployees(db, db.employees.map(e => e.id));
  assert.equal(removed.employees.length, 1);
  assert.equal(removed.employees[0].role, 'owner');
  const reset = createEmployeeDatabase();
  assert.equal(reset.employees.length, 74);
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
  assert.equal(updated.employees.filter(e => e.status === 'active').length, 67);
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
    assert.equal(loadEmployeeDatabase().employees.length, 74);
  }
  delete globalThis.localStorage;
  assert.equal(loadEmployeeDatabase().employees.length, 74);
});


test('email aliases are unique and the original guests become employees', () => {
  const db = createEmployeeDatabase();
  assert.equal(new Set(db.employees.map(e => e.email)).size, 74);
  assert.equal(db.employees.find(e => e.name === 'Эдуард Обрин').email, 'e.obrien@dundermifflinpaper.com');
  assert.equal(db.employees.find(e => e.name === 'Фома Йоркин').email, 't.yorke@dundermifflinpaper.com');
  assert.equal(db.employees.filter(e => e.role === 'guest').length, 5);
  for (const id of ['employee-039', 'employee-040', 'employee-041']) assert.equal(db.employees.find(e => e.id === id).role, 'employee');
  assert(db.employees.every(e => /^[a-z0-9.]+@dundermifflinpaper[.]com$/.test(e.email)));
});

test('v1 upgrade preserves deletions, approvals and settings, adds guests once', () => {
  const old = createEmployeeDatabase();
  old.version = 1;
  old.employees = old.employees.slice(0, 69).filter(e => e.id !== 'employee-002');
  old.employees.forEach(e => { e.email = e.id + '@old.example'; });
  old.employees.find(e => e.id === 'employee-039').role = 'guest';
  old.employees.find(e => e.id === 'employee-066').status = 'active';
  old.settings.autoRecord = true;
  globalThis.localStorage = { getItem() { return JSON.stringify(old); } };
  const upgraded = loadEmployeeDatabase();
  assert.equal(upgraded.version, 2);
  assert.equal(upgraded.employees.length, 73);
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
