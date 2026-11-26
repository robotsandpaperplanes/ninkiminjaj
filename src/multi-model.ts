import type { Group } from './data';
import { hydrateGroup } from './group-model';
export type PermissionState = 'deny' | 'unset' | 'allow';
export const systemGroups = {
  owner: { name: 'Владелец организации', color: 'warning', caption: 'Системная · владелец', description: 'Владелец назначается на уровне организации. Его полномочия не ограничиваются обычными группами.' },
  administrator: { name: 'Администратор организации', color: 'secondary', caption: 'Системная · администратор', description: 'Администратор назначается на уровне организации. Ограничения обычных групп на него не действуют.' },
  everyone: { name: '@everyone', color: 'info', caption: 'Системная · по умолчанию', description: 'Разрешения по умолчанию для сотрудников. Используются, если ни одна из их групп не задала значение. На гостей не распространяются.' },
  guest: { name: 'Гость', color: 'default', caption: 'Системная · гость', description: 'Гостевой доступ определяется отдельно. Группы сотрудников и @everyone на гостей не распространяются.' },
} as const;
export function ensureSystemGroups(groups: Group[]): Group[] {
  const system = (type: NonNullable<Group['systemGroup']>) => {
    const existing = groups.find(g => g.systemGroup === type);
    if (existing) return { ...existing, name: systemGroups[type].name };
    const group = hydrateGroup({ id: 'multi-system-' + type, systemGroup: type, kind: 'system', name: systemGroups[type].name, manager: '', count: 0 });
    group.details!.synced = false;
    group.details!.permissions.communication = 'all';
    return group;
  };
  return [system('owner'), system('administrator'), ...groups.filter(g => !g.systemGroup), system('everyone'), system('guest')];
}
export function permissionState(values: Record<string, PermissionState> | undefined, key: string, legacy: boolean): PermissionState {
  // A previously disabled switch did not explicitly prohibit access.
  return values?.[key] ?? (legacy ? 'allow' : 'unset');
}
