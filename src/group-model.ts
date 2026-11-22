import type { RoleConfig } from './role-model';
import type { Group } from './data';

export type Member = { id: string; name: string; email: string; position: string; source: 'manual' | 'sso'; orgAdmin?: boolean };
export type Permissions = {
  upload: boolean; allFiles: boolean; allContacts: boolean;
  inviteGuests: boolean; createChats: boolean; createChannels: boolean;
  communication: 'all' | 'groups' | 'none'; communicationGroups: string[];
  deleteOwnEvents: boolean; viewAllEvents: boolean; editAllEvents: boolean; createCourses: boolean;
};
export type Settings = { autoRecord: boolean; autoTranscript: boolean; recordingAccess: 'self' | 'participants' | 'link'; camera: boolean; microphone: boolean };
export type GroupDetails = {
  role?: RoleConfig;
  multiPermissions?: Record<string, 'deny' | 'unset' | 'allow'>;
  inviteToken: string; passwordProtected: boolean; invitePassword: string;
  chatTeam: string; boardTeam: string; eventLimit: number; storageLimit: number; storageUsed: number;
  synced: boolean; members: Member[]; products: Record<string, boolean>;
  permissions: Permissions; settings: Settings;
};
export const productLabels = ['Чаты', 'Встречи', 'Задачи', 'Доски', 'Вебинары', 'ИИ-помощник'];
export const people: Member[] = [
  { id: 'obrien', name: 'Эдуард Обрин', email: 'e.obrien@dundermifflinpaper.com', position: 'Админ организации', source: 'sso', orgAdmin: true },
  { id: 'yorke', name: 'Фома Йоркин', email: 't.yorke@dundermifflinpaper.com', position: 'Regional manager', source: 'manual' },
  { id: 'scott', name: 'Михаил Скотт', email: 'm.scott@dundermifflinpaper.com', position: 'Regional manager', source: 'sso' },
  { id: 'maximenko', name: 'Анастасия Максименко', email: 'a.maximenko@dundermifflinpaper.com', position: 'Regional manager', source: 'manual' },
  { id: 'bellamy', name: 'Матвей Белламин', email: 'm.bellamy@dundermifflinpaper.com', position: 'Внешнее управление', source: 'sso' },
  { id: 'shuvalova', name: 'Анастасия Шувалова', email: 'a.shuvalova@dundermifflinpaper.com', position: 'Руководитель отдела', source: 'manual' },
  { id: 'halperin', name: 'Ярослав Халперин', email: 'y.halperin@dundermifflinpaper.com', position: 'Менеджер', source: 'manual' },
  { id: 'pirineev', name: 'Владимир Пиринеев', email: 'v.pirineev@dundermifflinpaper.com', position: 'Разработчик', source: 'sso' },
  { id: 'danchenko', name: 'Эмма Данченко', email: 'e.danchenko@dundermifflinpaper.com', position: 'Офис-менеджер', source: 'manual' },
  { id: 'talyafikin', name: 'Николай Тальяфикин', email: 'n.talyafikin@dundermifflinpaper.com', position: 'Специалист поддержки', source: 'manual' },
];
export const extraPeople: Member[] = [
  { id: 'ivanova', name: 'Анна Иванова', email: 'a.ivanova@example.com', position: 'Маркетолог', source: 'manual' },
  { id: 'petrov', name: 'Алексей Петров', email: 'a.petrov@example.com', position: 'Аналитик', source: 'manual' },
  { id: 'sokolova', name: 'Мария Соколова', email: 'm.sokolova@example.com', position: 'Дизайнер', source: 'manual' },
];
export const defaultSettings: Settings = { autoRecord: false, autoTranscript: false, recordingAccess: 'participants', camera: false, microphone: false };
export const defaultPermissions: Permissions = { upload: true, allFiles: false, allContacts: false, inviteGuests: true, createChats: true, createChannels: true, communication: 'groups', communicationGroups: ['sales', 'research', 'office'], deleteOwnEvents: false, viewAllEvents: true, editAllEvents: true, createCourses: false };

export function newToken() { return globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2); }
export function getDetails(group: Group): GroupDetails {
  if (group.details) return group.details;
  const count = group.id === 'nobs' && group.count === 2 ? 10 : group.count;
  const ordered = [...people];
  const managerIndex = ordered.findIndex(p => p.name === group.manager);
  if (managerIndex >= count && count > 0) [ordered[0], ordered[managerIndex]] = [ordered[managerIndex], ordered[0]];
  const members = Array.from({ length: count }, (_, index) => ordered[index] ? { ...ordered[index] } : ({ id: `${group.id}-member-${index}`, name: `Сотрудник ${index + 1}`, email: `employee.${index + 1}@example.com`, position: 'Специалист', source: 'manual' as const }));
  return {
    inviteToken: `demo-${group.id}-464454644f6771`, passwordProtected: false, invitePassword: '',
    chatTeam: '', boardTeam: '', eventLimit: 40, storageLimit: 10, storageUsed: 6.5,
    synced: group.id === 'nobs', members,
    products: Object.fromEntries(productLabels.map(p => [p, false])),
    permissions: structuredClone(defaultPermissions), settings: { ...defaultSettings },
  };
}
export function hydrateGroup(group: Group): Group {
  const details = getDetails(group);
  return { ...group, count: details.members.length, details };
}
