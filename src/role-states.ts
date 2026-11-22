import type { RoleConfig, RolePreferences } from './role-model';
import type { Permissions } from './group-model';
import type { RoleRight } from './role-catalog';
export type RoleState = 'deny' | 'unset' | 'allow';
export const stateLabel = (state: RoleState) => ({ deny: 'Запрещено', unset: 'Не задано', allow: 'Разрешено' }[state]);
export const settingLabel = (state: RoleState) => ({ deny: 'Выключено', unset: 'Не задано', allow: 'Включено' }[state]);
export function permissionState(right: RoleRight, config: RoleConfig, permissions: Permissions): RoleState {
  return config.permissionStates?.[right.key] ?? ((right.legacy ? permissions[right.legacy] : config.capabilities?.[right.key]) ? 'allow' : 'unset');
}
export function productState(name: string, config: RoleConfig, products: Record<string, boolean>): RoleState {
  return config.productStates?.[name] ?? (products[name] ? 'allow' : 'unset');
}
export function adminState(key: string, config: RoleConfig): RoleState {
  return !config.administrative ? 'unset' : config.adminStates?.[key] ?? (config.adminPermissions[key] ? 'allow' : 'unset');
}
export function preferenceState(key: Exclude<keyof RolePreferences, 'recordingAccess'>, config: RoleConfig): RoleState {
  return config.settingStates?.[key] ?? (config.preferences?.[key] === undefined ? 'unset' : config.preferences[key] ? 'allow' : 'deny');
}
export function recordingValue(config: RoleConfig): RolePreferences['recordingAccess'] | 'unset' {
  return config.recordingAccessUnset ? 'unset' : config.preferences?.recordingAccess ?? 'unset';
}
export function communicationState(config: RoleConfig, permissions: Permissions): RoleState {
  return config.permissionStates?.communication ?? (permissions.communication === 'none' ? 'deny' : 'allow');
}

export function withRecordingAccess(config: RoleConfig, access: RolePreferences['recordingAccess'] | 'unset'): RoleConfig {
  const keys: Exclude<keyof RolePreferences, 'recordingAccess'>[] = ['autoRecord', 'autoTranscript', 'camera', 'microphone', 'desktopSelf', 'desktopParticipants', 'addToCalendar', 'meetingsHome'];
  return { ...config, recordingAccessUnset: access === 'unset', ...(access === 'unset' ? {} : {
    settingStates: Object.fromEntries(keys.map(key => [key, preferenceState(key, config)])),
    preferences: { autoRecord: false, autoTranscript: false, camera: false, microphone: false, desktopSelf: false, desktopParticipants: false, addToCalendar: false, meetingsHome: false, ...config.preferences, recordingAccess: access },
  }) };
}
