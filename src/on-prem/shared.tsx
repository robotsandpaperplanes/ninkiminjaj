import { createContext, useContext, useEffect, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { createPortal } from 'react-dom';
import SectionScenariosMenu from '../SectionScenariosMenu';
import { Alert, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, LinearProgress, MenuItem, Paper, Stack, Step, StepLabel, Stepper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { ReplayOutlined, UploadFileOutlined } from '@mui/icons-material';
import { finishOperation, resultFor, type ChangeRow, type Operation, type Result } from './model';
export const FeatureVisible = createContext(true);

export function useStoredState<T extends { version: number }>(key: string, seed: () => T, restore: (value: T) => T, persist: (value: T) => T = value => value) {
  const [state, setState] = useState<T>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      if (saved?.version === 1) return restore(saved);
    } catch { /* Invalid or unavailable storage falls back to the synthetic seed. */ }
    return seed();
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(persist(state))); } catch { /* The prototype remains usable in memory. */ }
  }, [key, state]);
  return [state, setState] as [T, Dispatch<SetStateAction<T>>];
}

export function useOperationClock<T>(operation: Operation<T> | null, onDone: (operation: Operation<T>) => void) {
  const [now, setNow] = useState(Date.now);
  const complete = useRef(onDone); complete.current = onDone;
  useEffect(() => {
    if (operation?.status !== 'running') return;
    const tick = () => {
      const time = Date.now(); setNow(time);
      const pending = operation.nodes.filter(id => operation.results[id] !== 'success');
      if (time - operation.started > (pending.length + 0.5) * 1000) complete.current(finishOperation(operation));
    };
    const timer = setInterval(tick, 200);
    tick();
    return () => clearInterval(timer);
  }, [operation]);
  return now;
}

