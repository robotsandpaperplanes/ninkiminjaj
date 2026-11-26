export const API_STORAGE = 'mts-link-admin-userapi-v1';
export const API_PERMISSION = 'Управление административными интеграциями API';
export const ORGANIZATION = 'Dunder Mifflin Paper Co';
export const CURRENT_ADMIN = { id: 'owner', name: 'Майкл Скотт' };
export type KeyKind = 'secure' | 'legacy';
export type ApiKey = {
  id: string; name: string; kind: KeyKind; enabled: boolean; createdAt: string;
  expiresAt: string | null; createdBy: string | null; creatorName: string | null;
  scopes: string[]; fullAccess: boolean; fingerprint: string; secretHash?: string; legacyValue?: string;
};
export type ApiAdmin = { id: string; name: string; email: string; owner?: boolean; allowed: boolean };
export type AuditChange = { field: string; before: string; after: string };
export type AuditEvent = {
  id: string; at: string; organization: string; integrationId: string | null; integrationName: string | null;
  responsible: string | null; actor: string; source: 'api' | 'cabinet'; category: 'keys' | 'employees' | 'access' | 'chats' | 'security';
  operation: string; target: string; result: 'success' | 'denied'; reason?: string; requestId: string;
  changes: AuditChange[]; httpStatus?: number; code?: string; method?: string; endpoint?: string;
};
export type ApiState = { keys: ApiKey[]; admins: ApiAdmin[]; events: AuditEvent[] };
export const scopeCatalog = [
  { code: 'userapi_organization_read', label: 'Чтение сотрудников', description: 'Список и данные сотрудников организации.', kinds: ['secure', 'legacy'] },
  { code: 'userapi_employees_write', label: 'Создание и изменение сотрудников', description: 'Создание, приглашение, изменение профилей и исключение из организации.', kinds: ['secure'] },
  { code: 'userapi_organization_email', label: 'Доступ к email сотрудников', description: 'Email в новых методах и версиях API. В существующих методах email возвращается как раньше.', kinds: ['secure'] },
  { code: 'userapi_link_chats_read', label: 'Чтение данных чатов', description: 'Обращения интеграции к данным чатов попадают в журнал.', kinds: ['secure', 'legacy'] },
  { code: 'userapi_events', label: 'Работа с мероприятиями', description: 'Существующие методы управления мероприятиями.', kinds: ['secure', 'legacy'] },
  { code: 'userapi_organization', label: 'Управление организацией', description: 'Широкое разрешение текущих ключей.', kinds: ['legacy'] },
  { code: 'userapi_link_chats', label: 'Управление чатами', description: 'Широкое разрешение текущих ключей.', kinds: ['legacy'] },
];
export function availableScopes(kind: KeyKind) { return scopeCatalog.filter(s => s.kinds.includes(kind)); }
export function keyStatus(key: ApiKey, now = Date.now()) {
  if (key.expiresAt && new Date(key.expiresAt).getTime() <= now) return 'expired';
  return key.enabled ? 'active' : 'disabled';
}
export const statusLabels = { active: 'Действует', disabled: 'Отключён', expired: 'Истёк срок' };
export function expiryDate(days: number) { return new Date(Date.now() + days * 86400000).toISOString(); }
export function displayDate(value: string, time = false) {
  return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', ...(time ? { hour: '2-digit', minute: '2-digit', second: '2-digit' } : {}), timeZone: 'Europe/Moscow' }).format(new Date(value));
}
export function auditEvent(data: Omit<AuditEvent, 'id' | 'at' | 'organization' | 'requestId'>, organization = ORGANIZATION): AuditEvent {
  return { ...data, id: crypto.randomUUID(), at: new Date().toISOString(), organization, requestId: crypto.randomUUID() };
}
export async function generateDemoSecret() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const value = 'demo_' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return { value, hash: Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join(''), fingerprint: value.slice(-8) };
}
export function initialApiState(): ApiState {
  const key = (id: string, name: string, extra: Partial<ApiKey> = {}): ApiKey => ({ id, name, kind: 'secure', enabled: true, createdAt: expiryDate(-20), expiresAt: expiryDate(70), createdBy: 'jim', creatorName: 'Джим Хэлперт', scopes: ['userapi_organization_read', 'userapi_employees_write'], fullAccess: false, fingerprint: id.slice(-8), ...extra });
  const keys = [
    key('int-hr-1024', 'Кадровая система'),
    key('int-analytics-2056', 'Аналитика коммуникаций', { creatorName: 'Майкл Скотт', createdBy: 'owner', scopes: ['userapi_link_chats_read'], expiresAt: expiryDate(160) }),
    key('int-albato-0789', 'Albato', { kind: 'legacy', expiresAt: null, createdBy: null, creatorName: null, fullAccess: true, scopes: [], legacyValue: 'demo_legacy_albato_0789' }),
    key('int-test-3048', 'Тестовая интеграция', { enabled: false }),
    key('int-import-4096', 'Разовый импорт', { expiresAt: expiryDate(-2) }),
  ];
  const sample = (data: Partial<AuditEvent>, offset: number): AuditEvent => ({
    ...auditEvent({ source: 'api', category: 'employees', integrationId: keys[0].id, integrationName: keys[0].name, responsible: keys[0].creatorName, actor: keys[0].name, operation: 'Создание сотрудника', target: 'Пэм Бисли · employee-2401', result: 'success', changes: [{ field: 'Статус', before: '—', after: 'Активен' }], httpStatus: 201, method: 'POST', endpoint: '/userapi/organization/members/create' }),
    ...data, at: new Date(Date.now() - offset * 60000).toISOString(),
  });
  return { keys, admins: [
    { ...CURRENT_ADMIN, email: 'm.scott@dundermifflin.example', owner: true, allowed: true },
    { id: 'jim', name: 'Джим Хэлперт', email: 'j.halpert@dundermifflin.example', allowed: true },
    { id: 'dwight', name: 'Дуайт Шрут', email: 'd.schrute@dundermifflin.example', allowed: false },
  ], events: [
    sample({}, 8),
    sample({ operation: 'Изменение сотрудника', result: 'denied', reason: 'Атрибут «Должность» управляется через LDAP.', changes: [], httpStatus: 422, code: 'ATTRIBUTE_MANAGED_EXTERNALLY', method: 'PUT', endpoint: '/userapi/membership/2401' }, 25),
    sample({ category: 'chats', operation: 'Чтение приватного чата', integrationId: keys[1].id, integrationName: keys[1].name, actor: keys[1].name, responsible: keys[1].creatorName, target: 'Планирование квартала · chat-142', changes: [], method: 'GET', endpoint: undefined, httpStatus: 200 }, 42),
    sample({ category: 'keys', source: 'cabinet', operation: 'Создание ключа', actor: 'Джим Хэлперт', target: keys[0].name, changes: [{ field: 'Вид ключа', before: '—', after: 'Новый' }], method: undefined, endpoint: undefined, httpStatus: undefined }, 63),
    sample({ category: 'access', source: 'cabinet', operation: 'Выдача полномочия', integrationId: null, integrationName: null, responsible: null, actor: 'Майкл Скотт', target: 'Джим Хэлперт', changes: [{ field: API_PERMISSION, before: 'Нет', after: 'Есть' }], method: undefined, endpoint: undefined, httpStatus: undefined }, 85),
    sample({ operation: 'Проверка ключа', result: 'denied', integrationId: null, integrationName: null, responsible: null, actor: 'Неизвестная интеграция', target: 'UserAPI', reason: 'Ключ отсутствует, неверен или срок его действия истёк.', changes: [], httpStatus: 401, code: 'UNAUTHORIZED', method: 'GET', endpoint: '/userapi/organization/members_v2' }, 105),
  ] };
}
export function loadApiState(): ApiState {
  try {
    const saved = JSON.parse(localStorage.getItem(API_STORAGE) || 'null');
    if (saved && Array.isArray(saved.keys) && Array.isArray(saved.admins) && Array.isArray(saved.events)
      && saved.keys.every((k: ApiKey) => typeof k.id === 'string' && typeof k.name === 'string' && ['secure', 'legacy'].includes(k.kind) && Array.isArray(k.scopes))
      && saved.events.every((e: AuditEvent) => typeof e.at === 'string' && Array.isArray(e.changes))) return saved;
  } catch { /* Local prototype remains usable without storage. */ }
  return initialApiState();
}

