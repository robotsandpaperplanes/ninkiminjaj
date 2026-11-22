// Static React rendering only: no browser, network listener or DOM emulation.
import { mkdtemp, readdir, readFile, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const root = resolve(import.meta.dirname, '..');
const temporary = await mkdtemp(join(tmpdir(), 'admin-panel-render-'));
try {
  await symlink(join(root, 'node_modules'), join(temporary, 'node_modules'));
  for (const name of await readdir(join(root, 'src'))) {
    if (!/\.tsx?$/.test(name) || name === 'main.tsx') continue;
    const source = await readFile(join(root, 'src', name), 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
    await writeFile(join(temporary, name.replace(/\.tsx?$/, '.mjs')), compiled.replace(/from '(\.\/[^']+)'/g, "from '$1.mjs'"));
  }
  const { default: App } = await import(pathToFileURL(join(temporary, 'App.mjs')).href);
  for (const [section, version, title] of [['groups', '1', 'Группы (сейчас)'], ['groups', '2', 'Группы (мульти)'], ['groups', '3', 'Роли'], ['api', '1', 'API и вебхуки'], ['employees', '1', 'Сотрудники']]) {
    const stored = new Map([['mts-link-admin-active-section', section], ['mts-link-groups-active-version', version]]);
    globalThis.localStorage = { getItem: key => stored.get(key) ?? null };
    globalThis.location = { hash: '' };
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
    console.log(`PASS static render: ${title}`);
  }
} finally {
  delete globalThis.localStorage;
  delete globalThis.location;
  await rm(temporary, { recursive: true, force: true });
}
