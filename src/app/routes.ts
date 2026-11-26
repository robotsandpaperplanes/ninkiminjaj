export type CloudSection = 'federations' | 'organization' | 'employees' | 'groups' | 'multi-groups' | 'roles' | 'api' | 'security';
export type OnPremSection = 'certificates' | 'license' | 'network';
export type NetworkTab = 'ip' | 'fqdn' | 'history';
export type GroupDefaultsTab = 'permissions' | 'settings' | 'products';
export type AdminRoute =
  | { mode: 'cloud'; section: CloudSection; id?: string; groupTab?: GroupDefaultsTab }
  | { mode: 'on-prem'; section: OnPremSection; tab?: NetworkTab };

export const onPremLabels: Record<OnPremSection, string> = { certificates: 'Сертификаты', license: 'Лицензия', network: 'Сетевые настройки' };
export function storedValue(key: string) {
  try { return localStorage.getItem(key); } catch { return null; }
}
export function defaultCloudRoute(): AdminRoute {
  const section = storedValue('mts-link-admin-active-section');
  const version = storedValue('mts-link-groups-active-version');
  return { mode: 'cloud', section: section === 'federations' || section === 'organization' || section === 'employees' || section === 'api' || section === 'security' ? section : version === '3' ? 'roles' : version === '2' ? 'multi-groups' : 'groups' };
}
export function parseRoute(pathname: string, search = '', hash = ''): AdminRoute | null {
  const parts = pathname.split('/').filter(Boolean);
  if (!parts.length) return hash === '#employees' || hash === '#api' ? { mode: 'cloud', section: hash.slice(1) as 'employees' | 'api' } : defaultCloudRoute();
  if (parts[0] === 'cloud') {
    if (parts.length === 1) return defaultCloudRoute();
    const section = parts[1] as CloudSection;
    if (!['federations', 'organization', 'employees', 'groups', 'multi-groups', 'roles', 'api', 'security'].includes(section)) return null;
    if (parts.length > 3 || (parts.length === 3 && !['groups', 'multi-groups', 'roles'].includes(section))) return null;
    const tab = new URLSearchParams(search).get('tab');
    const groupTab = section === 'multi-groups' && parts[2] && (tab === 'permissions' || tab === 'settings' || tab === 'products') ? tab : undefined;
    try { return { mode: 'cloud', section, ...(parts[2] ? { id: decodeURIComponent(parts[2]) } : {}), ...(groupTab ? { groupTab } : {}) }; } catch { return null; }
  }
  if (parts[0] === 'on-prem') {
    const section = (parts[1] || 'certificates') as OnPremSection;
    if (parts.length > 2 || !Object.hasOwn(onPremLabels, section)) return null;
    const tab = new URLSearchParams(search).get('tab');
    return { mode: 'on-prem', section, ...(section === 'network' ? { tab: tab === 'fqdn' || tab === 'history' ? tab : 'ip' } : {}) };
  }
  return null;
}
export function routePath(route: AdminRoute): string {
  if (route.mode === 'cloud') return '/cloud/' + route.section + (route.id ? '/' + encodeURIComponent(route.id) : '') +
    (route.section === 'multi-groups' && route.id && route.groupTab ? '?tab=' + route.groupTab : '');
  return '/on-prem/' + route.section + (route.section === 'network' && route.tab && route.tab !== 'ip' ? '?tab=' + route.tab : '');
}
export function initialRoute(): AdminRoute {
  if (typeof location === 'undefined') return defaultCloudRoute();
  return parseRoute(location.pathname || '/', location.search || '', location.hash || '') ?? defaultCloudRoute();
}
export function rememberedRoute(mode: AdminRoute['mode']): AdminRoute {
  const saved = storedValue('mts-link-admin-last-' + mode);
  if (saved) {
    const [path, query] = saved.split('?');
    const route = parseRoute(path, query);
    if (route?.mode === mode) return route;
  }
  return mode === 'cloud' ? defaultCloudRoute() : { mode, section: 'certificates' };
}
