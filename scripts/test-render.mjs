// Static React rendering only: no browser, network listener or DOM emulation.
import { mkdtemp, readdir, readFile, writeFile, symlink, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const root = resolve(import.meta.dirname, '..');
const temporary = await mkdtemp(join(tmpdir(), 'admin-panel-render-'));
try {
  await symlink(join(root, 'node_modules'), join(temporary, 'node_modules'));
  for (const name of await readdir(join(root, 'src'), { recursive: true })) {
    if (!/\.tsx?$/.test(name) || name === 'main.tsx') continue;
    const source = await readFile(join(root, 'src', name), 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
    await mkdir(dirname(join(temporary, name)), { recursive: true });
    await writeFile(join(temporary, name.replace(/\.tsx?$/, '.mjs')), compiled.replace(/from '(\.{1,2}\/[^']+)'/g, "from '$1.mjs'"));
  }
  const { default: App } = await import(pathToFileURL(join(temporary, 'App.mjs')).href);
  const { ORGANIZATION_STORAGE, createOrganizationState, loadOrganizationState, organizationInvitationUrl, rotateOrganizationInvitation } = await import(pathToFileURL(join(temporary, 'organization-model.mjs')).href);
  const original = createOrganizationState();
  const workingCopy = createOrganizationState();
  workingCopy.overview.name = 'Организация для проверки';
  workingCopy.overview.invitation = rotateOrganizationInvitation(workingCopy.overview.invitation);
  workingCopy.productVisibility['Чаты'] = true;
  workingCopy.rights.createCourses = true;
  workingCopy.settings.camera = true;
  globalThis.localStorage = { getItem: key => key === ORGANIZATION_STORAGE ? JSON.stringify(workingCopy) : null };
  assert.deepEqual(loadOrganizationState(), workingCopy);
  delete workingCopy.settings.desktopSelf;
  assert.deepEqual(loadOrganizationState().settings, { ...workingCopy.settings, desktopSelf: false });
  assert.notEqual(workingCopy.overview.invitation.token, original.overview.invitation.token);
  assert.match(organizationInvitationUrl(workingCopy.overview.invitation.token), /^https:\/\/link\.example\//);
  workingCopy.settings.recordingAccess = 'invalid';
  assert.deepEqual(loadOrganizationState().settings, original.settings);
  assert.equal(loadOrganizationState().productVisibility['Чаты'], true);
  assert.deepEqual(createOrganizationState(), original);
  console.log('PASS Organization working-copy load, validation and reset baseline');
  for (const [section, version, title] of [['groups', '1', 'Группы (сейчас)'], ['groups', '2', 'Группы (мульти)'], ['groups', '3', 'Роли'], ['api', '1', 'API и вебхуки'], ['employees', '1', 'Сотрудники'], ['organization', '1', 'Организация'], ['organization', '2', 'Организация'], ['organization', '3', 'Организация']]) {
    const stored = new Map([['mts-link-admin-active-section', section], ['mts-link-groups-active-version', version]]);
    globalThis.localStorage = { getItem: key => stored.get(key) ?? null };
    globalThis.location = { hash: '', pathname: '/', search: '' };
    const html = renderToStaticMarkup(React.createElement(App));
    assert.match(html, new RegExp(`<h1[^>]*>${title.replace(/[()]/g, '\\$&')}</h1>`));
    assert.equal((html.match(/aria-label="Сценарии прототипа"/g) || []).length, 1);
    if (section === 'employees') {
      assert(html.includes('aria-label="Сотрудники организации"'));
      assert.equal((html.match(/aria-label="Выбрать: /g) || []).length, 12);
      assert(html.includes('aria-label="Страницы сотрудников"'));
      assert(!html.includes('Виктория Соколова'));
      for (const name of ['Эдуард Обрин', 'Фома Йоркин', 'e.obrien@dundermifflinpaper.com', 'Запросы на вступление · 4', 'Приглашения · 4']) assert(html.includes(name));
    }
    if (section === 'api') {
      assert(html.includes('aria-label="Ключи API"'));
      for (const label of ['Кадровая система', 'Устаревший', 'Истёк срок', 'Создать ключ', 'Журнал', 'Доступ']) assert(html.includes(label));
      assert(!html.includes('aria-label="Созданные группы"'));
    }
    if (section === 'organization') {
      assert.match(html, /aria-current="page"[^>]*>.*?Организация/);
      for (const label of ['Управление продуктами', 'Телефония', 'Внутренние номера', '16,5 ГБ']) assert(html.includes(label));
      assert.equal((html.match(/Перейти к настройкам по умолчанию/g) || []).length, 1);
      const toBe = version === '2';
      assert.equal(html.includes('aria-labelledby="organization-security"'), toBe);
      assert.equal(html.includes('aria-label="Разрешить подключение через мобильный браузер"'), toBe);
      assert.equal(html.includes('Сотрудники с электронной почтой в этом домене могут добавиться в организацию.'), toBe);
      assert.equal((html.match(/aria-label="Использование хранилища"/g) || []).length, 1);
      for (const key of ['rights', 'settings']) assert.equal(html.includes(`id="organization-panel-${key}"`), !toBe);
      assert.equal(html.includes('id="organization-panel-defaults"'), toBe);
      for (const label of ['Права и настройки по умолчанию', 'Права по умолчанию', 'Настройки по умолчанию']) {
        assert.equal(html.includes('>' + label + '<'), toBe, label);
      }
      for (const label of ['Возможность создавать курсы', 'Запускать запись при старте мероприятия']) {
        assert.equal(html.includes('aria-label="' + label + '"'), !toBe, label);
      }
      assert(!html.includes('aria-label="Поиск ролей"'));
    }
    console.log(`PASS static render: ${title}`);
  }
  const { functionalGroupRights } = await import(pathToFileURL(join(temporary, 'functional-group-rights.mjs')).href);
  const mockRights = functionalGroupRights.flatMap(section => section.blocks.flatMap(block => block.rights)).filter(right => !right.legacy);
  assert.equal(mockRights.filter(right => right.key.startsWith('chat.')).length, 14);
  assert.equal(mockRights.filter(right => right.key.startsWith('meetings.')).length, 9);
  assert.equal(new Set(mockRights.map(right => right.key)).size, 23);
  globalThis.localStorage = { getItem: () => null };
  for (const [tab, labels] of [
    ['permissions', mockRights.map(right => right.label)],
    ['settings', ['Настройки', 'Автоматически начинать запись встреч', 'Тип ссылки-приглашения по умолчанию']],
    ['products', ['Доступ к продуктам', 'ИИ-помощник', 'Диск']],
  ]) {
    globalThis.location = { pathname: '/cloud/multi-groups/multi-system-everyone', search: '?tab=' + tab, hash: '' };
    const html = renderToStaticMarkup(React.createElement(App));
    assert.match(html, /<h1[^>]*>@everyone<\/h1>/);
    assert(html.includes('role="tabpanel" id="group-panel-' + tab + '"'));
    for (const label of labels) assert(html.includes(label), label);
    console.log(`PASS @everyone render: ${tab}`);
  }
  for (const [path, title] of [['/cloud/federations', 'Федерации'], ['/cloud/organization', 'Организация'], ['/cloud/security', 'Безопасность'], ['/cloud/employees', 'Сотрудники'], ['/cloud/roles', 'Роли'], ['/on-prem/certificates', 'Сертификаты'], ['/on-prem/license', 'Лицензия'], ['/on-prem/network', 'Сетевые настройки']]) {
    globalThis.localStorage = { getItem: () => null };
    globalThis.location = { pathname: path, hash: '', search: '' };
    const html = renderToStaticMarkup(React.createElement(App));
    assert.match(html, new RegExp(`<h1[^>]*>${title.replace(/[()]/g, '\\$&')}</h1>`));
    assert(html.includes('Режим администрирования: ' + (path.startsWith('/cloud') ? 'Облако' : 'Сервер')));
    if (path === '/cloud/security') {
      assert(html.includes('Раздел «Безопасность» пока не представлен.'));
      assert(!html.includes('Разрешённые типы файлов'));
      assert(!html.includes('Контроль передачи конфиденциальных файлов'));
    }
    if (path === '/cloud/federations') {
      for (const label of ['Приглашения · 3', 'Доверенные организации · 3', 'Показать ещё 1', 'Домен отсутствует', 'arcadefire.mts-link.ca']) assert(html.includes(label));
      assert.equal((html.match(/aria-label="Принять приглашение: /g) || []).length, 2);
      assert.equal((html.match(/aria-label="Изменить организацию: /g) || []).length, 3);
      assert(!html.includes('Northline Studio'));
    }
    console.log(`PASS routed render: ${path}`);
  }
} finally {
  delete globalThis.localStorage;
  delete globalThis.location;
  await rm(temporary, { recursive: true, force: true });
}
