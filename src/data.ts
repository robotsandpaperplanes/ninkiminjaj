import type { GroupDetails } from './group-model';
export type Group = { id: string; name: string; description?: string; manager: string; count: number; kind?: 'admin' | 'system'; systemGroup?: 'owner' | 'administrator' | 'everyone' | 'guest'; details?: GroupDetails };
export const initialGroups: Group[] = [
  { id: 'nobs', name: 'Мажоры', manager: 'Анастасия Шувалова', count: 2, kind: 'admin' },
  { id: 'sales', name: 'Продажи & Маркетинг', manager: 'Ярослав Халперин', count: 32 },
  { id: 'research', name: 'R&D', manager: 'Владимир Пиринеев', count: 129 },
  { id: 'office', name: 'Офис', manager: 'Эмма Данченко', count: 45 },
  { id: 'finance', name: 'Финансы', manager: '', count: 24 },
  { id: 'support', name: 'Поддержка', manager: 'Николай Тальяфикин', count: 16 },
  { id: 'education', name: 'Образование', manager: '', count: 0 },
  { id: 'plebs', name: 'Бичи', manager: '', count: 0, kind: 'system' },
];
export const managers = initialGroups.map(g => g.manager).filter(Boolean);
export const organizationName = 'Dunder Mifflin Paper Co';
export const navigation = [
  { label: organizationName, items: ['Организация', 'Сотрудники', 'Группы', 'Федерации'] },
  { label: 'Управление', items: ['Журнал событий', 'Мониторинг', 'Безопасность', 'Интеграции'] },
  { label: 'Счета и платные функции', items: ['Тарифы', 'Брендирование', 'Платные мероприятия', 'Сертификат'] },
  { label: 'Администрирование', items: ['Аналитика', 'Устройства', 'API и вебхуки', 'SSO', 'SIEM', 'DLP'] },
];
export const products = ['Чаты', 'Встречи', 'Задачи', 'Доски', 'Вебинары', 'Помощник'];
