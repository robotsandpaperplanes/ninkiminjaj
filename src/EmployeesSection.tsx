import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { Alert, Avatar, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, InputAdornment, MenuItem, Pagination, PaginationItem, Paper, Stack, Switch, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, TextField, Typography } from '@mui/material';
import { SearchOutlined, ReplayOutlined, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { approveEmployee, createEmployeeDatabase, employeeInitials, removeEmployees, type Employee, type EmployeeDatabase, type EmployeeSettings } from './employee-data';

type Props = { database: EmployeeDatabase; setDatabase: Dispatch<SetStateAction<EmployeeDatabase>>; notify: (value: string) => void };
export default function EmployeesSection({ database, setDatabase, notify }: Props) {
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [selected, setSelected] = useState<string[]>([]);
  const [modal, setModal] = useState<'invite' | 'profile' | 'remove' | 'reset' | 'tariff' | null>(null);
  const [draft, setDraft] = useState(database.settings);
  useEffect(() => { setDraft(database.settings); }, [database.settings]);
  useEffect(() => { setSelected(ids => ids.filter(id => database.employees.some(e => e.id === id))); }, [database.employees]);
  const rows = database.employees.filter(e => e.status === (tab === 1 ? 'requested' : tab === 2 ? 'invited' : 'active')).filter(e => `${e.name} ${e.email}`.toLocaleLowerCase('ru').includes(query.trim().toLocaleLowerCase('ru')));
  const rank = (e: Employee) => e.role === 'owner' || e.role === 'admin' ? 0 : e.role === 'guest' ? 2 : 1;
  const orderedRows = tab === 0 ? [...rows].sort((a, b) => rank(a) - rank(b)) : rows;
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = orderedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selectable = pageRows.filter(e => e.role !== 'owner');
  useEffect(() => { if (page !== currentPage) { setPage(currentPage); setSelected([]); } }, [page, currentPage]);
  const count = (status: Employee['status']) => database.employees.filter(e => e.status === status).length;
  const dirty = JSON.stringify(draft) !== JSON.stringify(database.settings);
  const change = <K extends keyof EmployeeSettings>(key: K, value: EmployeeSettings[K]) => setDraft(previous => ({ ...previous, [key]: value }));
  const sections = tab === 0 ? [{ title: 'Администраторы', rows: pageRows.filter(e => ['owner', 'admin'].includes(e.role)) }, { title: 'Сотрудники', rows: pageRows.filter(e => e.role === 'employee') }, { title: 'Гости', rows: pageRows.filter(e => e.role === 'guest') }] : [{ title: '', rows: pageRows }];
  function exportRows() {
    const cell = (s: string) => '"' + (/^[=+\-@\t\r]/.test(s) ? "'" : '') + s.replaceAll('"', '""') + '"';
    const csv = '\ufeff' + [['Имя', 'Почта', 'Тариф', 'Роль', 'Статус'], ...rows.map(e => [e.name, e.email, e.tariff, e.role, e.status])].map(r => r.map(cell).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'employees.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <Box>
    <Stack direction={{ xs: 'column', lg: 'row' }} alignItems={{ lg: 'center' }} justifyContent="space-between" gap={2} sx={{ mb: 4 }}>
      <Typography variant="h4" component="h1">Сотрудники</Typography>
      <Stack direction="row" flexWrap="wrap" useFlexGap gap={1}>
        <Button disabled={!selected.length || tab !== 0} onClick={() => setModal('tariff')}>Изменить тариф</Button>
        <Button disabled={tab === 3 || !rows.length} onClick={exportRows}>Экспорт</Button>
        <Button onClick={() => setModal('profile')}>Настройки полей профиля</Button>
        <Button variant="contained" onClick={() => setModal('invite')}>Добавить</Button>
      </Stack>
    </Stack>
    <Tabs value={tab} onChange={(_, value) => { setTab(value); setPage(1); setQuery(''); setSelected([]); }} variant="scrollable" scrollButtons="auto" aria-label="Разделы сотрудников" sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
      {['Все сотрудники', `Запросы на вступление · ${count('requested')}`, `Приглашения · ${count('invited')}`, 'Настройки'].map((label, i) => <Tab key={i} label={label} id={`employees-tab-${i}`} aria-controls={`employees-panel-${i}`} />)}
    </Tabs>
    <Box role="tabpanel" id={`employees-panel-${tab}`} aria-labelledby={`employees-tab-${tab}`}>
    {tab !== 3 ? <>
      {tab > 0 && <Alert severity="info" sx={{ mb: 2 }}>{tab === 1 ? 'Эти пользователи запросили вступление. Они станут сотрудниками после одобрения.' : 'Приглашения отправлены. Пользователи ещё не подтвердили вступление в организацию.'}</Alert>}
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={2} sx={{ mb: 2 }}>
        <TextField placeholder="Имя или email" value={query} onChange={e => { setQuery(e.target.value); setPage(1); setSelected([]); }} inputProps={{ 'aria-label': 'Поиск сотрудников' }} sx={{ width: { xs: '100%', sm: 400 } }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlined /></InputAdornment> }} />
        <Typography color="text.secondary">Найдено: {rows.length}</Typography>
        {!!selected.length && <><Typography>Выбрано: {selected.length}</Typography><Button color="error" onClick={() => setModal('remove')}>{tab === 1 ? 'Отклонить запросы' : tab === 2 ? 'Отменить приглашения' : 'Удалить из организации'}</Button></>}
      </Stack>
      <TableContainer component={Paper} variant="outlined"><Table aria-label={tab === 0 ? 'Сотрудники организации' : tab === 1 ? 'Запросы на вступление' : 'Приглашения сотрудников'} sx={{ minWidth: 700 }}>
        <TableHead><TableRow><TableCell padding="checkbox"><Checkbox aria-label="Выбрать всех на странице" disabled={!selectable.length} checked={!!selectable.length && selectable.every(e => selected.includes(e.id))} indeterminate={selected.length > 0 && !selectable.every(e => selected.includes(e.id))} onChange={e => setSelected(e.target.checked ? selectable.map(p => p.id) : [])} /></TableCell><TableCell>Имя</TableCell><TableCell>Почта</TableCell><TableCell>Тариф</TableCell>{tab > 0 && <TableCell>Статус / действие</TableCell>}</TableRow></TableHead>
        <TableBody>{sections.map(section => <SectionRows key={section.title} {...section} tab={tab} selected={selected} toggle={id => setSelected(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id])} approve={id => { setSelected(ids => ids.filter(selectedId => selectedId !== id)); setDatabase(db => approveEmployee(db, id)); notify('Запрос одобрен. Пользователь добавлен в сотрудники.'); }} />)}
        {!rows.length && <TableRow><TableCell colSpan={tab > 0 ? 5 : 4} sx={{ textAlign: 'center', py: 6 }}><Typography>{query ? 'Ничего не найдено' : 'Список пуст'}</Typography>{query && <Button onClick={() => { setQuery(''); setPage(1); }}>Сбросить поиск</Button>}</TableCell></TableRow>}</TableBody>
      </Table></TableContainer>
      <Stack direction="row" flexWrap="wrap" alignItems="center" justifyContent="space-between" useFlexGap gap={2} sx={{ mt: 2 }}>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Typography component="label" htmlFor="employee-page-size" color="text.secondary">На странице</Typography>
          <TextField select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); setSelected([]); }}
            SelectProps={{ native: true }} inputProps={{ id: 'employee-page-size', 'aria-label': 'Сотрудников на странице' }} sx={{ minWidth: 80 }}>
            {[12, 25, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
          </TextField>
          <Typography color="text.secondary" aria-live="polite">{rows.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, rows.length)} из {rows.length}</Typography>
        </Stack>
        <Pagination count={pageCount} page={currentPage} color="primary" disabled={!rows.length} aria-label="Страницы сотрудников"
          onChange={(_, value) => { setPage(value); setSelected([]); }}
          getItemAriaLabel={(type, number) => type === 'page' ? `Страница ${number}` : type === 'previous' ? 'Предыдущая страница' : type === 'next' ? 'Следующая страница' : 'Пропущенные страницы'}
          renderItem={item => <PaginationItem {...item} slots={{ previous: PreviousPage, next: NextPage }} />} />
      </Stack>
    </> : <Box sx={{ maxWidth: 820 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>Настройки сотрудников по умолчанию</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Сотрудники могут выставить настройки индивидуально.</Typography>
      <Paper variant="outlined" sx={{ p: 3 }}><Typography variant="h6" sx={{ mb: 1 }}>Запись мероприятия</Typography>
        <Stack><FormControlLabel control={<Switch checked={draft.autoRecord} onChange={e => change('autoRecord', e.target.checked)} />} label="Запускать запись при старте мероприятия" /><FormControlLabel control={<Switch checked={draft.autoTranscript} onChange={e => change('autoTranscript', e.target.checked)} />} label="Запускать текстовую расшифровку при старте мероприятия" /></Stack>
        <TextField sx={{ mt: 2, minWidth: 260 }} select label="Доступ к записи мероприятия" value={draft.recordingAccess} onChange={e => change('recordingAccess', e.target.value as EmployeeSettings['recordingAccess'])}><MenuItem value="self">Только у меня</MenuItem><MenuItem value="participants">Только у участников</MenuItem><MenuItem value="link">У всех по ссылке</MenuItem></TextField>
        <Divider sx={{ my: 3 }} /><Typography variant="h6" sx={{ mb: 1 }}>Подключение к встрече</Typography><Stack><FormControlLabel control={<Switch checked={draft.camera} onChange={e => change('camera', e.target.checked)} />} label="Включать мою камеру при подключении" /><FormControlLabel control={<Switch checked={draft.microphone} onChange={e => change('microphone', e.target.checked)} />} label="Включать мой микрофон при подключении" /></Stack>
      </Paper><Stack direction="row" gap={1} sx={{ mt: 2 }}><Button variant="contained" disabled={!dirty} onClick={() => { setDatabase(db => ({ ...db, settings: { ...draft } })); notify('Настройки по умолчанию сохранены'); }}>Сохранить</Button><Button disabled={!dirty} onClick={() => setDraft(database.settings)}>Отмена</Button></Stack>
    </Box>}
    </Box>
    <Box sx={{ mt: 3 }}><Button size="small" color="inherit" startIcon={<ReplayOutlined />} onClick={() => setModal('reset')}>Сбросить демоданные сотрудников</Button></Box>
    {modal && <Dialog open onClose={() => setModal(null)} fullWidth maxWidth="sm" aria-labelledby="employee-modal-title"><DialogTitle id="employee-modal-title">{modal === 'profile' ? 'Настройки полей профиля' : modal === 'invite' ? 'Приглашение сотрудников' : modal === 'reset' ? 'Сбросить демоданные сотрудников?' : modal === 'tariff' ? 'Изменение тарифа' : tab === 1 ? 'Отклонить запросы?' : tab === 2 ? 'Отменить приглашения?' : 'Удалить выбранных сотрудников?'}</DialogTitle><DialogContent>
      <Typography>{modal === 'profile' ? 'Это модальное окно настройки полей профиля. Детализируем его в следующей итерации.' : modal === 'invite' ? 'Это модальное окно приглашения сотрудников. Детализируем его в следующей итерации.' : modal === 'tariff' ? 'Это модальное окно изменения тарифа выбранных сотрудников. Пока здесь демонстрационная заглушка.' : modal === 'reset' ? 'Восстановятся исходный список, статусы и настройки сотрудников. Все изменения этого раздела будут отменены. Остальные разделы сохранятся.' : `Будут удалены выбранные записи: ${selected.length}. В прототипе их можно вернуть сбросом демоданных.`}</Typography>
    </DialogContent><DialogActions sx={{ p: 2 }}><Button onClick={() => setModal(null)}>{modal === 'reset' || modal === 'remove' ? 'Отмена' : 'Закрыть'}</Button>{modal === 'reset' && <Button color="error" onClick={() => { setDatabase(createEmployeeDatabase()); setPage(1); setSelected([]); setQuery(''); setModal(null); notify('Исходная база сотрудников восстановлена'); }}>Сбросить</Button>}{modal === 'remove' && <Button color="error" onClick={() => { setDatabase(db => removeEmployees(db, selected)); setSelected([]); setModal(null); notify('Выбранные записи удалены'); }}>Подтвердить</Button>}</DialogActions></Dialog>}
  </Box>;
}
function SectionRows({ title, rows, tab, selected, toggle, approve }: { title: string; rows: Employee[]; tab: number; selected: string[]; toggle: (id: string) => void; approve: (id: string) => void }) {
  if (!rows.length) return null;
  return <>{title && <TableRow><TableCell colSpan={4} sx={{ pt: 3, pb: 1, borderBottom: 0 }}><Typography fontWeight={500}>{title}</Typography></TableCell></TableRow>}{rows.map(e => <TableRow hover key={e.id} selected={selected.includes(e.id)}><TableCell padding="checkbox"><Checkbox disabled={e.role === 'owner'} checked={selected.includes(e.id)} onChange={() => toggle(e.id)} inputProps={{ 'aria-label': `Выбрать: ${e.name}` }} /></TableCell><TableCell sx={{ py: 2 }}><Stack direction="row" gap={2} alignItems="center"><Avatar sx={{ bgcolor: 'action.selected', color: 'text.secondary', width: 44, height: 44, fontSize: 16 }}>{employeeInitials(e.name)}</Avatar><Box><Typography>{e.name}</Typography>{e.role === 'owner' && <Typography variant="body2" color="text.secondary">Создатель организации</Typography>}{e.role === 'guest' && <Chip size="small" variant="outlined" label="Гость" />}</Box></Stack></TableCell><TableCell sx={{ overflowWrap: 'anywhere' }}>{e.email}</TableCell><TableCell sx={{ whiteSpace: 'nowrap' }}>{e.tariff}</TableCell>{tab > 0 && <TableCell>{tab === 1 ? <Button onClick={() => approve(e.id)}>Одобрить</Button> : <Chip size="small" variant="outlined" label="Ожидает подтверждения" />}</TableCell>}</TableRow>)}</>;
}

function PreviousPage() { return <Stack direction="row" alignItems="center"><ChevronLeft /><Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>Назад</Box></Stack>; }
function NextPage() { return <Stack direction="row" alignItems="center"><Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>Далее</Box><ChevronRight /></Stack>; }
