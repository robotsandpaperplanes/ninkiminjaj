import { useEffect, useState } from 'react';
import { Alert, Box, Button, Checkbox, Chip, FormControlLabel, IconButton, Paper, Stack, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Tooltip, Typography } from '@mui/material';
import { InfoOutlined, SwapHorizOutlined } from '@mui/icons-material';
import { certificateGroups as groups } from './fixtures';
import { operationDate, operationId, recordOperation, retryOperation, type Operation } from './model';
import { Acknowledgement, CertificateFiles, ChangesTable, Checks, DemoControls, fileError, HistoryTable, OperationView, PageHeading, RunningNotice, Status, useOperationClock, useStoredState, Wizard, type Files } from './shared';

type Payload = { selected: string[] };
type State = { version: number; view: 'current' | 'wizard' | 'operation' | 'history'; step: number; scenario: string; files: Files; demo: boolean; selected: string[]; checked: boolean; checking: boolean; ack: boolean; error: string; operation: Operation<Payload> | null; history: Operation<Payload>[]; updated: string[] };
const demoFiles: Files = { crt: 'example-ru-2027.crt', key: 'example-ru-2027.key', chain: 'ca-chain.crt' };
function prior(id: string, date: string, selected: string[]): Operation<Payload> {
  const chosen = groups.filter(group => selected.includes(group.id));
  const nodes = chosen.flatMap(group => group.nodes.map(node => node.id));
  return { id, date, started: 0, status: 'success', scenario: 'success', nodes, results: Object.fromEntries(nodes.map(node => [node, 'success'])), attempt: 1, mode: 'apply', summary: `Замена сертификата · ${chosen.map(group => group.name).join(', ')}`, rows: [], payload: { selected } };
}
function seed(): State {
  return { version: 1, view: 'current', step: 0, scenario: 'success', files: {}, demo: false, selected: ['meet', 'chat'], checked: false, checking: false, ack: false, error: '', operation: null, history: [prior('TLS-0247', '04.09.2026, 11:42', ['boards']), prior('TLS-0219', '15.04.2026, 09:18', ['meet', 'chat'])], updated: [] };
}
function restore(value: State): State {
  if (!Array.isArray(value.history) || !Array.isArray(value.updated) || !Array.isArray(value.selected) || !value.selected.every(id => groups.some(group => group.id === id))) throw new Error('Invalid certificate state');
  return { ...seed(), ...value, files: value.demo ? { ...demoFiles } : {}, step: value.view === 'wizard' && !value.demo ? 0 : value.step, checking: false, checked: !!value.demo && value.checked, ack: false, error: '' };
}
export default function Certificates({ notify }: { notify: (message: string) => void }) {
  const [s, set] = useStoredState('mts-link-on-prem-certificates-v1', seed, restore, value => ({ ...value, files: value.demo ? demoFiles : {}, checking: false, ack: false }));
  const [expanded, setExpanded] = useState<string | null>(null);
  const update = (patch: Partial<State>) => set(previous => ({ ...previous, ...patch }));
  const now = useOperationClock(s.operation, done => set(previous => {
    if (previous.operation?.id !== done.id || previous.operation.status !== 'running') return previous;
    return { ...previous, operation: done, history: recordOperation(previous.history, done), updated: [...new Set([...previous.updated, ...done.nodes.filter(id => done.results[id] === 'success')])] };
  }));
  useEffect(() => {
    if (!s.checking) return;
    const timer = setTimeout(() => set(previous => ({ ...previous, checking: false, checked: true })), 750);
    return () => clearTimeout(timer);
  }, [s.checking]);
  const busy = s.operation?.status === 'running';
  const chosen = groups.filter(group => s.selected.includes(group.id));
  const nodes = chosen.flatMap(group => group.nodes);
  const describe = (id: string) => { const node = groups.flatMap(group => group.nodes).find(item => item.id === id); return node ? `${id} · ${node.service} · ${node.ip}` : id; };
  function start(selected = ['meet', 'chat']) { update({ view: 'wizard', step: 0, files: {}, demo: false, selected, checked: false, checking: false, ack: false, error: '' }); }
  function selectFile(key: keyof Files, file: File) {
    const error = fileError(key, file);
    update(error ? { error } : { files: { ...s.files, [key]: file.name }, demo: false, error: '', checked: false });
  }
  function launch() {
    if (!s.checked || !s.ack || !nodes.length || s.scenario === 'key' || s.scenario === 'coverage') return;
    const op: Operation<Payload> = { id: operationId('TLS'), date: operationDate(), started: Date.now(), status: 'running', scenario: s.scenario, nodes: nodes.map(node => node.id), results: {}, failId: nodes.at(-1)?.id, attempt: 1, mode: 'apply', summary: 'Замена сертификата · ' + chosen.map(group => group.name).join(', '), rows: [{ label: 'Сертификат', before: s.selected.length === 1 && s.selected[0] === 'boards' ? 'boards.example.ru' : '*.example.ru', after: '*.example.ru · до 12.10.2027' }], payload: { selected: [...s.selected] } };
    update({ operation: op, view: 'operation' });
  }
  const coreNodes = groups.slice(0, 2).flatMap(group => group.nodes);
  const allCore = coreNodes.every(node => s.updated.includes(node.id));
  const someCore = coreNodes.some(node => s.updated.includes(node.id));
  return <>
    {s.view === 'operation' && s.operation ? <OperationView operation={s.operation} now={now} describe={describe} onBack={() => update({ view: 'current' })} onHistory={() => update({ view: 'history' })} onRetry={mode => update({ operation: retryOperation(s.operation!, mode) })} /> : s.view === 'wizard' ? <>
      <PageHeading title="Замена сертификата" subtitle="Изменения ещё не применены" />
      <Wizard labels={['Файлы', 'Проверка', 'Область', 'Подтверждение', 'Результат']} step={s.step} checking={s.checking} onBack={() => update({ step: s.step - 1, ack: false, ...(s.step === 1 ? { checked: false } : {}) })} onCancel={() => update({ view: 'current', files: {}, demo: false, checked: false })}
        nextLabel={['Проверить комплект', 'Выбрать область', 'Проверить и подтвердить', 'Применить сертификат'][s.step]}
        disabled={s.step === 0 ? !s.files.crt || !s.files.key || !!s.error : s.step === 1 ? s.checking || !s.checked || s.scenario === 'key' : s.step === 2 ? !nodes.length || s.scenario === 'coverage' : !s.ack || !s.checked}
        next={() => s.step === 0 ? update({ step: 1, checking: true, checked: false }) : s.step === 3 ? launch() : update({ step: s.step + 1, ack: false })}>
        {s.step === 0 && <><Typography variant="h6">Загрузите новый комплект</Typography><Typography color="text.secondary" variant="body2">Сертификат и закрытый ключ обязательны. Промежуточная цепочка — по необходимости.</Typography><CertificateFiles files={s.files} onFile={selectFile} /><Button onClick={() => update({ files: { ...demoFiles }, demo: true, error: '', checked: false })}>Использовать демо-комплект</Button>{s.error && <Alert severity="error" sx={{ mt: 2 }}>{s.error}</Alert>}</>}
        {s.step === 1 && <><Checks checking={s.checking} items={[
          { title: 'Формат файлов', text: 'Сертификат X.509, закрытый ключ PEM', ok: true },
          { title: 'Соответствие закрытого ключа', text: s.scenario === 'key' ? 'Ключ не соответствует сертификату. Выберите ключ из того же комплекта.' : 'Сертификат и закрытый ключ соответствуют друг другу.', ok: s.scenario !== 'key' },
          { title: 'Срок действия', text: '12.10.2026 — 12.10.2027 · сертификат действителен', ok: true },
          { title: 'Цепочка доверия', text: 'Промежуточный и корневой сертификаты найдены.', ok: true },
        ]} />{!s.checking && <Typography variant="body2" sx={{ mt: 2 }}>Выдан для: {s.scenario === 'coverage' ? 'another.example.ru' : '*.example.ru'} · Издатель: Корпоративный УЦ</Typography>}</>}
        {s.step === 2 && <Stack gap={2}><Typography variant="h6">Где применить сертификат</Typography>{groups.map(group => <Paper key={group.id} variant="outlined" sx={{ p: 2 }}><FormControlLabel control={<Checkbox checked={s.selected.includes(group.id)} onChange={() => update({ selected: s.selected.includes(group.id) ? s.selected.filter(id => id !== group.id) : [...s.selected, group.id], ack: false })} />} label={group.name} /><Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{group.domains.join(' · ')}</Typography><Typography variant="body2" color="text.secondary">Узлы: {group.nodes.map(node => node.id).join(', ')}</Typography>{group.id === 'chat' && <Typography variant="body2" color="text.secondary">Чаты и Платформа используют связанные точки подключения и обновляются вместе.</Typography>}</Paper>)}{s.scenario === 'coverage' && !!nodes.length && <Alert severity="error">Сертификат не покрывает FQDN выбранных продуктов. Загрузите подходящий комплект или измените область применения.</Alert>}<Typography>Будут затронуты: {nodes.length} узлов · {chosen.flatMap(group => group.domains).length} FQDN</Typography></Stack>}
        {s.step === 3 && <Stack gap={2}><Typography variant="h6">Подтвердите замену</Typography><ChangesTable rows={[{ label: 'Сертификат', before: s.selected.length === 1 && s.selected[0] === 'boards' ? 'boards.example.ru · до 04.09.2027' : '*.example.ru · до 30.10.2026', after: '*.example.ru · до 12.10.2027' }]} /><Typography>Продукты: {chosen.map(group => group.name).join(', ')}</Typography><Typography sx={{ overflowWrap: 'anywhere' }}>FQDN: {chosen.flatMap(group => group.domains).join(', ')}</Typography><Typography>Узлы: {nodes.map(node => node.id).join(', ')}</Typography><Alert severity="success">Комплект проверен. Все выбранные FQDN покрыты сертификатом.</Alert><Alert severity="warning">Потребуется перезапуск компонентов. Встречи и пользовательские сессии могут прерваться. Выполняйте замену в согласованное окно обслуживания.</Alert><Acknowledgement checked={s.ack} onChange={ack => update({ ack })}>Понимаю влияние на работу продуктов и подтверждаю замену</Acknowledgement></Stack>}
      </Wizard>
    </> : <>
      <PageHeading title="Сертификаты" subtitle="TLS-сертификаты продуктов и точек подключения" action={<Button variant="contained" disabled={busy} onClick={() => start()}>Заменить сертификат</Button>} />
      <RunningNotice operation={s.operation} onOpen={() => update({ view: 'operation' })} />
      <Tabs value={s.view === 'history' ? 1 : 0} onChange={(_, value) => update({ view: value === 1 ? 'history' : 'current' })} aria-label="Раздел сертификатов" sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}><Tab label="Текущие сертификаты" /><Tab label={`История операций · ${s.history.length}`} /></Tabs>
      {s.view === 'history' ? <HistoryTable history={s.history} operation={s.operation} now={now} onOpen={() => update({ view: 'operation' })} describe={describe} /> : <>
        {!allCore && <Alert severity="warning" sx={{ mb: 2 }}>{someCore ? 'Сертификат обновлён не на всех узлах. Проверьте результат операции.' : 'Срок действия сертификата скоро истечёт. Сертификат *.example.ru действует до 30 октября 2026.'}</Alert>}
        <TableContainer component={Paper} variant="outlined"><Table aria-label="Текущие сертификаты" sx={{ minWidth: 600 }}><TableHead><TableRow><TableCell>Сертификат / FQDN</TableCell><TableCell>Используется</TableCell><TableCell>Срок и состояние</TableCell><TableCell>Действия</TableCell></TableRow></TableHead><TableBody>{[{ id: 'core', selected: ['meet', 'chat'], name: '*.example.ru' }, { id: 'boards', selected: ['boards'], name: s.updated.includes('boards-01') ? '*.example.ru' : 'boards.example.ru' }].map(item => {
          const associated = groups.filter(group => item.selected.includes(group.id));
          const associatedNodes = associated.flatMap(group => group.nodes);
          const complete = associatedNodes.every(node => s.updated.includes(node.id));
          return <TableRow key={item.id}><TableCell><Typography>{item.name}</Typography><Typography color="text.secondary" variant="body2" sx={{ overflowWrap: 'anywhere' }}>{associated.flatMap(group => group.domains).join(', ')}</Typography>{expanded === item.id && <Box sx={{ mt: 2 }}><Typography variant="subtitle1">Сведения о сертификате</Typography><Typography variant="body2">Издатель: Корпоративный УЦ</Typography>{associatedNodes.map(node => <Typography key={node.id} variant="body2" sx={{ mt: 1 }}>{describe(node.id)} · до {s.updated.includes(node.id) ? '12.10.2027' : item.id === 'core' ? '30.10.2026' : '04.09.2027'}</Typography>)}</Box>}</TableCell><TableCell>{associated.map(group => group.name).join(', ')}<Typography variant="body2" color="text.secondary">{associatedNodes.length} узлов</Typography></TableCell><TableCell>{complete ? '12.10.2027' : item.id === 'core' ? someCore ? 'Различается по узлам' : '30.10.2026' : '04.09.2027'}<Box sx={{ mt: 1 }}><Chip label={complete || item.id === 'boards' ? 'Действует' : someCore ? 'Требует внимания' : 'Скоро истекает'} color={complete || item.id === 'boards' ? 'success' : 'warning'} /></Box></TableCell><TableCell><Tooltip title="Подробнее"><IconButton aria-label={`Подробнее: ${associated.map(group => group.name).join(', ')}`} aria-expanded={expanded === item.id} onClick={() => setExpanded(expanded === item.id ? null : item.id)}><InfoOutlined /></IconButton></Tooltip><Tooltip title="Заменить"><span><IconButton color="primary" disabled={busy} aria-label={`Заменить: ${associated.map(group => group.name).join(', ')}`} onClick={() => start(item.selected)}><SwapHorizOutlined /></IconButton></span></Tooltip></TableCell></TableRow>;
        })}</TableBody></Table></TableContainer>
      </>}
    </>}
    <DemoControls scenario={s.scenario} scenarios={['success|Успешная замена', 'key|Ключ не соответствует', 'coverage|FQDN не покрыты', 'partial|Ошибка на одном узле'].map(value => value.split('|') as [string, string])} disabled={busy || s.checking} onChange={scenario => update({ scenario, step: 0, checked: false, ack: false })} onReset={() => { set(seed()); setExpanded(null); notify('Демоданные сертификатов восстановлены'); }} />
  </>;
}
