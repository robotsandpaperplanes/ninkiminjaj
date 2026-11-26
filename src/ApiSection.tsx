import { Dialog, Menu, TextField } from './app/ModeVisibility';
import { OrganizationIdentity } from './app/OrganizationIdentity';
import { useContext, useState, type Dispatch, type SetStateAction } from 'react';
import {
  Alert, Avatar, Box, Button, Checkbox, Chip, DialogActions, DialogContent,
  DialogTitle, Divider, Drawer, FormControlLabel, IconButton, InputAdornment, MenuItem,
  Paper, Radio, Stack, Switch, Tab, Table, TableBody, TableCell, TableContainer, TableHead,
  TablePagination, TableRow, Tabs, Tooltip, Typography,
} from '@mui/material';
import { AddOutlined, CloseOutlined, ContentCopyOutlined, DownloadOutlined, KeyOutlined, MoreHorizOutlined, SearchOutlined, ShieldOutlined } from '@mui/icons-material';
import {
  API_PERMISSION, CURRENT_ADMIN, ORGANIZATION, availableScopes, displayDate,
  expiryDate, generateDemoSecret, keyStatus, statusLabels, keyAudit, transitionApiKey, changeAdminAccess,
  type ApiKey, type ApiState, type AuditEvent, type KeyKind,
} from './api-model';

type Props = { state: ApiState; setState: Dispatch<SetStateAction<ApiState>>; notify: (text: string) => void; query: string; setQuery: (value: string) => void };
type Draft = { id?: string; name: string; kind: KeyKind; days: string; fullAccess: boolean; scopes: string[] };
type KeyAction = { key: ApiKey; action: 'enable' | 'disable' | 'rotate' | 'delete' };
const actions = { enable: 'Включить', disable: 'Отключить', rotate: 'Сбросить', delete: 'Удалить' };
const categories = { keys: 'Ключи API', employees: 'Сотрудники', access: 'Полномочия', chats: 'Чаты', security: 'Безопасность' };
const blankDraft = (): Draft => ({ name: '', kind: 'secure', days: '90', fullAccess: false, scopes: [] });
function Status({ item }: { item: ApiKey }) {
  const status = keyStatus(item);
  return <Chip size="small" variant="outlined" label={statusLabels[status]} color={status === 'active' ? 'success' : status === 'expired' ? 'warning' : 'default'} />;
}
function Field({ label, value }: { label: string; value: string }) {
  return <Box><Typography variant="body2" color="text.secondary" sx={{ mb: .5 }}>{label}</Typography><Typography sx={{ overflowWrap: 'anywhere' }}>{value}</Typography></Box>;
}