export function keyAudit(key: ApiKey, operation: string, changes: AuditEvent['changes'] = [], organization = ORGANIZATION) {
  return auditEvent({ source: 'cabinet', category: 'keys', integrationId: key.id, integrationName: key.name, responsible: key.creatorName, actor: CURRENT_ADMIN.name, operation, target: key.name, result: 'success', changes }, organization);
}

export function transitionApiKey(state: ApiState, id: string, action: 'enable' | 'disable' | 'rotate' | 'delete', generated: Awaited<ReturnType<typeof generateDemoSecret>> | null = null, days = 90, organization = ORGANIZATION): ApiState {
  const key = state.keys.find(k => k.id === id);
  if (!key) throw new Error('Ключ не найден');
  if (action === 'enable' && keyStatus(key) === 'expired') throw new Error('Срок действия истёк. Сбросьте ключ.');
  if (action === 'rotate' && (!generated || (key.kind === 'secure' && (!Number.isInteger(days) || days < 1 || days > 365)))) throw new Error('Некорректные параметры сброса');
  const expiresAt = key.kind === 'secure' ? expiryDate(days) : null;
  const changes: AuditChange[] = action === 'rotate'
    ? [{ field: 'Значение ключа', before: 'Предыдущее значение', after: 'Заменено; секрет не записывается' }, ...(key.kind === 'secure' ? [{ field: 'Срок действия', before: key.expiresAt ? displayDate(key.expiresAt, true) : '—', after: displayDate(expiresAt!, true) }] : [])]
    : [{ field: 'Статус', before: statusLabels[keyStatus(key)], after: action === 'delete' ? 'Удалён' : action === 'enable' ? 'Действует' : 'Отключён' }];
  const operations = { enable: 'Включение ключа', disable: 'Отключение ключа', rotate: 'Сброс ключа', delete: 'Удаление ключа' };
  return { ...state,
    keys: action === 'delete' ? state.keys.filter(k => k.id !== id) : state.keys.map(k => k.id !== id ? k : action === 'rotate'
      ? { ...k, fingerprint: generated!.fingerprint, ...(k.kind === 'secure' ? { secretHash: generated!.hash, expiresAt } : { legacyValue: generated!.value }) }
      : { ...k, enabled: action === 'enable' }),
    events: [keyAudit(key, operations[action], changes, organization), ...state.events],
  };
}

export function changeAdminAccess(state: ApiState, id: string, allowed: boolean, organization = ORGANIZATION): ApiState {
  const admin = state.admins.find(a => a.id === id);
  if (!admin || admin.owner || admin.allowed === allowed) return state;
  return { ...state, admins: state.admins.map(a => a.id === id ? { ...a, allowed } : a), events: [auditEvent({ source: 'cabinet', category: 'access', integrationId: null, integrationName: null, responsible: null, actor: CURRENT_ADMIN.name, operation: allowed ? 'Выдача полномочия' : 'Отзыв полномочия', target: admin.name, result: 'success', changes: [{ field: API_PERMISSION, before: admin.allowed ? 'Есть' : 'Нет', after: allowed ? 'Есть' : 'Нет' }] }, organization), ...state.events] };
}

