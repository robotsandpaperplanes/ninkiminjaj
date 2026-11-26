import { userRights, viewAllEventsDescription, type BooleanPermission } from './role-model';

type Right = { label: string; description?: string } & (
  { key: BooleanPermission; legacy: true } | { key: string; legacy?: false }
);
type Block = { title?: string; rights: Right[]; communication?: boolean };
type Section = { title: string; blocks: Block[] };

const legacyRights = Object.fromEntries(userRights.flatMap(section => section.items.map(right => [right.key, right])));
function legacy(...keys: BooleanPermission[]): Right[] {
  return keys.map(key => ({
    ...legacyRights[key],
    key,
    legacy: true,
    description: key === 'viewAllEvents' ? viewAllEventsDescription : legacyRights[key].description,
  }));
}

// Product rights are mock catalog entries, separate from the legacy permission fields.
export const functionalGroupRights: Section[] = [
  { title: 'Доступ к данным организации', blocks: [{ rights: legacy('allFiles', 'allContacts') }] },
  { title: 'Чаты', blocks: [
    { title: 'Участники', communication: true, rights: [
      { key: 'chat.manageMembers', label: 'Управление участниками чатов и каналов' },
      { key: 'chat.createGroupsAndChannels', label: 'Создание групповых чатов и каналов' },
      { key: 'chat.createInviteLinks', label: 'Создание ссылок-приглашений' },
      { key: 'chat.inviteExternal', label: 'Приглашение внешних пользователей' },
      { key: 'chat.startDirectChat', label: 'Начало личного чата' },
      ...legacy('inviteGuests', 'createChats', 'createChannels'),
    ] },
    { title: 'Файлы', rights: [
      { key: 'chat.sendFiles', label: 'Отправка файлов' },
      { key: 'chat.downloadFiles', label: 'Скачивание файлов' },
      { key: 'chat.viewOthersFiles', label: 'Просмотр чужих файлов' },
    ] },
    { title: 'Сообщения', rights: [
      { key: 'chat.recordVoiceMessages', label: 'Запись голосовых сообщений' },
      { key: 'chat.createPolls', label: 'Создание опросов' },
      { key: 'chat.forwardMessages', label: 'Пересылка сообщений' },
      { key: 'chat.copyMessages', label: 'Копирование текста сообщений' },
      { key: 'chat.pinMessages', label: 'Закрепление сообщений' },
    ] },
    { title: 'Звонки', rights: [{ key: 'chat.startCalls', label: 'Запуск звонков' }] },
  ] },
  { title: 'Встречи', blocks: [
    { title: 'Основное', rights: legacy('deleteOwnEvents', 'viewAllEvents', 'editAllEvents') },
    { title: 'Записи и материалы', rights: [
      { key: 'meetings.manageRecording', label: 'Управление записью встречи' },
      { key: 'meetings.accessRecordings', label: 'Доступ к записям встреч' },
      { key: 'meetings.accessTranscripts', label: 'Доступ к расшифровкам и конспектам встреч' },
      { key: 'meetings.manageTranscription', label: 'Управление транскрибацией' },
    ] },
    { title: 'Совместная работа', rights: [
      { key: 'meetings.shareScreen', label: 'Демонстрация экрана' },
      { key: 'meetings.remoteControl', label: 'Удалённое управление экраном' },
      { key: 'meetings.startBoard', label: 'Включение доски' },
    ] },
    { title: 'Чат и участники', rights: [
      { key: 'meetings.sendChatFiles', label: 'Отправка файлов в чат встречи' },
      { key: 'meetings.inviteExternal', label: 'Приглашение внешних участников' },
    ] },
  ] },
  { title: 'Инструменты', blocks: [{ rights: legacy('upload') }] },
  { title: 'Курсы', blocks: [{ rights: legacy('createCourses') }] },
];

export const defaultProductRightStates = Object.fromEntries(
  functionalGroupRights.flatMap(section => section.blocks.flatMap(block => block.rights))
    .filter(right => !right.legacy).map(right => [right.key, 'allow' as const]),
);
