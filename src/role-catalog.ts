import { permissionState, productState, adminState, preferenceState, recordingValue, communicationState, stateLabel, settingLabel } from './role-states';
import type { Group } from './data';
import { getDetails, type Permissions } from './group-model';
import { adminRights, everyoneSettings, quotaCatalog, roleConfig, type BooleanPermission, type RoleConfig } from './role-model';

export const roleProducts = ['Чаты', 'Встречи', 'Вебинары', 'Доски', 'Документы', 'Почта', 'Диск', 'Задачи', 'ИИ-помощник'];
export type RoleRight = { key: string; label: string; description?: string; legacy?: BooleanPermission; scope?: [string, string]; warning?: string };
export const roleSections: { title: string; product?: string; items: RoleRight[] }[] = [
  { title: 'Доступ и данные организации', items: [
    { key: 'upload', legacy: 'upload', label: 'Загружать файлы с компьютера' },
    { key: 'allContacts', legacy: 'allContacts', label: 'Просматривать контакты организации' },
  ] },
  { title: 'Чаты и коммуникация', product: 'Чаты', items: [
    { key: 'createChats', legacy: 'createChats', label: 'Создавать групповые чаты' },
    { key: 'createChannels', legacy: 'createChannels', label: 'Создавать каналы' },
    { key: 'inviteGuests', legacy: 'inviteGuests', label: 'Приглашать гостей в чаты и каналы', warning: 'Сотрудники смогут приглашать внешних участников и открывать им содержимое выбранных чатов и каналов.' },
    { key: 'externalChat', label: 'Общаться с внешними пользователями', description: 'Личные сообщения и звонки за пределами организации' },
  ] },
  { title: 'Встречи', product: 'Встречи', items: [
    { key: 'createMeetings', label: 'Создавать встречи' },
    { key: 'recordMeetings', label: 'Записывать встречи' },
    { key: 'transcribeMeetings', label: 'Использовать расшифровку' },
    { key: 'manageMeetings', legacy: 'editAllEvents', label: 'Управлять встречами', scope: ['Свои встречи', 'Все встречи организации'], warning: 'Область «Все встречи организации» позволяет изменять встречи других сотрудников.' },
    { key: 'viewAllEvents', legacy: 'viewAllEvents', label: 'Просматривать все мероприятия организации' },
    { key: 'deleteOwnEvents', legacy: 'deleteOwnEvents', label: 'Удалять свои мероприятия' },
  ] },
  { title: 'Вебинары', product: 'Вебинары', items: [
    { key: 'createWebinars', label: 'Создавать и проводить вебинары' },
    { key: 'manageWebinars', label: 'Управлять вебинарами', scope: ['Свои вебинары', 'Все вебинары организации'], warning: 'Область «Все вебинары организации» позволяет изменять мероприятия других сотрудников.' },
    { key: 'webinarRegistration', label: 'Управлять регистрацией', scope: ['Свои вебинары', 'Все вебинары организации'] },
    { key: 'webinarReports', label: 'Просматривать отчёты', scope: ['Свои вебинары', 'Все вебинары организации'] },
  ] },
  { title: 'Доски', product: 'Доски', items: [
    { key: 'createBoards', label: 'Создавать доски' },
    { key: 'shareBoards', label: 'Делиться досками вне организации', warning: 'Сотрудники смогут открывать выбранные доски внешним участникам.' },
    { key: 'exportBoards', label: 'Экспортировать доски', description: 'Только доски, к которым у сотрудника есть доступ' },
  ] },
  { title: 'Документы', product: 'Документы', items: [
    { key: 'createDocuments', label: 'Создавать документы' },
    { key: 'publishDocuments', label: 'Публиковать документы по ссылке', warning: 'Документ смогут открыть получатели опубликованной ссылки.' },
    { key: 'shareDocuments', label: 'Делиться документами вне организации', warning: 'Сотрудники смогут выдавать внешним участникам доступ к выбранным документам.' },
    { key: 'downloadDocuments', label: 'Скачивать документы', description: 'Только документы, к которым у сотрудника есть доступ' },
  ] },
  { title: 'Почта', product: 'Почта', items: [
    { key: 'useMail', label: 'Пользоваться почтой' },
    { key: 'externalForward', label: 'Настраивать внешнюю переадресацию', warning: 'Письма могут пересылаться на адреса вне организации.' },
    { key: 'delegateMail', label: 'Выдавать делегированный доступ к своему ящику', description: 'Получатель и объём доступа задаются в почте. Право не открывает чужие ящики автоматически.' },
  ] },
  { title: 'Диск', product: 'Диск', items: [{ key: 'allFiles', legacy: 'allFiles', label: 'Просматривать все файлы организации', warning: 'Расширяет доступ за пределы файлов, которыми поделились с сотрудником.' }] },
  { title: 'Курсы', items: [{ key: 'createCourses', legacy: 'createCourses', label: 'Создавать курсы' }] },
];
export const roleAdminRights = [...adminRights,
  { key: 'manageMeetingsProduct', label: 'Администрировать встречи и вебинары', description: 'Настройки продуктов на уровне организации', destination: 'Встречи и вебинары' },
  { key: 'manageBoardsProduct', label: 'Администрировать доски', description: 'Настройки досок на уровне организации', destination: 'Доски' },
  { key: 'manageDocumentsProduct', label: 'Администрировать документы и диск', description: 'Настройки хранения и совместной работы', destination: 'Документы' },
  { key: 'manageMailProduct', label: 'Администрировать почту', description: 'Домены, ящики и почтовые политики организации', destination: 'Почта' },
  { key: 'manageOrganization', label: 'Управлять настройками организации', description: 'Общие параметры организации', destination: 'Организация' },
];
export function rightEnabled(right: RoleRight, config: RoleConfig, permissions: Permissions): boolean {
  return permissionState(right, config, permissions) === 'allow';
}
export function rightScope(right: RoleRight, config: RoleConfig): 'own' | 'organization' {
  return config.scopes?.[right.key] ?? (right.legacy === 'editAllEvents' ? 'organization' : 'own');
}
export type RoleChange = { label: string; before: string; after: string };
export function roleChanges(saved: Group, next: Group): RoleChange[] {
  const a = getDetails(saved), b = getDetails(next), ac = roleConfig(saved), bc = roleConfig(next);
  const changes: RoleChange[] = [];
  const add = (label: string, before: string, after: string) => { if (before !== after) changes.push({ label, before, after }); };
  const bool = (v: boolean) => v ? 'Разрешено' : 'Не разрешено';
  add('Название роли', saved.name || 'Не задано', next.name || 'Не задано');
  add('Тип роли', ac.administrative ? 'Административная' : 'Пользовательская', bc.administrative ? 'Административная' : 'Пользовательская');
  roleProducts.forEach(p => add('Доступ · ' + p, stateLabel(productState(p, ac, a.products)), stateLabel(productState(p, bc, b.products))));
  for (const section of roleSections) for (const right of section.items) {
    const display = (c: RoleConfig, p: Permissions) => permissionState(right, c, p) !== 'allow' ? stateLabel(permissionState(right, c, p)) : right.scope ? right.scope[rightScope(right, c) === 'own' ? 0 : 1] : 'Разрешено';
    add(right.label, display(ac, a.permissions), display(bc, b.permissions));
  }
  const comm = { all: 'Все сотрудники', groups: 'Выбранные роли', none: 'Запрещено' };
  const communicationDisplay = (c: RoleConfig, p: Permissions) => communicationState(c, p) === 'allow' ? comm[p.communication === 'none' ? 'all' : p.communication] : stateLabel(communicationState(c, p));
  add('Общение с сотрудниками', communicationDisplay(ac, a.permissions), communicationDisplay(bc, b.permissions));
  if (communicationState(bc, b.permissions) === 'allow' && b.permissions.communication === 'groups') add('Роли для общения', [...a.permissions.communicationGroups].sort().join(', ') || 'Не выбраны', [...b.permissions.communicationGroups].sort().join(', ') || 'Не выбраны');
  roleAdminRights.forEach(r => add(r.label, stateLabel(adminState(r.key, ac)), stateLabel(adminState(r.key, bc))));
  for (const [key, label, options] of [['meetingQuota', 'Квота · Встречи', quotaCatalog.meetings], ['diskQuota', 'Квота · Диск', quotaCatalog.disk]] as const) {
    const display = (id: string) => options.find(q => q.id === id)?.name ?? (id ? 'Недоступная квота' : 'Не назначена');
    add(label, display(ac[key]), display(bc[key]));
  }
  const labels = ['Автозапись', 'Авторасшифровка', 'Доступ к записи', 'Камера при подключении', 'Микрофон при подключении', 'Десктопное приложение для себя', 'Десктопное приложение для участников', 'Добавлять в календарь', 'Кабинет встреч'];
  Object.keys(everyoneSettings).forEach((key, i) => {
    const k = key as keyof typeof everyoneSettings;
    const display = (c: RoleConfig) => k !== 'recordingAccess' ? settingLabel(preferenceState(k, c)) : ({ unset: 'Не задано', self: 'Только мне', participants: 'Для участников', organization: 'Всем из организации' }[recordingValue(c)]);
    add(labels[i], display(ac), display(bc));
  });
  return changes;
}
