import { Dialog, Menu, TextField } from './app/ModeVisibility';
import { useEffect, useId, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { Alert, Box, Button, Checkbox, Chip, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, IconButton, InputAdornment, MenuItem, Pagination, PaginationItem, Paper, Stack, Switch, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Typography } from '@mui/material';
import { SearchOutlined, ReplayOutlined, ChevronLeft, ChevronRight, MoreVertOutlined } from '@mui/icons-material';
import EmployeeProfileDialog, { EmployeeAvatar } from './EmployeeProfileDialog';
import EmployeeProfileFieldsDialog from './EmployeeProfileFieldsDialog';
import { meetingPreferenceLabels, recordingAccessLabels } from './group-model';
import { approveEmployee, createEmployeeDatabase, removeEmployees, saveEmployeeProfileField, type Employee, type EmployeeDatabase, type EmployeeSettings } from './employee-data';

type Props = { database: EmployeeDatabase; setDatabase: Dispatch<SetStateAction<EmployeeDatabase>>; notify: (value: string) => void };
type EmployeeModal =
  | { kind: 'invite' | 'profile-fields' | 'reset' | 'tariff' }
  | { kind: 'remove'; ids: string[] }
  | { kind: 'employee-profile'; id: string };

const menuItemHeight = 40;
const menuHeight = 5 * menuItemHeight + 16;

export default function EmployeesSection({ database, setDatabase, notify }: Props) {
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [selected, setSelected] = useState<string[]>([]);
  const [modal, setModal] = useState<EmployeeModal | null>(null);
  const [menu, setMenu] = useState<{ anchor: HTMLButtonElement; id: string; above: boolean } | null>(null);
  const menuId = useId();
  const searchRef = useRef<HTMLInputElement>(null);
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
  const columnCount = tab > 0 ? 6 : 5;
  const menuEmployee = pageRows.find(employee => employee.id === menu?.id);
  const profile = modal?.kind === 'employee-profile' ? database.employees.find(e => e.id === modal.id) : undefined;
  useEffect(() => { if (page !== currentPage) { setPage(currentPage); setSelected([]); } }, [page, currentPage]);
  const count = (status: Employee['status']) => database.employees.filter(e => e.status === status).length;
  const dirty = JSON.stringify(draft) !== JSON.stringify(database.settings);
  const change = <K extends keyof EmployeeSettings>(key: K, value: EmployeeSettings[K]) => setDraft(previous => ({ ...previous, [key]: value }));
  const sections = tab === 0 ? [{ title: 'Администраторы', rows: pageRows.filter(e => ['owner', 'admin'].includes(e.role)) }, { title: 'Сотрудники', rows: pageRows.filter(e => e.role === 'employee') }, { title: 'Гости', rows: pageRows.filter(e => e.role === 'guest') }] : [{ title: '', rows: pageRows }];

  function openMenu(anchor: HTMLButtonElement, id: string) {
    anchor.focus({ preventScroll: true });
    const { top, bottom } = anchor.getBoundingClientRect();
    const spaceBelow = window.innerHeight - bottom;
    setMenu({ anchor, id, above: spaceBelow < menuHeight + 16 && top > spaceBelow });
  }

  function showProfile(id: string) {
    setModal({ kind: 'employee-profile', id });
  }

  function focusSearchIfTriggerDisappeared() {
    requestAnimationFrame(() => {
      if (document.activeElement === document.body) searchRef.current?.focus({ preventScroll: true });
    });
  }

  function confirmRemoval(ids: string[]) {
    setDatabase(db => removeEmployees(db, ids));
    setSelected(current => current.filter(id => !ids.includes(id)));
    setModal(null);
    focusSearchIfTriggerDisappeared();
    notify('Выбранные записи удалены');
  }

  function exportRows() {
    const cell = (s: string) => '"' + (/^[=+\-@\t\r]/.test(s) ? "'" : '') + s.replaceAll('"', '""') + '"';
    const csv = '\ufeff' + [['Имя', 'Почта', 'Тариф', 'Роль', 'Статус'], ...rows.map(e => [e.name, e.email, e.tariff, e.role, e.status])].map(r => r.map(cell).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'employees.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <Box>
    <Stack direction={{ xs: 'column', lg: 'row' }} alignItems={{ lg: 'center' }} justifyContent="space-between" gap={2} sx={{ mb: 4 }}>
      <Typography variant="h4" component="h1">Сотрудники</Typography>
      <Stack direction="row" flexWrap="wrap" useFlexGap gap={1} sx={{ justifyContent: { sm: 'flex-end' }, '& .MuiButton-root': { textTransform: 'uppercase' } }}>
        <Button disabled={!selected.length || tab !== 0} onClick={() => setModal({ kind: 'tariff' })}>Изменить тариф</Button>
        <Button disabled={tab === 3 || !rows.length} onClick={exportRows}>Экспорт</Button>
        <Button onClick={() => setModal({ kind: 'profile-fields' })}>Настройки полей профиля</Button>
        <Button variant="contained" onClick={() => setModal({ kind: 'invite' })}>Добавить</Button>
      </Stack>
    </Stack>
    <Tabs value={tab} onChange={(_, value) => { setTab(value); setPage(1); setQuery(''); setSelected([]); }} variant="scrollable" scrollButtons="auto" aria-label="Разделы сотрудников" sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
      {['Все сотрудники', `Запросы на вступление · ${count('requested')}`, `Приглашения · ${count('invited')}`, 'Настройки'].map((label, i) => <Tab key={i} label={label} id={`employees-tab-${i}`} aria-controls={`employees-panel-${i}`} />)}
    </Tabs>
    <Box role="tabpanel" id={`employees-panel-${tab}`} aria-labelledby={`employees-tab-${tab}`}>
    {tab !== 3 ? <>
      {tab > 0 && <Alert severity="info" sx={{ mb: 2 }}>{tab === 1 ? 'Эти пользователи запросили вступление. Они станут сотрудниками после одобрения.' : 'Приглашения отправлены. Пользователи ещё не подтвердили вступление в организацию.'}</Alert>}
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={2} sx={{ mb: 2 }}>
        <TextField inputRef={searchRef} placeholder="Имя или email" value={query} onChange={e => { setQuery(e.target.value); setPage(1); setSelected([]); }} inputProps={{ 'aria-label': 'Поиск сотрудников' }} sx={{ width: { xs: '100%', sm: 400 } }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlined /></InputAdornment> }} />
        <Typography color="text.secondary">Найдено: {rows.length}</Typography>
        {!!selected.length && <><Typography>Выбрано: {selected.length}</Typography><Button color="error" onClick={() => setModal({ kind: 'remove', ids: selected })}>{tab === 1 ? 'Отклонить запросы' : tab === 2 ? 'Отменить приглашения' : 'Удалить из организации'}</Button></>}
      </Stack>
      <TableContainer component={Paper} variant="outlined"><Table aria-label={tab === 0 ? 'Сотрудники организации' : tab === 1 ? 'Запросы на вступление' : 'Приглашения сотрудников'} sx={{ minWidth: 700 }}>
        <TableHead><TableRow><TableCell padding="checkbox"><Checkbox aria-label="Выбрать всех на странице" disabled={!selectable.length} checked={!!selectable.length && selectable.every(e => selected.includes(e.id))} indeterminate={selected.length > 0 && !selectable.every(e => selected.includes(e.id))} onChange={e => setSelected(e.target.checked ? selectable.map(p => p.id) : [])} /></TableCell><TableCell>Имя</TableCell><TableCell>Почта</TableCell><TableCell>Тариф</TableCell>{tab > 0 && <TableCell>Статус / действие</TableCell>}<TableCell aria-label="Действия" /></TableRow></TableHead>
        <TableBody>{sections.map(section => <SectionRows key={section.title} {...section} tab={tab} columnCount={columnCount}
          selected={selected} openMenu={openMenu} openProfile={showProfile} menuId={menuId} menuEmployeeId={menuEmployee?.id}
          toggle={id => setSelected(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id])}
          approve={id => { setSelected(ids => ids.filter(selectedId => selectedId !== id)); setDatabase(db => approveEmployee(db, id)); notify('Запрос одобрен. Пользователь добавлен в сотрудники.'); }} />)}
        {!rows.length && <TableRow><TableCell colSpan={columnCount} sx={{ textAlign: 'center', py: 6 }}><Typography>{query ? 'Ничего не найдено' : 'Список пуст'}</Typography>{query && <Button onClick={() => { setQuery(''); setPage(1); }}>Сбросить поиск</Button>}</TableCell></TableRow>}</TableBody>
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
        <Stack><FormControlLabel control={<Switch checked={draft.autoRecord} onChange={e => change('autoRecord', e.target.checked)} />} label={meetingPreferenceLabels.autoRecord} /><FormControlLabel control={<Switch checked={draft.autoTranscript} onChange={e => change('autoTranscript', e.target.checked)} />} label="Запускать текстовую расшифровку при старте мероприятия" /></Stack>
        <TextField sx={{ mt: 2, minWidth: 260 }} select label={meetingPreferenceLabels.recordingAccess} value={draft.recordingAccess} onChange={e => change('recordingAccess', e.target.value as EmployeeSettings['recordingAccess'])}>{Object.entries(recordingAccessLabels).map(([value, label]) => <MenuItem value={value} key={value}>{label}</MenuItem>)}</TextField>
        <Divider sx={{ my: 3 }} /><Typography variant="h6" sx={{ mb: 1 }}>Подключение к встрече</Typography><Stack><FormControlLabel control={<Switch checked={draft.camera} onChange={e => change('camera', e.target.checked)} />} label={meetingPreferenceLabels.camera} /><FormControlLabel control={<Switch checked={draft.microphone} onChange={e => change('microphone', e.target.checked)} />} label={meetingPreferenceLabels.microphone} /></Stack>
      </Paper><Stack direction="row" gap={1} sx={{ mt: 2 }}><Button variant="contained" disabled={!dirty} onClick={() => { setDatabase(db => ({ ...db, settings: { ...draft } })); notify('Настройки по умолчанию сохранены'); }}>Сохранить</Button><Button disabled={!dirty} onClick={() => setDraft(database.settings)}>Отмена</Button></Stack>
    </Box>}
    </Box>
    <Box sx={{ mt: 3 }}><Button size="small" color="inherit" startIcon={<ReplayOutlined />} onClick={() => setModal({ kind: 'reset' })}>Сбросить демоданные сотрудников</Button></Box>
    <Menu anchorEl={menu?.anchor} open={Boolean(menuEmployee)} onClose={() => setMenu(null)}
      anchorOrigin={{ vertical: menu?.above ? 'top' : 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: menu?.above ? 'bottom' : 'top', horizontal: 'right' }}
      slotProps={{
        list: { id: menuId, 'aria-label': menuEmployee && `Действия: ${menuEmployee.name}` },
        paper: { sx: { minWidth: 240, '& .MuiMenuItem-root': { minHeight: menuItemHeight } } },
      }}>
      <MenuItem onClick={() => { if (menuEmployee) showProfile(menuEmployee.id); setMenu(null); }}>Настройки профиля</MenuItem>
      <MenuItem disabled>Активные сессии</MenuItem>
      <MenuItem disabled>Перенос данных</MenuItem>
      <MenuItem disabled>Изменить тариф</MenuItem>
      <MenuItem disabled={menuEmployee?.status !== 'active' || menuEmployee.role === 'owner'} sx={{ color: 'error.main' }}
        onClick={() => { if (menuEmployee) setModal({ kind: 'remove', ids: [menuEmployee.id] }); setMenu(null); }}>Исключить сотрудника</MenuItem>
    </Menu>
    {profile && <EmployeeProfileDialog key={profile.id} employee={profile} profileFields={database.profileFields} onClose={() => setModal(null)}
      isEmailTaken={email => database.employees.some(e => e.id !== profile.id && e.email.toLowerCase() === email.toLowerCase())}
      onSave={update => {
        setDatabase(db => ({ ...db, employees: db.employees.map(e => e.id === profile.id ? { ...e, ...update } : e) }));
        setModal(null);
        focusSearchIfTriggerDisappeared();
        notify('Профиль сотрудника сохранён');
      }} />}
    {modal?.kind === 'profile-fields' && <EmployeeProfileFieldsDialog fields={database.profileFields}
      onClose={() => setModal(null)} onSave={(field, editing) => setDatabase(db => saveEmployeeProfileField(db, field, editing))} />}
    {modal && modal.kind !== 'employee-profile' && modal.kind !== 'profile-fields' && <Dialog open onClose={() => setModal(null)} fullWidth maxWidth="sm" aria-labelledby="employee-modal-title"><DialogTitle id="employee-modal-title">{modal.kind === 'invite' ? 'Приглашение сотрудников' : modal.kind === 'reset' ? 'Сбросить демоданные сотрудников?' : modal.kind === 'tariff' ? 'Изменение тарифа' : tab === 1 ? 'Отклонить запросы?' : tab === 2 ? 'Отменить приглашения?' : 'Удалить выбранных сотрудников?'}</DialogTitle><DialogContent>
      <Typography>{modal.kind === 'invite' ? 'Это модальное окно приглашения сотрудников. Детализируем его в следующей итерации.' : modal.kind === 'tariff' ? 'Это модальное окно изменения тарифа выбранных сотрудников. Пока здесь демонстрационная заглушка.' : modal.kind === 'reset' ? 'Восстановятся исходный список, статусы и настройки сотрудников. Все изменения этого раздела будут отменены. Остальные разделы сохранятся.' : modal.kind === 'remove' ? `Будут удалены выбранные записи: ${modal.ids.length}. В прототипе их можно вернуть сбросом демоданных.` : null}</Typography>
      {modal.kind === 'remove' && modal.ids.length === 1 && <Typography sx={{ mt: 1 }}>{database.employees.find(e => e.id === modal.ids[0])?.name}</Typography>}
    </DialogContent><DialogActions sx={{ p: 2 }}><Button onClick={() => setModal(null)}>{modal.kind === 'reset' || modal.kind === 'remove' ? 'Отмена' : 'Закрыть'}</Button>{modal.kind === 'reset' && <Button color="error" onClick={() => { setDatabase(createEmployeeDatabase()); setPage(1); setSelected([]); setQuery(''); setModal(null); notify('Исходная база сотрудников восстановлена'); }}>Сбросить</Button>}{modal.kind === 'remove' && <Button color="error" onClick={() => confirmRemoval(modal.ids)}>Подтвердить</Button>}</DialogActions></Dialog>}
  </Box>;
}

type RowActions = {
  openMenu: (anchor: HTMLButtonElement, id: string) => void;
  openProfile: (id: string) => void;
  toggle: (id: string) => void;
  approve: (id: string) => void;
  menuId: string;
};

function SectionRows({ title, rows, tab, columnCount, selected, menuEmployeeId, ...actions }: RowActions & {
  title: string; rows: Employee[]; tab: number; columnCount: number; selected: string[]; menuEmployeeId?: string;
}) {
  if (!rows.length) return null;
  return <>
    {title && <TableRow><TableCell colSpan={columnCount} sx={{ pt: 3, pb: 1, borderBottom: 0 }}><Typography fontWeight={500}>{title}</Typography></TableCell></TableRow>}
    {rows.map(employee => <EmployeeRow key={employee.id} employee={employee} tab={tab}
      selected={selected.includes(employee.id)} menuOpen={menuEmployeeId === employee.id} {...actions} />)}
  </>;
}

function EmployeeRow({ employee, tab, selected, menuOpen, menuId, openMenu, openProfile, toggle, approve }: RowActions & {
  employee: Employee; tab: number; selected: boolean; menuOpen: boolean;
}) {
  const profileButton = useRef<HTMLButtonElement>(null);
  const { id, name, role, email, tariff } = employee;
  function showProfile() {
    profileButton.current?.focus({ preventScroll: true });
    openProfile(id);
  }

  return <TableRow hover selected={selected} onClick={showProfile} sx={{ cursor: 'pointer' }}>
    <TableCell padding="checkbox" onClick={event => event.stopPropagation()}>
      <Checkbox disabled={role === 'owner'} checked={selected} onChange={() => toggle(id)} inputProps={{ 'aria-label': `Выбрать: ${name}` }} />
    </TableCell>
    <TableCell sx={{ py: 2 }}>
      <Stack direction="row" gap={2} alignItems="center">
        <EmployeeAvatar employee={employee} size={44} />
        <Box>
          <Box component="button" type="button" ref={profileButton} aria-label={`Открыть профиль: ${name}`}
            onClick={event => { event.stopPropagation(); showProfile(); }}
            sx={{ font: 'inherit', fontSize: '1rem', color: 'inherit', bgcolor: 'transparent', border: 0, p: 0, textAlign: 'left', cursor: 'pointer', overflowWrap: 'anywhere' }}>
            {name}
          </Box>
          {role === 'owner' && <Typography variant="body2" color="text.secondary">Создатель организации</Typography>}
          {role === 'guest' && <Box><Chip size="small" variant="outlined" label="Гость" /></Box>}
        </Box>
      </Stack>
    </TableCell>
    <TableCell sx={{ overflowWrap: 'anywhere' }}>{email}</TableCell>
    <TableCell sx={{ whiteSpace: 'nowrap' }}>{tariff}</TableCell>
    {tab > 0 && <TableCell>{tab === 1
      ? <Button onClick={event => { event.stopPropagation(); approve(id); }}>Одобрить</Button>
      : <Chip size="small" variant="outlined" label="Ожидает подтверждения" />}</TableCell>}
    <TableCell align="right" padding="checkbox">
      <IconButton aria-label={`Действия: ${name}`} aria-haspopup="menu" aria-expanded={menuOpen}
        aria-controls={menuOpen ? menuId : undefined} size="small"
        onClick={event => { event.stopPropagation(); openMenu(event.currentTarget, id); }}
        sx={{ mr: 1, '&[aria-expanded="true"]': { bgcolor: 'action.selected' } }}>
        <MoreVertOutlined fontSize="small" />
      </IconButton>
    </TableCell>
  </TableRow>;
}

function PreviousPage() { return <Stack direction="row" alignItems="center"><ChevronLeft /><Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>Назад</Box></Stack>; }
function NextPage() { return <Stack direction="row" alignItems="center"><Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>Далее</Box><ChevronRight /></Stack>; }
