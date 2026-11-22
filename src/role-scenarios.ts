import type { Group } from './data';
import { hydrateGroup, getDetails } from './group-model';
import { roleConfig, everyoneSettings } from './role-model';
import { roleProducts, roleSections, roleAdminRights } from './role-catalog';

export const listScenarios = [
  { id: 'system-only', label: 'Только системные роли', helper: 'Нет созданных ролей · начало работы' },
  { id: 'working', label: 'Рабочий набор', helper: 'Сотрудник, организатор и администратор продукта' },
  { id: 'many', label: 'Много ролей', helper: '40 ролей · длинные названия и поиск' },
  { id: 'no-results', label: 'Ничего не найдено', helper: 'Пустая выдача поиска' },
  { id: 'read-only', label: 'Только просмотр', helper: 'Нет разрешения на изменение ролей' },
];
export const cardScenarios = [
  { id: 'new', label: 'Новая роль', helper: 'Пустое название и дополнительные разрешения' },
  { id: 'employee', label: 'Обычный сотрудник', helper: 'Базовые возможности и квоты' },
  { id: 'organizer', label: 'Организатор мероприятий', helper: 'Встречи, вебинары и расширенные квоты' },
  { id: 'product-admin', label: 'Администратор продукта', helper: 'Управление встречами и вебинарами' },
  { id: 'system', label: 'Системная роль', helper: 'Защищённые поля · просмотр разрешений' },
  { id: 'attention', label: 'Требует внимания', helper: 'Выбранная квота больше недоступна' },
  { id: 'dirty', label: 'Несохранённые изменения', helper: 'Изменение разрешений и последствия сохранения' },
  { id: 'save-error', label: 'Сохранение не удалось', helper: 'Первое сохранение завершится ошибкой · повтор успешен' },
];
export type RoleDemo = { id: string; label: string; roles: Group[]; card?: string; readOnly?: boolean };
export function exampleRole(id: string, name: string, count = 0): Group {
  const group = hydrateGroup({ id, name, manager: '', count });
  const details = getDetails(group);
  details.synced = false;
  for (const key of Object.keys(details.permissions)) {
    if (typeof details.permissions[key as keyof typeof details.permissions] === 'boolean') Object.assign(details.permissions, { [key]: false });
  }
  details.permissions.communication = 'all'; details.permissions.communicationGroups = [];
  details.products = Object.fromEntries(roleProducts.map(p => [p, false]));
  details.role = { ...roleConfig(group), administrative: false, capabilities: {}, scopes: { manageMeetings: 'own' }, permissionStates: { communication: 'unset' } };
  return group;
}
export function systemRoles(): Group[] {
  return [
    ['owner', 'Владелец организации'], ['administrator', 'Администратор организации'], ['everyone', '@everyone'], ['guest', 'Гость'],
  ].map(([key, name]) => {
    const group = exampleRole('role-system-' + key, name, key === 'owner' ? 1 : key === 'administrator' ? 3 : key === 'everyone' ? 150 : 0);
    group.kind = 'system'; group.systemGroup = key as Group['systemGroup'];
    const d = group.details!, c = d.role!;
    if (key === 'everyone') c.preferences = { ...everyoneSettings };
    if (key === 'owner' || key === 'administrator') {
      c.permissionStates = { communication: 'allow' }; c.administrative = true; d.products = Object.fromEntries(roleProducts.map(p => [p, true]));
      c.adminPermissions = Object.fromEntries(roleAdminRights.map(r => [r.key, true]));
      for (const section of roleSections) for (const r of section.items) { if (r.legacy) d.permissions[r.legacy] = true; else c.capabilities![r.key] = true; if (r.scope) c.scopes![r.key] = 'organization'; }
    } else { d.products['Чаты'] = true; d.permissions.createChats = key === 'everyone'; }
    return group;
  });
}
export function roleExample(id: string): Group {
  if (id === 'system') return systemRoles()[1];
  const group = exampleRole('demo-' + id, id === 'new' ? '' : id === 'employee' ? 'Обычный сотрудник' : id === 'product-admin' ? 'Администратор встреч и вебинаров' : 'Организатор мероприятий', id === 'new' ? 0 : id === 'employee' ? 24 : 12);
  const d = group.details!, c = d.role!;
  if (id === 'new') return group;
  c.permissionStates = { communication: 'allow' };
  d.products = { ...d.products, Чаты: true, Встречи: true, Документы: true, Диск: true };
  d.permissions.createChats = true; d.permissions.upload = true;
  c.capabilities = { createMeetings: true, createDocuments: true, downloadDocuments: true };
  c.meetingQuota = 'meetings-basic'; c.diskQuota = 'disk-basic';
  if (id !== 'employee') {
    d.products['Вебинары'] = true;
    c.capabilities = { ...c.capabilities, createWebinars: true, manageWebinars: true, webinarRegistration: true, webinarReports: true, recordMeetings: true, transcribeMeetings: true };
    c.meetingQuota = 'meetings-organizer'; c.diskQuota = id === 'attention' ? 'disk-archived' : 'disk-organizer';
  }
  if (id === 'product-admin') { c.administrative = true; c.adminPermissions = { manageMeetingsProduct: true }; }
  return group;
}
export function makeRoleDemo(id: string): RoleDemo {
  const card = cardScenarios.find(s => s.id === id), entry = card ?? listScenarios.find(s => s.id === id)!;
  const systems = systemRoles(), custom = ['employee', 'organizer', 'product-admin'].map(roleExample);
  let roles = [...systems.slice(0, 2), ...custom, ...systems.slice(2)];
  if (id === 'system-only') roles = systems;
  if (id === 'many') roles = [...systems.slice(0, 2), ...Array.from({ length: 40 }, (_, i) => { const g = roleExample(i % 3 ? 'employee' : 'organizer'); return { ...g, id: 'many-' + i, name: `${i % 4 ? 'Команда проекта' : 'Организаторы межрегиональных образовательных мероприятий'} ${i + 1}` }; }), ...systems.slice(2)];
  if (card) { const g = roleExample(id); roles = [...roles.filter(r => r.id !== g.id && r.name !== g.name), g]; }
  return { id, label: entry.label, roles, card: card ? id : undefined, readOnly: id === 'read-only' };
}