export default function ApiSection({ state, setState, notify, query, setQuery }: Props) {
  const organizationName = useContext(OrganizationIdentity);
  const [tab, setTab] = useState(0);
  const [status, setStatus] = useState('all');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState<{ anchor: HTMLElement; key: ApiKey } | null>(null);
  const [confirm, setConfirm] = useState<KeyAction | null>(null);
  const [rotateDays, setRotateDays] = useState('90');
  const [secret, setSecret] = useState<{ name: string; value: string; secure: boolean } | null>(null);
  const [secretSaved, setSecretSaved] = useState(false);
  const [accessConfirm, setAccessConfirm] = useState<string | null>(null);
  const [event, setEvent] = useState<AuditEvent | null>(null);
  const [category, setCategory] = useState('all');
  const [result, setResult] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(0);
  const currentKey = draft?.id ? state.keys.find(k => k.id === draft.id) : undefined;
  const normalizedQuery = query.trim().toLocaleLowerCase('ru');
  const filteredKeys = state.keys.filter(k => (status === 'all' || keyStatus(k) === status) && [k.name, k.id, k.creatorName ?? ''].join(' ').toLocaleLowerCase('ru').includes(normalizedQuery));
  const dateError = !!from && !!to && from > to;
  const filteredEvents = state.events.filter(e => {
    const date = new Date(new Date(e.at).getTime() + 3 * 3600000).toISOString().slice(0, 10);
    return !dateError && (category === 'all' || e.category === category) && (result === 'all' || e.result === result)
      && (!from || date >= from) && (!to || date <= to)
      && [e.operation, e.target, e.actor, e.integrationName, e.integrationId, e.responsible, e.requestId, e.reason].join(' ').toLocaleLowerCase('ru').includes(normalizedQuery);
  });
  const safePage = Math.min(page, Math.max(0, Math.ceil(filteredEvents.length / 10) - 1));
  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); notify('Скопировано'); }
    catch { notify('Не удалось скопировать. Выделите и скопируйте значение вручную.'); }
  }
  function openDraft(key?: ApiKey) {
    setError(''); setMenu(null);
    setDraft(key ? { id: key.id, name: key.name, kind: key.kind, days: '90', fullAccess: key.fullAccess, scopes: [...key.scopes] } : blankDraft());
  }
  function validateDays(value: string) { return /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 365; }
  async function saveKey() {
    if (!draft || busy) return;
    if (!draft.name.trim()) { setError('Укажите название интеграции.'); return; }
    if (draft.kind === 'secure' && !draft.id && !validateDays(draft.days)) { setError('Срок действия — целое число от 1 до 365 дней.'); return; }
    if (!draft.fullAccess && !draft.scopes.length) { setError('Выберите хотя бы одно разрешение.'); return; }
    setBusy(true); setError('');
    try {
      const generated = draft.id ? null : await generateDemoSecret();
      const next: ApiKey = currentKey ? { ...currentKey, name: draft.name.trim(), scopes: draft.fullAccess ? [] : draft.scopes, fullAccess: draft.fullAccess }
        : { id: 'int-' + crypto.randomUUID(), name: draft.name.trim(), kind: draft.kind, enabled: true, createdAt: new Date().toISOString(), expiresAt: draft.kind === 'secure' ? expiryDate(Number(draft.days)) : null, createdBy: CURRENT_ADMIN.id, creatorName: CURRENT_ADMIN.name, fullAccess: draft.fullAccess, scopes: draft.fullAccess ? [] : draft.scopes, fingerprint: generated!.fingerprint, ...(draft.kind === 'secure' ? { secretHash: generated!.hash } : { legacyValue: generated!.value }) };
      const changes: AuditEvent['changes'] = currentKey ? [
        ...(currentKey.name !== next.name ? [{ field: 'Название интеграции', before: currentKey.name, after: next.name }] : []),
        ...(JSON.stringify([currentKey.fullAccess, [...currentKey.scopes].sort()]) !== JSON.stringify([next.fullAccess, [...next.scopes].sort()]) ? [{ field: 'Разрешения', before: currentKey.fullAccess ? 'Все текущие разрешения' : currentKey.scopes.join(', '), after: next.fullAccess ? 'Все текущие разрешения' : next.scopes.join(', ') }] : []),
      ] : [{ field: 'Вид ключа', before: '—', after: next.kind === 'secure' ? 'Новый' : 'Текущий (устаревший)' }, { field: 'Разрешения', before: '—', after: next.fullAccess ? 'Все текущие разрешения' : next.scopes.join(', ') }, { field: 'Срок действия', before: '—', after: next.expiresAt ? displayDate(next.expiresAt, true) : 'Без ограничения' }];
      if (currentKey && !changes.length) { setDraft(null); return; }
      setState(previous => ({ ...previous, keys: currentKey ? previous.keys.map(k => k.id === next.id ? next : k) : [next, ...previous.keys], events: [keyAudit(next, currentKey ? 'Изменение настроек ключа' : 'Создание ключа', changes, organizationName), ...previous.events] }));
      setDraft(null);
      if (generated) { setSecretSaved(false); setSecret({ name: next.name, value: generated.value, secure: next.kind === 'secure' }); }
      else notify('Настройки ключа сохранены');
    } catch { setError('Не удалось создать ключ. Повторите попытку.'); }
    finally { setBusy(false); }
  }
  async function applyKeyAction() {
    if (!confirm || busy) return;
    const { key, action } = confirm;
    if (action === 'rotate' && key.kind === 'secure' && !validateDays(rotateDays)) { setError('Срок действия — целое число от 1 до 365 дней.'); return; }
    setBusy(true); setError('');
    try {
      const generated = action === 'rotate' ? await generateDemoSecret() : null;
      const next = transitionApiKey(state, key.id, action, generated, Number(rotateDays), organizationName);
      setState(next);
      setConfirm(null);
      if (generated) { setSecretSaved(false); setSecret({ name: key.name, value: generated.value, secure: key.kind === 'secure' }); }
      else notify(action === 'delete' ? 'Ключ удалён' : action === 'enable' ? 'Ключ включён' : 'Ключ отключён');
    } catch { setError('Не удалось выполнить действие. Повторите попытку.'); }
    finally { setBusy(false); }
  }
  function toggleAccess(id: string) {
    const admin = state.admins.find(a => a.id === id);
    if (!admin || admin.owner) return;
    const allowed = !admin.allowed;
    setState(previous => changeAdminAccess(previous, id, allowed, organizationName));
    setAccessConfirm(null); notify(allowed ? 'Полномочие выдано' : 'Полномочие отозвано. Ключи администратора продолжают работать.');
  }
  function exportJournal() {
    const rows = [['Дата и время (МСК)', 'Организация', 'Интеграция', 'ID интеграции', 'Автор', 'Ответственный', 'Операция', 'Объект', 'Результат', 'Причина', 'Request ID', 'Изменения'], ...filteredEvents.map(e => [displayDate(e.at, true), e.organization, e.integrationName ?? '', e.integrationId ?? '', e.actor, e.responsible ?? '', e.operation, e.target, e.result === 'success' ? 'Успешно' : 'Отказ', e.reason ?? '', e.requestId, e.changes.map(c => `${c.field}: ${c.before} → ${c.after}`).join('; ')])];
    const csv = '\ufeff' + rows.map(row => row.map(v => '"' + (/^[=+\-@\t\r]/.test(v) ? "'" : '') + v.replaceAll('"', '""') + '"').join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a'); link.href = url; link.download = 'userapi-journal.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify('Журнал выгружен с учётом фильтров');
  }

  return <Box sx={{ '& .MuiTypography-body2': { fontSize: 14 }, '& .MuiChip-root': { fontSize: 12 }, '& .MuiTableCell-head': { fontSize: 14 } }}>
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2} sx={{ mb: 3 }}>
      <Box><Typography variant="h4" component="h1">API и вебхуки</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>Подключайте интеграции и управляйте их доступом к данным организации.</Typography></Box>
      <Chip variant="outlined" label="Прототип" sx={{ mt: .5 }} />
    </Stack>
    <Tabs value={tab} onChange={(_, value) => { setTab(value); setQuery(''); setPage(0); }} aria-label="API и вебхуки" sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      <Tab label="Ключи API" id="api-tab-0" aria-controls="api-panel-0" /><Tab label="Журнал" id="api-tab-1" aria-controls="api-panel-1" /><Tab label="Доступ" id="api-tab-2" aria-controls="api-panel-2" />
    </Tabs>
    <Box role="tabpanel" id={`api-panel-${tab}`} aria-labelledby={`api-tab-${tab}`}>
    {tab === 0 && <>
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} justifyContent="space-between" sx={{ mb: 2.5 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} sx={{ flex: 1 }}>
          <TextField placeholder="Название, ID или ответственный" value={query} onChange={e => setQuery(e.target.value)} inputProps={{ 'aria-label': 'Поиск ключей' }} sx={{ width: { sm: 340 } }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment> }} />
          <TextField select value={status} onChange={e => setStatus(e.target.value)} inputProps={{ 'aria-label': 'Статус ключа' }} sx={{ minWidth: 175 }}><MenuItem value="all">Все статусы</MenuItem>{Object.entries(statusLabels).map(([value, label]) => <MenuItem value={value} key={value}>{label}</MenuItem>)}</TextField>
        </Stack>
        <Button startIcon={<AddOutlined />} variant="contained" onClick={() => openDraft()}>Создать ключ</Button>
      </Stack>
      <TableContainer component={Paper} variant="outlined"><Table aria-label="Ключи API" sx={{ minWidth: 820 }}><TableHead><TableRow><TableCell>Интеграция</TableCell><TableCell>Статус</TableCell><TableCell>Действует до</TableCell><TableCell>Ответственный</TableCell><TableCell align="right">Действия</TableCell></TableRow></TableHead>
        <TableBody>{filteredKeys.map(k => <TableRow key={k.id} hover>
          <TableCell sx={{ py: 2 }}><Stack direction="row" gap={1.5} alignItems="center"><Avatar variant="rounded" sx={{ bgcolor: 'action.hover', color: 'text.secondary', width: 36, height: 36 }}><KeyOutlined fontSize="small" /></Avatar><Box><Button onClick={() => openDraft(k)} sx={{ p: 0, minHeight: 0, justifyContent: 'flex-start', textAlign: 'left', fontSize: 16 }}>{k.name}</Button><Stack direction="row" alignItems="center" gap={1} sx={{ mt: .5 }}><Typography variant="body2" color="text.secondary">•••• {k.fingerprint}</Typography>{k.kind === 'legacy' && <Chip size="small" color="warning" variant="outlined" label="Устаревший" />}</Stack></Box></Stack></TableCell>
          <TableCell><Status item={k} /></TableCell><TableCell sx={{ whiteSpace: 'nowrap' }}>{k.expiresAt ? displayDate(k.expiresAt) : 'Без ограничения'}</TableCell><TableCell>{k.creatorName ?? <Typography variant="body2" color="text.secondary">Неизвестен</Typography>}</TableCell>
          <TableCell align="right"><Tooltip title="Действия с ключом"><IconButton aria-label={`Действия: ${k.name}`} aria-haspopup="menu" onClick={e => setMenu({ anchor: e.currentTarget, key: k })}><MoreHorizOutlined /></IconButton></Tooltip></TableCell>
        </TableRow>)}{!filteredKeys.length && <TableRow><TableCell colSpan={5} sx={{ py: 6, textAlign: 'center' }}><Typography>Ключи не найдены</Typography><Button onClick={() => { setQuery(''); setStatus('all'); }}>Сбросить фильтры</Button></TableCell></TableRow>}</TableBody>
      </Table></TableContainer>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Значение нового ключа доступно только при создании или сбросе. Действия с ключами записываются в журнал.</Typography>
    </>}
    {tab === 1 && <>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2} sx={{ mb: 2.5 }}><Box><Typography variant="h6">Журнал административных действий</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .75 }}>Операции интеграций, изменения ключей и полномочий. Время московское.</Typography></Box><Button variant="outlined" startIcon={<DownloadOutlined />} disabled={!filteredEvents.length} onClick={exportJournal}>Выгрузить CSV</Button></Stack>
      <Stack direction={{ xs: 'column', md: 'row' }} gap={2} sx={{ mb: 2 }}><TextField value={query} placeholder="Интеграция, действие или Request ID" onChange={e => { setQuery(e.target.value); setPage(0); }} inputProps={{ 'aria-label': 'Поиск в журнале' }} sx={{ flex: 1 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment> }} /><TextField select value={category} onChange={e => { setCategory(e.target.value); setPage(0); }} inputProps={{ 'aria-label': 'Тип действия' }} sx={{ minWidth: 190 }}><MenuItem value="all">Все действия</MenuItem>{Object.entries(categories).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField><TextField select value={result} onChange={e => { setResult(e.target.value); setPage(0); }} inputProps={{ 'aria-label': 'Результат действия' }} sx={{ minWidth: 170 }}><MenuItem value="all">Все результаты</MenuItem><MenuItem value="success">Успешно</MenuItem><MenuItem value="denied">Отказ</MenuItem></TextField></Stack>
      <Stack direction="row" flexWrap="wrap" gap={2} alignItems="flex-end" sx={{ mb: 2.5 }}><TextField label="Дата с" type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(0); }} error={dateError} /><TextField label="Дата по" type="date" value={to} onChange={e => { setTo(e.target.value); setPage(0); }} error={dateError} />{(query || category !== 'all' || result !== 'all' || from || to) && <Button onClick={() => { setQuery(''); setCategory('all'); setResult('all'); setFrom(''); setTo(''); setPage(0); }}>Сбросить фильтры</Button>}<Box sx={{ flex: 1 }} /><Typography variant="body2" color="text.secondary" sx={{ pb: 1 }}>SIEM не подключён</Typography></Stack>
      {dateError && <Alert severity="error" sx={{ mb: 2 }}>Начало периода не может быть позже окончания.</Alert>}
      <TableContainer component={Paper} variant="outlined"><Table aria-label="Журнал UserAPI" sx={{ minWidth: 850 }}><TableHead><TableRow><TableCell>Дата и время</TableCell><TableCell>Автор / интеграция</TableCell><TableCell>Действие и объект</TableCell><TableCell>Результат</TableCell><TableCell align="right">Подробности</TableCell></TableRow></TableHead><TableBody>
        {filteredEvents.slice(safePage * 10, safePage * 10 + 10).map(e => <TableRow hover key={e.id}><TableCell sx={{ whiteSpace: 'nowrap' }}>{displayDate(e.at)}<Typography variant="body2" color="text.secondary">{displayDate(e.at, true).split(', ')[1]}</Typography></TableCell><TableCell><Typography>{e.actor}</Typography><Typography variant="body2" color="text.secondary">{e.source === 'api' ? `Ответственный: ${e.responsible ?? 'неизвестен'}` : 'Кабинет организации'}</Typography></TableCell><TableCell><Typography>{e.operation}</Typography><Typography variant="body2" color="text.secondary">{e.target}</Typography></TableCell><TableCell><Chip variant="outlined" size="small" color={e.result === 'success' ? 'success' : 'error'} label={e.result === 'success' ? 'Успешно' : 'Отказ'} /></TableCell><TableCell align="right"><Button onClick={() => setEvent(e)} aria-label={`Подробнее: ${e.operation}`}>Подробнее</Button></TableCell></TableRow>)}
        {!filteredEvents.length && <TableRow><TableCell colSpan={5} sx={{ py: 6, textAlign: 'center' }}><Typography>Записи не найдены</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Измените фильтры или период.</Typography></TableCell></TableRow>}
      </TableBody></Table><TablePagination component="div" count={filteredEvents.length} page={safePage} onPageChange={(_, value) => setPage(value)} rowsPerPage={10} rowsPerPageOptions={[10]} labelDisplayedRows={({ from: first, to: last, count }) => `${first}–${last} из ${count}`} getItemAriaLabel={type => type === 'next' ? 'Следующая страница' : 'Предыдущая страница'} /></TableContainer>
    </>}
    {tab === 2 && <>
      <Typography variant="h6" sx={{ mb: 1 }}>{API_PERMISSION}</Typography><Typography color="text.secondary" sx={{ mb: 2.5, maxWidth: 900 }}>Администраторы с этим полномочием могут управлять ключами нового вида и просматривать журнал. Выдавать и отзывать полномочие может только владелец организации.</Typography>
      <Alert severity="info" icon={<ShieldOutlined />} sx={{ mb: 3 }}>Вы — владелец организации. У вас это полномочие есть всегда. Отзыв полномочия у администратора не отключает созданные им ключи.</Alert>
      <TableContainer component={Paper} variant="outlined"><Table aria-label="Доступ администраторов" sx={{ minWidth: 550 }}><TableHead><TableRow><TableCell>Администратор</TableCell><TableCell>Роль в организации</TableCell><TableCell align="right">Полномочие</TableCell></TableRow></TableHead><TableBody>{state.admins.map(admin => <TableRow key={admin.id}><TableCell><Typography>{admin.name}{admin.owner ? ' · Вы' : ''}</Typography><Typography variant="body2" color="text.secondary">{admin.email}</Typography></TableCell><TableCell>{admin.owner ? 'Владелец' : 'Администратор'}</TableCell><TableCell align="right"><Stack direction="row" justifyContent="flex-end" alignItems="center" gap={1}><Typography variant="body2" color="text.secondary">{admin.owner ? 'Всегда' : admin.allowed ? 'Выдано' : 'Не выдано'}</Typography><Switch checked={admin.owner || admin.allowed} disabled={admin.owner} inputProps={{ 'aria-label': `Полномочие: ${admin.name}` }} onChange={() => admin.allowed ? setAccessConfirm(admin.id) : toggleAccess(admin.id)} /></Stack></TableCell></TableRow>)}</TableBody></Table></TableContainer>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Ключи текущего вида по-прежнему доступны всем администраторам. При потере роли администратора его ключи нового вида отключаются.</Typography>
    </>}
    </Box>

    <Menu anchorEl={menu?.anchor} open={!!menu} onClose={() => setMenu(null)}>
      <MenuItem onClick={() => menu && openDraft(menu.key)}>Настроить ключ</MenuItem>
      {menu?.key.kind === 'legacy' && <MenuItem onClick={() => { if (menu.key.legacyValue) { setSecretSaved(false); setSecret({ name: menu.key.name, value: menu.key.legacyValue, secure: false }); } setMenu(null); }}>Показать значение</MenuItem>}
      <MenuItem disabled={!!menu && keyStatus(menu.key) === 'expired'} onClick={() => { if (menu) setConfirm({ key: menu.key, action: menu.key.enabled ? 'disable' : 'enable' }); setError(''); setMenu(null); }}>{menu?.key.enabled ? 'Отключить' : 'Включить'}</MenuItem>
      <MenuItem onClick={() => { if (menu) setConfirm({ key: menu.key, action: 'rotate' }); setRotateDays('90'); setError(''); setMenu(null); }}>Сбросить ключ</MenuItem><Divider />
      <MenuItem sx={{ color: 'error.main' }} onClick={() => { if (menu) setConfirm({ key: menu.key, action: 'delete' }); setError(''); setMenu(null); }}>Удалить ключ</MenuItem>
    </Menu>

    <Dialog open={!!draft} onClose={() => !busy && setDraft(null)} fullWidth maxWidth="sm" aria-labelledby="api-key-title">
      <DialogTitle id="api-key-title">{draft?.id ? 'Настройки ключа' : 'Создать ключ API'}</DialogTitle>
      {draft && <Box component="form" onSubmit={e => { e.preventDefault(); void saveKey(); }}><DialogContent dividers><Stack spacing={3}>
        <TextField autoFocus fullWidth label="Название интеграции" placeholder="Например, кадровая система" required value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} inputProps={{ maxLength: 50 }} helperText="Комментарий к ключу, до 50 символов" />
        {!draft.id ? <Box><Typography sx={{ mb: 1 }}>Вид ключа</Typography><Stack gap={1}>{(['secure', 'legacy'] as const).map(kind => <Paper variant="outlined" key={kind} sx={{ p: 1.5, borderColor: draft.kind === kind ? 'primary.main' : 'divider' }}><FormControlLabel sx={{ m: 0, alignItems: 'flex-start', '& .MuiRadio-root': { p: .5, mr: 1 } }} control={<Radio checked={draft.kind === kind} onChange={() => setDraft({ ...draft, kind, fullAccess: kind === 'legacy', scopes: [] })} />} label={<Box><Typography>{kind === 'secure' ? 'Новый' : 'Текущий · устаревший'}</Typography><Typography variant="body2" color="text.secondary">{kind === 'secure' ? 'Ограниченный срок и однократный показ значения.' : 'Для существующих интеграций. Без срока действия.'}</Typography></Box>} /></Paper>)}</Stack></Box> : <Stack direction="row" gap={1} alignItems="center"><Chip label={draft.kind === 'secure' ? 'Новый ключ' : 'Устаревший ключ'} variant="outlined" />{currentKey && <Status item={currentKey} />}</Stack>}
        {draft.kind === 'secure' && (!draft.id ? <TextField label="Срок действия, дней" type="number" required value={draft.days} onChange={e => setDraft({ ...draft, days: e.target.value })} inputProps={{ min: 1, max: 365, step: 1 }} helperText="От 1 до 365 дней с момента создания" /> : <Field label="Действует до" value={currentKey?.expiresAt ? displayDate(currentKey.expiresAt, true) : '—'} />)}
        {draft.id && <><Field label="ID интеграции" value={draft.id} /><Field label="Ответственный администратор" value={currentKey?.creatorName ?? 'Неизвестен — ключ создан до учёта авторства'} /></>}
        <Box><Typography variant="h6" sx={{ mb: 1 }}>Разрешения</Typography>
          <FormControlLabel control={<Switch checked={draft.fullAccess} onChange={e => setDraft({ ...draft, fullAccess: e.target.checked })} />} label="Все текущие разрешения API" />
          {draft.fullAccess ? <Alert severity="warning" sx={{ mt: 1 }}>{draft.kind === 'secure' ? 'Доступ ко всем текущим разрешениям этого вида ключей, кроме широкого управления организацией и чатами. Создание и изменение сотрудников и доступ к email в новых методах не включены.' : 'Полный доступ ко всем текущим разрешениям. Новые методы и новые разрешения недоступны.'}</Alert> : <Stack divider={<Divider />} sx={{ mt: 1 }}>{availableScopes(draft.kind).map(scope => <FormControlLabel key={scope.code} sx={{ alignItems: 'flex-start', m: 0, py: 1.25, '& .MuiCheckbox-root': { p: .5, mr: 1 } }} control={<Checkbox checked={draft.scopes.includes(scope.code)} onChange={e => setDraft({ ...draft, scopes: e.target.checked ? [...draft.scopes, scope.code] : draft.scopes.filter(s => s !== scope.code) })} />} label={<Box><Typography>{scope.label}</Typography><Typography variant="body2" color="text.secondary">{scope.description}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .5, overflowWrap: 'anywhere', fontFamily: 'monospace' }}>{scope.code}</Typography></Box>} />)}</Stack>}
        </Box>
        {error && <Alert severity="error">{error}</Alert>}
      </Stack></DialogContent><DialogActions sx={{ p: 2 }}><Button disabled={busy} onClick={() => setDraft(null)}>Отмена</Button><Button disabled={busy} variant="contained" type="submit">{busy ? 'Сохранение…' : draft.id ? 'Сохранить' : 'Создать ключ'}</Button></DialogActions></Box>}
    </Dialog>

    <Dialog open={!!secret} onClose={() => { if (secret && !secret.secure) setSecret(null); }} fullWidth maxWidth="sm" aria-labelledby="api-secret-title"><DialogTitle id="api-secret-title">{secret?.secure ? 'Сохраните значение ключа' : 'Значение ключа'}</DialogTitle><DialogContent dividers><Stack spacing={2.5}><Typography>{secret?.name}</Typography><Alert severity={secret?.secure ? 'warning' : 'info'}>{secret?.secure ? 'Значение показывается только сейчас. Скопируйте его и сохраните в защищённом месте. После закрытия окна посмотреть его повторно не получится.' : 'Это ключ текущего вида. Его значение можно посмотреть повторно.'}</Alert><Typography variant="body2" color="text.secondary">Демонстрационный ключ. Не подходит для запросов к настоящему API.</Typography><TextField multiline fullWidth label="Значение ключа" value={secret?.value ?? ''} InputProps={{ readOnly: true }} /><Button startIcon={<ContentCopyOutlined />} variant="outlined" onClick={() => secret && copy(secret.value)}>Скопировать ключ</Button>{secret?.secure && <FormControlLabel control={<Checkbox checked={secretSaved} onChange={e => setSecretSaved(e.target.checked)} />} label="Я сохранил значение ключа" />}</Stack></DialogContent><DialogActions sx={{ p: 2 }}><Button variant="contained" disabled={!!secret?.secure && !secretSaved} onClick={() => setSecret(null)}>Готово</Button></DialogActions></Dialog>

    <Dialog open={!!confirm} onClose={() => !busy && setConfirm(null)} fullWidth maxWidth="xs" aria-labelledby="api-action-title"><DialogTitle id="api-action-title">{confirm && actions[confirm.action]} ключ?</DialogTitle><DialogContent><Typography sx={{ mb: 2, overflowWrap: 'anywhere' }}>«{confirm?.key.name}»</Typography><Typography color="text.secondary">{confirm?.action === 'delete' ? 'Интеграция потеряет доступ к API. Восстановить ключ не получится. Записи журнала сохранятся.' : confirm?.action === 'disable' ? 'Запросы с этим ключом перестанут выполняться. Вы сможете включить его снова.' : confirm?.action === 'enable' ? 'Интеграция снова сможет выполнять запросы с разрешениями этого ключа.' : 'Предыдущее значение сразу перестанет работать. Обновите ключ в интеграции. Новый ключ будет показан один раз.'}</Typography>{confirm?.action === 'rotate' && <>{!confirm.key.enabled && <Alert severity="info" sx={{ mt: 2 }}>Ключ останется отключённым. После сброса включите его отдельно.</Alert>}{confirm.key.kind === 'secure' && <TextField sx={{ mt: 3 }} fullWidth type="number" label="Новый срок действия, дней" value={rotateDays} onChange={e => setRotateDays(e.target.value)} inputProps={{ min: 1, max: 365, step: 1 }} />}</>}{error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}</DialogContent><DialogActions sx={{ p: 2 }}><Button disabled={busy} onClick={() => setConfirm(null)}>Отмена</Button><Button variant="contained" disabled={busy} color={confirm?.action === 'enable' ? 'primary' : 'error'} onClick={() => void applyKeyAction()}>{busy ? 'Сохранение…' : confirm && actions[confirm.action]}</Button></DialogActions></Dialog>

    <Dialog open={!!accessConfirm} onClose={() => setAccessConfirm(null)} fullWidth maxWidth="sm" aria-labelledby="api-access-title"><DialogTitle id="api-access-title">Отозвать полномочие?</DialogTitle><DialogContent><Typography sx={{ mb: 2 }}>{state.admins.find(a => a.id === accessConfirm)?.name} больше не сможет управлять ключами нового вида и просматривать журнал.</Typography><Alert severity="info">Ранее созданные ключи продолжат работать. Управлять ими смогут другие администраторы с полномочием.</Alert></DialogContent><DialogActions sx={{ p: 2 }}><Button onClick={() => setAccessConfirm(null)}>Отмена</Button><Button color="error" variant="contained" onClick={() => accessConfirm && toggleAccess(accessConfirm)}>Отозвать</Button></DialogActions></Dialog>

    <Drawer anchor="right" open={!!event} onClose={() => setEvent(null)} slotProps={{ paper: { sx: { width: { xs: '100%', sm: 600 }, maxWidth: '100%', p: 3, top: 64, height: 'calc(100% - 64px)' }, role: 'dialog', 'aria-modal': true, 'aria-labelledby': 'audit-details-title' } }}>
      {event && <><Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={2}><Box><Typography variant="h6" id="audit-details-title">{event.operation}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{displayDate(event.at, true)} МСК</Typography></Box><IconButton onClick={() => setEvent(null)} aria-label="Закрыть подробности"><CloseOutlined /></IconButton></Stack><Divider sx={{ my: 3 }} /><Stack spacing={2.5}>
        <Box><Chip variant="outlined" color={event.result === 'success' ? 'success' : 'error'} label={event.result === 'success' ? 'Успешно' : 'Отказ'} /></Box>
        {event.reason && <Alert severity="error">{event.reason} Данные не изменены.</Alert>}
        <Field label="Организация" value={event.organization || ORGANIZATION} /><Field label="Источник" value={event.source === 'api' ? 'UserAPI' : 'Кабинет организации'} /><Field label="Автор действия" value={event.actor} /><Field label="Интеграция" value={event.integrationName ? `${event.integrationName} · ${event.integrationId}` : 'Не определена / не применимо'} />
        {event.integrationId && <Field label="Ответственный администратор" value={event.responsible ?? 'Неизвестен'} />}<Field label="Объект" value={event.target} />
        <Box><Typography variant="body2" color="text.secondary">Request ID</Typography><Stack direction="row" gap={1} alignItems="center"><Typography sx={{ fontFamily: 'monospace', fontSize: 14, overflowWrap: 'anywhere', flex: 1 }}>{event.requestId}</Typography><Tooltip title="Скопировать Request ID"><IconButton aria-label="Скопировать Request ID" onClick={() => copy(event.requestId)}><ContentCopyOutlined fontSize="small" /></IconButton></Tooltip></Stack></Box>
        {event.endpoint && <Field label="Запрос" value={`${event.method} ${event.endpoint}`} />}
        <Box><Typography variant="h6" sx={{ mb: 1 }}>Изменённые атрибуты</Typography>{event.changes.length ? <TableContainer component={Paper} variant="outlined"><Table size="small" aria-label="Изменённые атрибуты"><TableHead><TableRow><TableCell>Атрибут</TableCell><TableCell>Было</TableCell><TableCell>Стало</TableCell></TableRow></TableHead><TableBody>{event.changes.map(c => <TableRow key={c.field}>{[c.field, c.before, c.after].map((value, i) => <TableCell key={i} sx={{ overflowWrap: 'anywhere', maxWidth: 180 }}>{value}</TableCell>)}</TableRow>)}</TableBody></Table></TableContainer> : <Typography color="text.secondary">{event.result === 'denied' ? 'Изменения не применены.' : 'Действие не изменяет атрибуты.'}</Typography>}</Box>
        {event.httpStatus && <Box><Typography variant="h6" sx={{ mb: 1 }}>Ответ API · HTTP {event.httpStatus}</Typography><Box component="pre" sx={{ m: 0, p: 2, borderRadius: 1, bgcolor: 'action.hover', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: 13 }}>{`X-Request-Id: ${event.requestId}`}{event.result === 'denied' ? '\n\n' + JSON.stringify({ code: event.code, message: event.reason, requestId: event.requestId }, null, 2) : ''}</Box></Box>}
        <Typography variant="body2" color="text.secondary">Секреты и значения ключей в журнал не записываются.</Typography>
      </Stack></>}
    </Drawer>
  </Box>;
}
