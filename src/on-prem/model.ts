export type Result = 'success' | 'error' | 'unknown' | 'running' | 'wait';
export type OperationStatus = 'running' | 'success' | 'partial' | 'unknown';
export type ChangeRow = { label: string; before: string; after: string; node?: string; reduced?: boolean };
export type Operation<T = unknown> = {
  id: string; date: string; started: number; status: OperationStatus; scenario: string;
  nodes: string[]; results: Record<string, Result>; failId?: string; attempt: number;
  mode: 'apply' | 'retry' | 'reconcile'; summary: string; rows: ChangeRow[]; payload: T;
};
export function operationId(prefix: string) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
}
export function operationDate() {
  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Moscow' }).format(new Date());
}
export function resultFor(op: Operation, id: string, now: number): Result {
  if (op.results[id] === 'success') return 'success';
  if (op.status !== 'running') return op.results[id] ?? 'unknown';
  const pending = op.nodes.filter(n => op.results[n] !== 'success');
  const index = pending.indexOf(id);
  const elapsed = now - op.started;
  if (elapsed > (index + 1) * 1000) return id === op.failId && op.scenario === 'partial' ? 'error' : id === op.failId && op.scenario === 'lost' ? 'unknown' : 'success';
  return elapsed >= index * 1000 ? 'running' : 'wait';
}
export function finishOperation<T>(op: Operation<T>): Operation<T> {
  const results = Object.fromEntries(op.nodes.map(id => [id, op.results[id] === 'success' ? 'success' : id === op.failId && op.scenario === 'partial' ? 'error' : id === op.failId && op.scenario === 'lost' ? 'unknown' : 'success'])) as Record<string, Result>;
  const status = Object.values(results).includes('unknown') ? 'unknown' : Object.values(results).includes('error') ? 'partial' : 'success';
  return { ...op, results, status };
}
export function retryOperation<T>(op: Operation<T>, mode: 'retry' | 'reconcile'): Operation<T> {
  return { ...op, mode, started: Date.now(), status: 'running', scenario: 'success', attempt: op.attempt + (mode === 'retry' ? 1 : 0), results: Object.fromEntries(Object.entries(op.results).filter(([, result]) => result === 'success')) };
}
export function recordOperation<T>(history: Operation<T>[], op: Operation<T>, limit = Infinity) {
  return [op, ...history.filter(item => item.id !== op.id)].slice(0, limit);
}
export function validIP(value: string) {
  return /^(0|[1-9]\d{0,2})(\.(0|[1-9]\d{0,2})){3}$/.test(value) && value.split('.').every(v => Number(v) <= 255) && Number(value.split('.')[0]) > 0 && Number(value.split('.')[0]) < 224 && Number(value.split('.')[0]) !== 127;
}
export function validDomain(value: string) {
  return value.length <= 253 && value.includes('.') && value.split('.').every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label)) && !/^\d+(\.\d+){3}$/.test(value);
}
export function covers(sans: string[], domain: string) {
  return sans.some(san => san === domain || (san.startsWith('*.') && domain.endsWith('.' + san.slice(2)) && domain.split('.').length === san.slice(2).split('.').length + 1));
}
