// These fixture sets deliberately retain the separate semantics of the imported prototypes.
export const certificateGroups = [
  { id: 'meet', name: 'Встречи', domains: ['meetings.example.ru', 'media.example.ru'], nodes: [{ id: 'web-01', service: 'Встречи · Web', ip: '10.20.0.11' }, { id: 'media-01', service: 'Встречи · Media', ip: '10.20.0.12' }] },
  { id: 'chat', name: 'Чаты и Платформа', domains: ['chat.example.ru', 'platform.example.ru'], nodes: [{ id: 'gateway-01', service: 'Чаты · Gateway', ip: '10.20.0.21' }, { id: 'gateway-02', service: 'Платформа · Gateway', ip: '10.20.0.22' }] },
  { id: 'boards', name: 'Доски', domains: ['boards.example.ru'], nodes: [{ id: 'boards-01', service: 'Доски · Web', ip: '10.20.0.31' }] },
];
export const licenseProducts = [
  { id: 'meet', name: 'Встречи', node: 'web-01', action: 'Применение лицензии и перезапуск Web' },
  { id: 'chat', name: 'Чаты', node: 'gateway-01', action: 'Применение лицензии и перезапуск Gateway' },
  { id: 'platform', name: 'Платформа', node: 'gateway-02', action: 'Применение лицензии и перезапуск Gateway' },
  { id: 'boards', name: 'Доски', node: 'boards-01', action: 'Применение и проверка лицензии' },
];
export type Entitlement = { limit: number; until: string; sip?: number; transcription?: number };
export type LicenseValues = Record<string, Entitlement>;
export const licenseBaseline: LicenseValues = { meet: { limit: 500, until: '30.11.2026', sip: 50, transcription: 0 }, chat: { limit: 1000, until: '30.11.2026' }, platform: { limit: 1000, until: '30.11.2026' }, boards: { limit: 200, until: '30.11.2026' } };
export function incomingLicense(scenario: string): LicenseValues {
  return { meet: { limit: scenario === 'reduce' ? 300 : 1000, until: '30.11.2027', sip: scenario === 'reduce' ? 0 : 100, transcription: 100 }, chat: { limit: 1500, until: '30.11.2027' }, platform: { limit: 1500, until: '30.11.2027' }, boards: { limit: 200, until: '30.11.2027' } };
}
export const machines = [
  { id: 'web-01', product: 'Встречи', component: 'Web', ip: '10.20.0.11', deps: ['gateway-02', 'boards-01', 'monitor-01'] },
  { id: 'media-01', product: 'Встречи', component: 'Media', ip: '10.20.0.12', deps: ['web-01', 'monitor-01'] },
  { id: 'gateway-01', product: 'Чаты', component: 'Gateway', ip: '10.20.0.21', deps: ['web-01', 'gateway-02', 'monitor-01'] },
  { id: 'gateway-02', product: 'Платформа', component: 'Gateway', ip: '10.20.0.22', deps: ['web-01', 'gateway-01', 'boards-01', 'monitor-01'] },
  { id: 'boards-01', product: 'Доски', component: 'Web', ip: '10.20.0.31', deps: ['web-01', 'monitor-01'] },
  { id: 'monitor-01', product: 'Мониторинг', component: 'Сбор метрик', ip: '10.20.0.41', deps: ['web-01'] },
];
export const networkProducts = [
  { id: 'meet', name: 'Встречи', base: 'meet.example.ru', services: [['media', 'Медиа'], ['msg', 'Сообщения']], nodes: ['web-01', 'media-01'], deps: ['gateway-02'] },
  { id: 'platform', name: 'Чаты и Платформа', base: 'platform.example.ru', services: [['chat', 'Чаты'], ['auth', 'Авторизация']], nodes: ['gateway-01', 'gateway-02'], deps: ['web-01'] },
  { id: 'boards', name: 'Доски', base: 'boards.example.ru', services: [], nodes: ['boards-01'], deps: ['web-01', 'gateway-02'] },
];
export const domainSet = (product: typeof networkProducts[number], base: string) => [{ label: 'Основной FQDN', value: base }, ...product.services.map(([prefix, label]) => ({ label, value: `${prefix}.${base}` }))];
export const baseIPs = Object.fromEntries(machines.map(node => [node.id, node.ip]));
export const baseDomains = Object.fromEntries(networkProducts.map(product => [product.id, product.base]));
export const baseCerts = Object.fromEntries(networkProducts.map(product => [product.id, ['*.example.ru', ...domainSet(product, product.base).slice(1).map(domain => domain.value)]]));