export function PageHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'flex-start' }} justifyContent="space-between" gap={2} sx={{ mb: 3 }}><Box sx={{ minWidth: 0 }}><Typography component="h1" variant="h4">{title}</Typography>{subtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 1, overflowWrap: 'anywhere' }}>{subtitle}</Typography>}</Box>{action}</Stack>;
}
export function DemoControls({ scenario, scenarios, disabled, onChange, onReset }: { scenario: string; scenarios: [string, string][]; disabled?: boolean; onChange: (value: string) => void; onReset: () => void }) {
  const [reset, setReset] = useState(false);
  const visible = useContext(FeatureVisible);
  const [portal, setPortal] = useState<HTMLElement | null>(null);
  useEffect(() => { setPortal(document.getElementById('on-prem-scenarios')); }, []);
  return <>
    {visible && portal && createPortal(<SectionScenariosMenu section="Серверное администрирование" active={scenario} entries={scenarios.map(([id, label]) => ({ id, label }))} disabled={disabled} onSelect={onChange} />, portal)}
    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} gap={2} sx={{ mt: 4 }}>
      <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>Демонстрация · Все проверки и изменения имитируются</Typography>
      {!portal && <TextField select label="Сценарий прототипа" value={scenario} disabled={disabled} onChange={event => onChange(event.target.value)} sx={{ minWidth: 230 }}>{scenarios.map(([id, label]) => <MenuItem key={id} value={id}>{label}</MenuItem>)}</TextField>}
      <Button color="inherit" startIcon={<ReplayOutlined />} disabled={disabled} onClick={() => setReset(true)}>Сбросить демоданные</Button>
    </Stack>
    <Dialog open={reset && visible} onClose={() => setReset(false)} aria-labelledby="onprem-reset-title"><DialogTitle id="onprem-reset-title">Сбросить демоданные раздела?</DialogTitle><DialogContent>Восстановятся исходные данные текущего раздела. Остальные разделы сохранятся.</DialogContent><DialogActions><Button onClick={() => setReset(false)}>Отмена</Button><Button color="error" onClick={() => { onReset(); setReset(false); }}>Сбросить</Button></DialogActions></Dialog>
  </>;
}
export type Files = { crt?: string; key?: string; chain?: string };
export function FileField({ label, accept, filename, onFile }: { label: string; accept: string; filename?: string; onFile: (file: File) => void }) {
  return <Paper variant="outlined" sx={{ p: 2, flex: 1, minWidth: 0 }}><Stack gap={1}><Typography variant="subtitle1">{label}</Typography><Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>{filename || accept}</Typography><Button component="label" variant="outlined" startIcon={<UploadFileOutlined />}>{filename ? 'Выбрать другой' : 'Выбрать файл'}<input type="file" hidden aria-label={label} accept={accept} onChange={event => { const file = event.target.files?.[0]; if (file) onFile(file); event.target.value = ''; }} /></Button></Stack></Paper>;
}
export function CertificateFiles({ files, onFile }: { files: Files; onFile: (key: keyof Files, file: File) => void }) {
  return <Stack gap={2} sx={{ my: 2 }}><Stack direction={{ xs: 'column', sm: 'row' }} gap={2}><FileField label="Сертификат" accept=".crt" filename={files.crt} onFile={file => onFile('crt', file)} /><FileField label="Закрытый ключ" accept=".key" filename={files.key} onFile={file => onFile('key', file)} /></Stack><FileField label="Промежуточные сертификаты (необязательно)" accept=".crt,.pem" filename={files.chain} onFile={file => onFile('chain', file)} /><Typography variant="body2" color="text.secondary">Закрытый ключ не отображается в интерфейсе и истории. Содержимое файлов не считывается.</Typography></Stack>;
}
export function fileError(key: keyof Files, file: File) {
  const valid = key === 'key' ? /\.key$/i.test(file.name) : key === 'crt' ? /\.crt$/i.test(file.name) : /\.(crt|pem)$/i.test(file.name);
  return valid ? '' : `Неверный формат файла. ${key === 'key' ? 'Нужен .key.' : key === 'crt' ? 'Нужен .crt.' : 'Нужен .crt или .pem.'}`;
}
export function ChangesTable({ rows }: { rows: ChangeRow[] }) {
  return <TableContainer component={Paper} variant="outlined"><Table aria-label="Изменения: сейчас и после"><TableHead><TableRow><TableCell>Параметр</TableCell><TableCell>Сейчас</TableCell><TableCell>После</TableCell></TableRow></TableHead><TableBody>{rows.map((row, index) => <TableRow key={index}><TableCell sx={{ overflowWrap: 'anywhere' }}>{row.label}</TableCell><TableCell sx={{ overflowWrap: 'anywhere', color: 'text.secondary' }}>{row.before}</TableCell><TableCell sx={{ overflowWrap: 'anywhere', color: row.reduced ? 'warning.main' : undefined }}>{row.after}</TableCell></TableRow>)}</TableBody></Table></TableContainer>;
}
export function Acknowledgement({ checked, onChange, children }: { checked: boolean; onChange: (checked: boolean) => void; children: ReactNode }) {
  return <FormControlLabel sx={{ mt: 2 }} control={<Checkbox checked={checked} onChange={event => onChange(event.target.checked)} />} label={children} />;
}
export function Wizard({ labels, step, children, next, nextLabel, disabled, checking, onBack, onCancel }: { labels: string[]; step: number; children: ReactNode; next: () => void; nextLabel: string; disabled?: boolean; checking?: boolean; onBack: () => void; onCancel: () => void }) {
  const [cancel, setCancel] = useState(false);
  const visible = useContext(FeatureVisible);
  return <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
    <Box sx={{ overflowX: 'auto', mb: 3 }}><Stepper activeStep={step} alternativeLabel sx={{ minWidth: 420 }}>{labels.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}</Stepper></Box>
    <Box aria-live="polite">{children}</Box>
    <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={1} sx={{ mt: 3 }}><Stack direction="row" gap={1}>{step > 0 && <Button disabled={checking} onClick={onBack}>Назад</Button>}<Button color="inherit" disabled={checking} onClick={() => setCancel(true)}>Отмена</Button></Stack><Button variant="contained" disabled={disabled} onClick={next}>{nextLabel}</Button></Stack>
    <Dialog open={cancel && visible} onClose={() => setCancel(false)} aria-labelledby="wizard-cancel-title"><DialogTitle id="wizard-cancel-title">Отменить изменения?</DialogTitle><DialogContent>Изменения ещё не применены. Текущая конфигурация сохранится.</DialogContent><DialogActions><Button onClick={() => setCancel(false)}>Продолжить редактирование</Button><Button color="error" onClick={() => { setCancel(false); onCancel(); }}>Отменить изменения</Button></DialogActions></Dialog>
  </Paper>;
}
const statusLabels: Record<Result | 'partial', string> = { success: 'Применено', error: 'Не применено', unknown: 'Не подтверждено', running: 'Выполняется', wait: 'Ожидает', partial: 'Частично' };
export function Status({ value }: { value: Result | 'partial' }) {
  return <Chip label={statusLabels[value]} color={value === 'success' ? 'success' : value === 'error' ? 'error' : value === 'partial' || value === 'unknown' ? 'warning' : 'default'} variant={value === 'wait' || value === 'running' ? 'outlined' : 'filled'} />;
}
export function OperationResults({ operation, now, describe }: { operation: Operation; now: number; describe?: (id: string) => string }) {
  return <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}><Table aria-label="Результаты операции"><TableHead><TableRow><TableCell>Продукт / узел</TableCell><TableCell>Результат</TableCell></TableRow></TableHead><TableBody>{operation.nodes.map(id => { const status = resultFor(operation, id, now); return <TableRow key={id}><TableCell>{describe?.(id) || id}</TableCell><TableCell><Status value={status} />{status === 'error' && <Typography variant="body2" color="error" sx={{ mt: 1 }}>Узел недоступен. Прежние настройки сохранены.</Typography>}{status === 'unknown' && <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>Связь потеряна после запуска. Требуется проверка фактического состояния.</Typography>}</TableCell></TableRow>; })}</TableBody></Table></TableContainer>;
}
export function OperationView({ operation, now, onBack, onHistory, onRetry, describe }: { operation: Operation; now: number; onBack: () => void; onHistory: () => void; onRetry: (mode: 'retry' | 'reconcile') => void; describe?: (id: string) => string }) {
  const running = operation.status === 'running';
  const successCount = operation.nodes.filter(id => resultFor(operation, id, now) === 'success').length;
  return <>
    <PageHeading title={running ? operation.mode === 'reconcile' ? 'Проверяем фактическое состояние' : 'Применяем изменения' : operation.status === 'success' ? 'Изменения применены' : operation.status === 'unknown' ? 'Результат не подтверждён' : 'Изменения применены частично'} subtitle={`${operation.summary} · ${operation.id} · ${operation.date} МСК`} />
    <Alert severity={running ? 'info' : operation.status === 'success' ? 'success' : 'warning'}>{running ? operation.mode === 'reconcile' ? 'Сверяем фактическую конфигурацию без повторного применения.' : 'Операция продолжится при переходе в другой раздел. Результат будет доступен в истории.' : operation.status === 'unknown' ? 'Не повторяйте изменение вслепую: оно могло уже примениться. Восстановите связь и проверьте состояние.' : operation.status === 'partial' ? 'Успешные изменения сохранены. Повтор затронет только узлы с ошибкой.' : 'Все затронутые узлы подтвердили изменения.'}</Alert>
    {running && <Box sx={{ my: 2 }}><Typography variant="body2">Подтверждено: {successCount} из {operation.nodes.length}</Typography><LinearProgress variant="determinate" value={operation.nodes.length ? successCount / operation.nodes.length * 100 : 0} /></Box>}
    {operation.rows.length > 0 && <Box sx={{ mt: 2 }}><ChangesTable rows={operation.rows} /></Box>}
    <OperationResults operation={operation} now={now} describe={describe} />
    <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 3 }}><Button onClick={onBack}>К текущим настройкам</Button><Button onClick={onHistory}>История операций</Button>{operation.status === 'partial' && <Button variant="contained" onClick={() => onRetry('retry')}>Повторить для узлов с ошибкой</Button>}{operation.status === 'unknown' && <Button variant="contained" onClick={() => onRetry('reconcile')}>Проверить фактическое состояние</Button>}</Stack>
  </>;
}
export function RunningNotice({ operation, onOpen }: { operation: Operation | null; onOpen: () => void }) {
  return operation && operation.status !== 'success' ? <Alert severity={operation.status === 'running' ? 'info' : 'warning'} sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={onOpen}>Открыть</Button>}>{operation.summary} · {operation.status === 'running' ? 'Выполняется' : operation.status === 'unknown' ? 'Результат не подтверждён' : 'Требует внимания'}</Alert> : null;
}
export function HistoryTable({ history, operation, now, onOpen, describe }: { history: Operation[]; operation: Operation | null; now: number; onOpen: () => void; describe?: (id: string) => string }) {
  const [detail, setDetail] = useState<Operation | null>(null);
  const visible = useContext(FeatureVisible);
  const rows = operation?.status === 'running' ? [operation, ...history.filter(item => item.id !== operation.id)] : history;
  return <><TableContainer component={Paper} variant="outlined"><Table aria-label="История операций"><TableHead><TableRow><TableCell>Операция / время, МСК</TableCell><TableCell>Изменения</TableCell><TableCell>Результат</TableCell><TableCell>Действия</TableCell></TableRow></TableHead><TableBody>{rows.map(item => <TableRow key={item.id}><TableCell sx={{ overflowWrap: 'anywhere' }}>{item.id}<Typography variant="body2" color="text.secondary">{item.date}</Typography></TableCell><TableCell>{item.summary}</TableCell><TableCell><Status value={item.status} /></TableCell><TableCell><Button onClick={() => item.id === operation?.id ? onOpen() : setDetail(item)}>Подробнее</Button></TableCell></TableRow>)}{!rows.length && <TableRow><TableCell colSpan={4}>Операций пока нет</TableCell></TableRow>}</TableBody></Table></TableContainer><Dialog open={!!detail && visible} onClose={() => setDetail(null)} fullWidth maxWidth="md" aria-labelledby="operation-detail-title"><DialogTitle id="operation-detail-title">{detail?.summary}</DialogTitle><DialogContent>{detail && <><Typography variant="body2">{detail.date} МСК · {detail.id}</Typography>{detail.rows.length > 0 && <ChangesTable rows={detail.rows} />}<OperationResults operation={detail} now={now} describe={describe} /></>}</DialogContent><DialogActions><Button onClick={() => setDetail(null)}>Закрыть</Button></DialogActions></Dialog></>;
}
export function Checks({ checking, items }: { checking: boolean; items: { title: string; text: string; ok: boolean }[] }) {
  const failed = items.findIndex(item => !item.ok);
  return checking ? <><Typography>Выполняем проверку…</Typography><LinearProgress sx={{ my: 3 }} /></> : <Stack gap={2}><Alert severity={failed < 0 ? 'success' : 'error'}>{failed < 0 ? 'Все проверки пройдены. Можно продолжить.' : 'Применение заблокировано. Исправьте причину и повторите проверку.'}</Alert>{items.map((item, index) => <Paper variant="outlined" sx={{ p: 2 }} key={item.title}><Typography variant="subtitle1">{item.title}</Typography><Typography variant="body2" color={failed >= 0 && index > failed ? 'text.secondary' : item.ok ? 'text.secondary' : 'error'}>{failed >= 0 && index > failed ? 'Не выполнялась из-за предыдущей ошибки.' : item.text}</Typography></Paper>)}</Stack>;
}
