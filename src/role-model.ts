import type { Group } from './data';
import type { Permissions } from './group-model';
export type RolePreferences = {
  autoRecord: boolean; autoTranscript: boolean; recordingAccess: 'self' | 'participants' | 'organization';
  camera: boolean; microphone: boolean; desktopSelf: boolean; desktopParticipants: boolean;
  addToCalendar: boolean; meetingsHome: boolean;
};
export const everyoneSettings: RolePreferences = { autoRecord: false, autoTranscript: false, recordingAccess: 'participants', camera: false, microphone: false, desktopSelf: false, desktopParticipants: false, addToCalendar: false, meetingsHome: false };
export type RoleConfig = {
  permissionStates?: Record<string, 'deny' | 'unset' | 'allow'>;
  productStates?: Record<string, 'deny' | 'unset' | 'allow'>;
  adminStates?: Record<string, 'deny' | 'unset' | 'allow'>;
  settingStates?: Record<string, 'deny' | 'unset' | 'allow'>;
  recordingAccessUnset?: boolean;
  capabilities?: Record<string, boolean>;
  scopes?: Record<string, 'own' | 'organization'>;
  preferences?: RolePreferences;
  administrative: boolean;
  adminPermissions: Record<string, boolean>;
  meetingQuota: string;
  diskQuota: string;
  compactInterface: boolean;
  showHints: boolean;
};
export function roleConfig(group: Group): RoleConfig {
  return { administrative: group.kind === 'admin', adminPermissions: {}, meetingQuota: '', diskQuota: '', compactInterface: false, showHints: true, ...group.details?.role };
}
export const quotaCatalog = {
  meetings: [
    { id: 'meetings-basic', name: 'Базовая', detail: 'До 40 участников на мероприятии' },
    { id: 'meetings-organizer', name: 'Организатор', detail: 'До 500 участников на мероприятии' },
  ],
  disk: [
    { id: 'disk-basic', name: 'Базовая', detail: '10 ГБ на пользователя' },
    { id: 'disk-organizer', name: 'Организатор', detail: '100 ГБ на пользователя' },
  ],
};
export type BooleanPermission = Exclude<keyof Permissions, 'communication' | 'communicationGroups'>;
export const viewAllEventsDescription = 'Сотрудники смогут просматривать все мероприятия, созданные другими участниками организации';
export const userRights: { section: string; items: { key: BooleanPermission; label: string; description?: string }[] }[] = [
  { section: 'Доступ и данные организации', items: [
    { key: 'upload', label: 'Возможность загружать файлы с компьютера', description: 'На мероприятиях и в чатах' },
    { key: 'allFiles', label: 'Доступ ко всем файлам организации', description: 'Просмотр' },
    { key: 'allContacts', label: 'Доступ ко всем контактам организации', description: 'Просмотр' },
  ] },
  { section: 'Общение и совместная работа', items: [
    { key: 'inviteGuests', label: 'Приглашение участников-гостей в каналы и чаты', description: 'Добавление участников, не состоящих в организации' },
    { key: 'createChats', label: 'Создание групповых чатов', description: 'Создание чатов и добавление участников' },
    { key: 'createChannels', label: 'Создание каналов', description: 'Новые каналы в организации' },
  ] },
  { section: 'Встречи и мероприятия', items: [
    { key: 'deleteOwnEvents', label: 'Возможность удаления сотрудником своих мероприятий' },
    { key: 'viewAllEvents', label: 'Просмотр всех мероприятий организации' },
    { key: 'editAllEvents', label: 'Редактирование всех мероприятий организации', description: 'Проведение мероприятий других участников организации' },
  ] },
  { section: 'Курсы', items: [{ key: 'createCourses', label: 'Возможность создавать курсы' }] },
];
export const adminRights = [
  { key: 'managePeople', label: 'Управление сотрудниками', description: 'Приглашение сотрудников и управление их учётными записями', destination: 'Сотрудники' },
  { key: 'manageRoles', label: 'Управление ролями и назначениями', description: 'Создание ролей, изменение прав и назначение пользователям', destination: 'Роли' },
  { key: 'manageProducts', label: 'Управление доступом к продуктам', description: 'Включение и отключение продуктов для пользователей', destination: 'Доступ к продуктам' },
  { key: 'manageQuotas', label: 'Управление квотами', description: 'Настройка квот продуктов в пределах ресурсов тарифа', destination: 'Квоты' },
  { key: 'viewAudit', label: 'Просмотр журнала событий', description: 'Действия администраторов и изменения в организации', destination: 'Журнал событий' },
];
