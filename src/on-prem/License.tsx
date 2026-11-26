import { useEffect } from 'react';
import { Alert, Box, Button, Checkbox, FormControlLabel, Paper, Stack, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Typography } from '@mui/material';
import { incomingLicense, licenseBaseline, licenseProducts as products, type LicenseValues } from './fixtures';
import { operationDate, operationId, recordOperation, retryOperation, type ChangeRow, type Operation } from './model';
import { Acknowledgement, ChangesTable, Checks, DemoControls, FileField, HistoryTable, OperationView, PageHeading, RunningNotice, useOperationClock, useStoredState, Wizard } from './shared';

type Payload = { next: LicenseValues; file: string };
type State = { version: number; view: 'current' | 'wizard' | 'operation' | 'history'; step: number; scenario: string; file: string; demo: boolean; checked: boolean; checking: boolean; ack: boolean; riskAck: boolean; changesOnly: boolean; error: string; current: LicenseValues; operation: Operation<Payload> | null; history: Operation<Payload>[] };
function seed(): State {
  return { version: 1, view: 'current', step: 0, scenario: 'success', file: '', demo: false, checked: false, checking: false, ack: false, riskAck: false, changesOnly: true, error: '', current: structuredClone(licenseBaseline), operation: null, history: [{ id: 'LIC-0108', date: '01.12.2025, 10:24', started: 0, status: 'success', scenario: 'success', nodes: products.map(product => product.id), results: Object.fromEntries(products.map(product => [product.id, 'success'])), attempt: 1, mode: 'apply', summary: 'Активация лицензии', rows: [], payload: { next: structuredClone(licenseBaseline), file: 'license-2026.lic' } }] };
}
function restore(value: State): State {
  if (!Array.isArray(value.history) || !products.every(product => typeof value.current?.[product.id]?.limit === 'number' && typeof value.current[product.id].until === 'string')) throw new Error('Invalid license state');
  return { ...seed(), ...value, file: value.demo ? 'license-2027.lic' : '', checking: false, checked: !!value.demo && value.checked, step: value.view === 'wizard' && !value.demo ? 0 : value.step, ack: false, riskAck: false, error: '' };
}
export function licenseChanges(current: LicenseValues, next: LicenseValues): ChangeRow[] {
  const rows = products.flatMap(product => [
    { label: `${product.name} · Срок действия`, before: current[product.id].until, after: next[product.id].until },
    { label: `${product.name} · ${product.id === 'meet' ? 'Участников во встрече' : 'Пользователей'}`, before: String(current[product.id].limit), after: String(next[product.id].limit), reduced: next[product.id].limit < current[product.id].limit },
  ]);
  return [...rows,
    { label: 'SIP · Одновременных подключений', before: current.meet.sip ? String(current.meet.sip) : 'Недоступен', after: next.meet.sip ? String(next.meet.sip) : 'Недоступен', reduced: (next.meet.sip || 0) < (current.meet.sip || 0) },
    { label: 'Транскрибация · Часов в месяц', before: current.meet.transcription ? String(current.meet.transcription) : 'Недоступна', after: next.meet.transcription ? String(next.meet.transcription) : 'Недоступна', reduced: (next.meet.transcription || 0) < (current.meet.transcription || 0) },
  ];
}
export default function License({ notify }: { notify: (message: string) => void }) {
  const [s, set] = useStoredState('mts-link-on-prem-license-v1', seed, restore, value => ({ ...value, file: value.demo ? 'license-2027.lic' : '', checking: false, ack: false, riskAck: false }));
  const update = (patch: Partial<State>) => set(previous => ({ ...previous, ...patch }));
  const now = useOperationClock(s.operation, done => set(previous => {
    if (previous.operation?.id !== done.id || previous.operation.status !== 'running') return previous;
    const current = { ...previous.current };
    products.forEach(product => { if (done.results[product.id] === 'success') current[product.id] = { ...done.payload.next[product.id] }; });
    return { ...previous, current, operation: done, history: recordOperation(previous.history, done, 5) };
  }));
  useEffect(() => {
    if (!s.checking) return;
    const timer = setTimeout(() => set(previous => ({ ...previous, checking: false, checked: true })), 650);
    return () => clearTimeout(timer);
  }, [s.checking]);
  const busy = s.operation?.status === 'running';
  const next = incomingLicense(s.scenario);
  const rows = licenseChanges(s.current, next);
  const changes = rows.filter(row => row.before !== row.after);
  const reductions = changes.some(row => row.reduced);
  const blocked = ['invalid', 'other', 'missing'].includes(s.scenario);
  function choose(file: File) { update(/\.lic$/i.test(file.name) ? { file: file.name, demo: false, checked: false, error: '' } : { file: '', demo: false, checked: false, error: 'Выберите файл лицензии с расширением .lic.' }); }
  function start() { update({ view: 'wizard', step: 0, file: '', demo: false, checked: false, checking: false, ack: false, riskAck: false, error: '' }); }
  function launch() {
    if (!s.checked || blocked || !s.ack || (reductions && !s.riskAck)) return;
    const operation: Operation<Payload> = { id: operationId('LIC'), date: operationDate(), started: Date.now(), status: 'running', scenario: s.scenario, nodes: products.map(product => product.id), results: {}, failId: 'platform', attempt: 1, mode: 'apply', summary: 'Замена лицензии', rows: changes, payload: { next: structuredClone(next), file: s.demo ? 'license-2027.lic' : 'Загруженный .lic' } };
    update({ operation, view: 'operation' });
  }
  const describe = (id: string) => { const product = products.find(item => item.id === id); return product ? `${product.name} · ${product.node} · ${product.action}` : id; };
  return <>
    {s.view === 'operation' && s.operation ? <OperationView operation={s.operation} now={now} describe={describe} onBack={() => update({ view: 'current' })} onHistory={() => update({ view: 'history' })} onRetry={mode => update({ operation: retryOperation(s.operation!, mode) })} /> : s.view === 'wizard' ? <>
      <PageHeading title="Замена лицензии" subtitle="Лицензия применяется целиком к инсталляции" />
      <Wizard labels={['Файл', 'Проверка', 'Сравнение', 'Подтверждение', 'Результат']} step={s.step} checking={s.checking} onBack={() => update({ step: s.step - 1, ack: false, riskAck: false })} onCancel={() => update({ view: 'current', file: '', demo: false, checked: false })}
        nextLabel={['Проверить лицензию', 'Сравнить изменения', 'К подтверждению', 'Применить лицензию'][s.step]}
        disabled={s.step === 0 ? !s.file || !!s.error : s.step === 1 ? s.checking || !s.checked || blocked : s.step === 3 ? !s.ack || (reductions && !s.riskAck) || !s.checked || blocked : false}
        next={() => s.step === 0 ? update({ step: 1, checking: true, checked: false }) : s.step === 3 ? launch() : update({ step: s.step + 1, ack: false, riskAck: false })}>
        {s.step === 0 && <Stack gap={2}><Typography variant="h6">Загрузите файл лицензии</Typography><Box onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) choose(file); }}><FileField label="Файл лицензии" accept=".lic" filename={s.file} onFile={choose} /></Box><Typography color="text.secondary" variant="body2">Выберите или перетащите файл .lic. Содержимое, ключи лицензии и JWT не отображаются.</Typography><Button onClick={() => update({ file: 'license-2027.lic', demo: true, error: '', checked: false })}>Использовать демо-файл</Button>{s.error && <Alert severity="error">{s.error}</Alert>}</Stack>}
        {s.step === 1 && <Checks checking={s.checking} items={[
          { title: 'Целостность файла', text: s.scenario === 'invalid' ? 'Файл повреждён или имеет неверный формат. Выберите другой файл .lic.' : 'Файл лицензии корректен.', ok: s.scenario !== 'invalid' },
          { title: 'Соответствие инсталляции', text: s.scenario === 'other' ? 'Лицензия выпущена для другой инсталляции.' : 'Лицензия выпущена для этой инсталляции.', ok: s.scenario !== 'other' },
          { title: 'Состав продуктов', text: s.scenario === 'missing' ? 'В лицензии отсутствует установленный продукт. Применение недоступно.' : 'Лицензия покрывает все установленные продукты.', ok: s.scenario !== 'missing' },
        ]} />}
        {s.step === 2 && <Stack gap={2}><Typography variant="h6">Сравните параметры лицензии</Typography><FormControlLabel control={<Checkbox checked={s.changesOnly} onChange={event => update({ changesOnly: event.target.checked })} />} label="Только изменения" /><ChangesTable rows={s.changesOnly ? changes : rows} />{reductions && <Alert severity="warning">Новая лицензия уменьшает лимиты или отключает дополнительные сервисы. Проверьте влияние на пользователей.</Alert>}{!changes.length && <Alert severity="info">Параметры лицензии не изменятся.</Alert>}</Stack>}
        {s.step === 3 && <Stack gap={2}><Typography variant="h6">Подтвердите замену лицензии</Typography><ChangesTable rows={changes} /><Typography variant="body2">Затронуты: {products.map(product => `${product.name} (${product.node})`).join(', ')}</Typography><Alert severity="warning">Применение лицензии может потребовать перезапуска компонентов и прервать пользовательские сессии.</Alert><Acknowledgement checked={s.ack} onChange={ack => update({ ack })}>Проверил изменения и подтверждаю применение лицензии</Acknowledgement>{reductions && <Acknowledgement checked={s.riskAck} onChange={riskAck => update({ riskAck })}>Понимаю последствия уменьшения лимитов и отключения сервисов</Acknowledgement>}</Stack>}
      </Wizard>
    </> : <>
      <PageHeading title="Лицензия" subtitle="Продукты и дополнительные сервисы инсталляции" action={<Button variant="contained" disabled={busy} onClick={start}>Заменить лицензию</Button>} />
      <RunningNotice operation={s.operation} onOpen={() => update({ view: 'operation' })} />
      <Tabs value={s.view === 'history' ? 1 : 0} onChange={(_, value) => update({ view: value === 1 ? 'history' : 'current' })} aria-label="Раздел лицензии" sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}><Tab label="Текущая лицензия" /><Tab label={`История операций · ${s.history.length}`} /></Tabs>
      {s.view === 'history' ? <HistoryTable history={s.history} operation={s.operation} now={now} onOpen={() => update({ view: 'operation' })} describe={describe} /> : <Stack gap={3}>
        <TableContainer component={Paper} variant="outlined"><Table aria-label="Лицензии продуктов"><TableHead><TableRow><TableCell>Продукт</TableCell><TableCell>Лимит</TableCell><TableCell>Срок действия</TableCell><TableCell>Размещение</TableCell></TableRow></TableHead><TableBody>{products.map(product => <TableRow key={product.id}><TableCell>{product.name}</TableCell><TableCell>{s.current[product.id].limit} {product.id === 'meet' ? 'участников во встрече' : 'пользователей'}</TableCell><TableCell>{s.current[product.id].until}</TableCell><TableCell>{product.node}</TableCell></TableRow>)}</TableBody></Table></TableContainer>
        <Typography variant="h6">Дополнительные сервисы Встреч</Typography><TableContainer component={Paper} variant="outlined"><Table aria-label="Дополнительные сервисы лицензии"><TableHead><TableRow><TableCell>Сервис</TableCell><TableCell>Состояние</TableCell><TableCell>Лимит</TableCell></TableRow></TableHead><TableBody><TableRow><TableCell>SIP</TableCell><TableCell>{s.current.meet.sip ? 'Активен' : 'Недоступен'}</TableCell><TableCell>{s.current.meet.sip || 0} одновременных подключений</TableCell></TableRow><TableRow><TableCell>Транскрибация</TableCell><TableCell>{s.current.meet.transcription ? 'Активна' : 'Недоступна'}</TableCell><TableCell>{s.current.meet.transcription || 0} часов в месяц</TableCell></TableRow></TableBody></Table></TableContainer><Typography variant="body2" color="text.secondary">Ключи лицензии и JWT не отображаются. Все значения демонстрационные.</Typography>
      </Stack>}
    </>}
    <DemoControls scenario={s.scenario} scenarios={['success|Успешная замена', 'invalid|Повреждённый файл', 'other|Другая инсталляция', 'missing|Отсутствует продукт', 'reduce|Уменьшение лимитов', 'partial|Частичное применение'].map(value => value.split('|') as [string, string])} disabled={busy || s.checking} onChange={scenario => update({ scenario, step: 0, checked: false, ack: false, riskAck: false })} onReset={() => { set(seed()); notify('Демоданные лицензии восстановлены'); }} />
  </>;
}
