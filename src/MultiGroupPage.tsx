import UnsavedChangesBar from './UnsavedChangesBar';
import { useEffect, useState, type MutableRefObject, type ReactNode } from 'react';
import {
  Alert, Avatar, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, FormControlLabel, IconButton, InputAdornment, LinearProgress,
  Link, Menu, MenuItem, Paper, Stack, Switch, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TablePagination, TableRow, Tabs, TextField, Tooltip, Typography,
} from '@mui/material';
import { AddOutlined, ArrowBackOutlined, ContentCopyOutlined, FlagRounded, MoreVertOutlined, SearchOutlined, StarRounded } from '@mui/icons-material';
import type { Group } from './data';
import { defaultPermissions, defaultSettings, extraPeople, getDetails, newToken, people, productLabels, type GroupDetails, type Member, type Permissions, type Settings } from './group-model';

import { PermissionControl } from './PermissionControl';
import { systemGroups, type PermissionState } from './multi-model';
import { roleConfig, everyoneSettings } from './role-model';
import { RoleType, RoleQuotas, RoleRights, RoleSettings, RolePreview } from './MultiGroupControls';

type TabKey = 'main' | 'members' | 'products' | 'permissions' | 'settings';
function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2} sx={{ mb: 2.5 }}>
      <Typography variant="h6" component="h2">{title}</Typography>{action}
    </Stack>{children}
  </Paper>;
}
function SettingRow({ label, description, children }: { label: string; description?: ReactNode; children: ReactNode }) {
  return <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" gap={1.5} sx={{ py: 1.75 }}>
    <Box sx={{ minWidth: 0, flex: 1 }}><Typography variant="body1" sx={{ fontSize: 14 }}>{label}</Typography>{description && <Typography component="div" variant="body2" color="text.secondary" sx={{ mt: .5, maxWidth: 620 }}>{description}</Typography>}</Box>
    <Box sx={{ flexShrink: 0, alignSelf: { xs: 'flex-end', sm: 'auto' } }}>{children}</Box>
  </Stack>;
}
function ToggleRow({ label, description, value, onChange }: { label: string; description?: ReactNode; value: boolean; onChange: (value: boolean) => void }) {
  return <SettingRow label={label} description={description}><Switch size="small" checked={value} onChange={e => onChange(e.target.checked)} slotProps={{ input: { 'aria-label': label } }} /></SettingRow>;
}
function Section({ title, children, first = false }: { title: string; children: ReactNode; first?: boolean }) {
  return <Box sx={{ mt: first ? 0 : 2, pt: first ? 0 : 2.5, borderTop: first ? 0 : 1, borderColor: 'divider' }}>
    <Typography component="h3" variant="subtitle1" sx={{ mb: .75 }}>{title}</Typography>{children}
  </Box>;
}
function pluralGroups(n: number) { return n % 10 === 1 && n % 100 !== 11 ? 'группа' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'группы' : 'групп'; }

export default function GroupPage({ group, groups, onSave, onDelete, onBack, notify, leaveRef, roleMode = false }: {
  readOnly?: boolean; scenario?: string; roleMode?: boolean; group: Group; groups: Group[]; onSave: (group: Group) => void; onDelete: (id: string) => void;
  onBack: () => void; notify: (message: string) => void; leaveRef: MutableRefObject<((after?: () => void) => void) | null>;
}) {
  const system = group.systemGroup;
  const systemInfo = system ? systemGroups[system] : undefined;
  const [tab, setTab] = useState<TabKey>('main');
  const [name, setName] = useState(group.name);
  const [manager, setManager] = useState(group.manager);
  const [draft, setDraft] = useState<GroupDetails>(() => structuredClone(getDetails(group)));
  const [error, setError] = useState('');
  const [saveAttention, setSaveAttention] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetLinkOpen, setResetLinkOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [limitEdit, setLimitEdit] = useState<'event' | 'storage' | null>(null);
  const [limitValue, setLimitValue] = useState('');
  const [limitError, setLimitError] = useState('');
  const [groupSelect, setGroupSelect] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [page, setPage] = useState(0);
  const [memberMenu, setMemberMenu] = useState<{ element: HTMLElement; member: Member } | null>(null);
  const [removeMember, setRemoveMember] = useState<Member | null>(null);
  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const dirty = name !== group.name || manager !== group.manager || JSON.stringify(draft) !== JSON.stringify(getDetails(group));
  const inviteUrl = 'https://link.example/invite/' + draft.inviteToken;
  const filteredMembers = draft.members.filter(m => (m.name + ' ' + m.email + ' ' + m.position).toLocaleLowerCase('ru').includes(memberSearch.trim().toLocaleLowerCase('ru')));
  const directory = [...people, ...extraPeople].filter(p => !draft.members.some(m => m.id === p.id));
  const visibleCommunicationGroups = draft.permissions.communicationGroups.filter(id => groups.some(g => g.id === id));
  const config = roleConfig({ ...group, details: draft });
  const usedPercent = Math.min(100, Math.round(draft.storageUsed / draft.storageLimit * 100));

  function patch(values: Partial<GroupDetails>) { setDraft(previous => ({ ...previous, ...values })); setError(''); }
  function changeState(key: string, value: PermissionState) { setDraft(previous => ({ ...previous, multiPermissions: { ...previous.multiPermissions, [key]: value } })); }
  const communicationState = draft.multiPermissions?.communication ?? (draft.permissions.communication === 'none' ? 'deny' : 'allow');
  function permission<K extends keyof Permissions>(key: K, value: Permissions[K]) { setDraft(previous => ({ ...previous, permissions: { ...previous.permissions, [key]: value } })); }
  function setting<K extends keyof Settings>(key: K, value: Settings[K]) { setDraft(previous => ({ ...previous, settings: { ...previous.settings, [key]: value } })); }
  function back(after = onBack) { if (dirty) { if (tab === 'members') setTab('main'); setSaveAttention(n => n + 1); } else after(); }
  function cancelChanges() { setName(group.name); setManager(group.manager); setDraft(structuredClone(getDetails(group))); setError(''); setSaveAttention(0); }
  useEffect(() => { if (!dirty) setSaveAttention(0); }, [dirty]);
  useEffect(() => { leaveRef.current = back; return () => { leaveRef.current = null; }; });
  function apply() {
    if (!name.trim()) { setTab('main'); setError(roleMode ? 'Введите название группы.' : 'Введите название группы.'); return; }
    if (groups.some(g => g.id !== group.id && g.name.trim().toLocaleLowerCase('ru') === name.trim().toLocaleLowerCase('ru'))) { setTab('main'); setError(roleMode ? 'Группа с таким названием уже существует.' : 'Группа с таким названием уже существует.'); return; }
    if (!roleMode && draft.passwordProtected && draft.invitePassword.trim().length < 6) { setTab('main'); setError('Укажите пароль для ссылки — минимум 6 символов.'); return; }
    if (communicationState === 'allow' && draft.permissions.communication === 'groups' && !visibleCommunicationGroups.length) { setTab('permissions'); setError(roleMode ? 'Выберите хотя бы одну группу для общения.' : 'Выберите хотя бы одну группу для общения.'); return; }
    const normalized = { ...draft, permissions: { ...draft.permissions, communicationGroups: visibleCommunicationGroups } };
    setDraft(normalized); setName(name.trim()); setError('');
    onSave({ ...group, name: name.trim(), ...(roleMode ? { description: undefined, manager: '' } : { manager }), count: draft.members.length, details: normalized });
    notify(roleMode ? 'Изменения группы сохранены' : 'Изменения группы сохранены');
  }
  function resetTab() {
    if (tab === 'products') patch({ products: Object.fromEntries((roleMode ? [...productLabels, 'Диск'] : productLabels).map(p => [p, false])) });
    if (tab === 'permissions') { const baseline = groups.find(g => g.systemGroup === 'everyone'); if (baseline && baseline.id !== group.id) { const d = getDetails(baseline); patch({ multiPermissions: structuredClone(d.multiPermissions ?? {}), permissions: structuredClone(d.permissions), products: { ...d.products }, role: { ...config, adminPermissions: {} } }); notify('Разрешения Everyone скопированы в черновик. Нажмите «Сохранить».'); return; } }
    if (tab === 'permissions') patch({ multiPermissions: {}, ...(roleMode ? { role: { ...config, adminPermissions: {} }, products: Object.fromEntries([...productLabels, 'Диск'].map(p => [p, false])) } : {}), permissions: { ...structuredClone(defaultPermissions), communicationGroups: roleMode ? defaultPermissions.communicationGroups.filter(id => groups.some(g => g.id === id)) : groups.filter(g => g.id !== group.id).slice(0, 3).map(g => g.id) } });
    if (tab === 'settings') patch(roleMode ? { role: { ...config, preferences: { ...everyoneSettings, ...groups.find(g => g.systemGroup === 'everyone')?.details?.role?.preferences } } } : { settings: { ...defaultSettings } });
    notify(roleMode ? 'Значения @everyone перенесены в черновик группы. Нажмите «Сохранить», чтобы сохранить.' : 'Значения восстановлены. Нажмите «Сохранить», чтобы сохранить.');
  }
  function openLimit(type: 'event' | 'storage') { setLimitEdit(type); setLimitValue(String(type === 'event' ? draft.eventLimit : draft.storageLimit)); setLimitError(''); }
  function saveLimit() {
    const value = Number(limitValue);
    if (!limitValue.trim() || !Number.isFinite(value) || value <= 0 || (limitEdit === 'event' && !Number.isInteger(value))) { setLimitError('Введите допустимый положительный лимит.'); return; }
    if (limitEdit === 'storage' && value < draft.storageUsed) { setLimitError('Лимит не может быть меньше занятого места — 6,5 ГБ.'); return; }
    patch(limitEdit === 'event' ? { eventLimit: value } : { storageLimit: value }); setLimitEdit(null);
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(inviteUrl); notify('Ссылка скопирована'); }
    catch { notify('Выделите ссылку в поле и скопируйте её вручную.'); }
  }
  function changeMembers(members: Member[]) {
    const nextManager = members.some(m => m.name === manager) ? manager : '';
    const savedManager = members.some(m => m.name === group.manager) ? group.manager : '';
    setManager(nextManager); patch({ members });
    onSave({ ...group, manager: savedManager, count: members.length, details: { ...getDetails(group), members } });
    setPage(0);
  }
  const actions = <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between" gap={1.5} sx={{ mt: 2.5 }}>
    {tab !== 'main' && !system ? <Button onClick={resetTab} sx={{ justifyContent: 'flex-start' }}>{roleMode ? (tab === 'permissions' ? 'Применить разрешения @everyone к этой группе' : 'Применить настройки @everyone к этой группе') : 'Сбросить до настроек по умолчанию'}</Button> : null}
  </Stack>;

  if (system && system !== 'everyone') return <>
    <Stack direction="row" gap={1.5} alignItems="center" sx={{ mb: 3 }}><IconButton aria-label="К списку групп" onClick={onBack}><ArrowBackOutlined /></IconButton><Typography variant="h4" component="h1">{group.name}</Typography><Chip size="small" color={systemInfo!.color} label={systemInfo!.caption} /></Stack>
    <Paper variant="outlined" sx={{ p: 3, maxWidth: 820 }}><Typography variant="h6" sx={{ mb: 2 }}>Системная группа</Typography><Typography>{systemInfo!.description}</Typography><Alert severity="info" sx={{ mt: 3 }}>Состав и полномочия этой системной группы не редактируются здесь. Название и положение в списке закреплены; удалить группу нельзя.</Alert></Paper>
  </>;
  return <>
    {systemInfo && <Alert severity="info" sx={{ mb: 3 }}>{systemInfo.description}</Alert>}
    {tab === 'members' && draft.synced && <Alert severity="info" sx={{ mb: 3, maxWidth: 1000, '& .MuiAlert-message': { minWidth: 0 } }}>
      <Typography variant="body2">{roleMode ? 'Группа назначается автоматически по правилам SSO. Ручные назначения сохраняются при синхронизации.' : 'Состав определяется правилами синхронизации. Участники, добавленные вручную, сохраняются'}</Typography>
      <Typography component="div" variant="caption" sx={{ mt: .5 }}>Последняя синхронизация: 30 сентября 2024, 18:07. <Link component="button" variant="caption" onClick={() => setSyncOpen(true)}>Подробнее</Link></Typography>
    </Alert>}
    <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 2.5 }}>
      <Tooltip title={roleMode ? 'К списку групп' : 'К списку групп'}><IconButton aria-label={roleMode ? 'К списку групп' : 'К списку групп'} onClick={() => back()} sx={{ ml: -.75 }}><ArrowBackOutlined /></IconButton></Tooltip>
      <Typography variant="h4" component="h1">{group.name}</Typography>
    </Stack>
    <Tabs value={tab} onChange={(_, value: TabKey) => { setTab(value); setError(''); }} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile aria-label={roleMode ? 'Разделы группы' : 'Разделы группы'} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, '& .MuiTab-root': { textTransform: 'none', minWidth: 0, px: 2, fontSize: 14, fontWeight: 500 }, '& .MuiTab-root:first-of-type': { pl: 0 }, '& .MuiTabs-indicator': { height: 2 } }}>
      <Tab value="main" label="Основное" id="group-tab-main" aria-controls="group-panel-main" />
      <Tab disabled={!!system} value="members" label={system === 'everyone' ? 'Все сотрудники' : 'Сотрудники · ' + draft.members.length} id="group-tab-members" aria-controls="group-panel-members" />
      {!roleMode && <Tab value="products" label="Доступ к продуктам" id="group-tab-products" aria-controls="group-panel-products" />}
      <Tab value="permissions" label={roleMode ? 'Разрешения' : 'Права'} id="group-tab-permissions" aria-controls="group-panel-permissions" />
      <Tab value="settings" label="Настройки" id="group-tab-settings" aria-controls="group-panel-settings" />
    </Tabs>
    {error && <Alert severity="error" sx={{ maxWidth: 820, mb: 2 }}>{error}</Alert>}
    <Box role="tabpanel" id={'group-panel-' + tab} aria-labelledby={'group-tab-' + tab} sx={{ maxWidth: tab === 'members' ? 'none' : 820 }}>
      {tab === 'main' && <>
        <Stack spacing={2.5}>
          <Panel title={roleMode ? 'О группе' : 'О группе'}><Stack spacing={3}>
            <TextField label={roleMode ? 'Название группы' : 'Название группы'} fullWidth disabled={!!system} value={name} onChange={e => { setName(e.target.value); setError(''); }} inputProps={{ maxLength: 120 }} />
            {roleMode ? (system ? <Typography variant="body2" color="text.secondary">Системная группа · название и состав определяются автоматически</Typography> : <RoleType value={config} onChange={role => patch({ role })} />) : <TextField select label="Администратор группы" fullWidth value={manager} onChange={e => setManager(e.target.value)} helperText="Назначьте администратора группы из списка сотрудников для управления составом.">
              <MenuItem value="">Не назначен</MenuItem>{draft.members.map(m => <MenuItem key={m.id} value={m.name}>{m.name}</MenuItem>)}
            </TextField>}
          </Stack></Panel>
          {!roleMode && <><Panel title="Ссылка для приглашения в группу">
            <TextField label="Ссылка" value={inviteUrl} fullWidth InputProps={{ readOnly: true, endAdornment: <InputAdornment position="end"><Tooltip title="Скопировать ссылку"><IconButton aria-label="Скопировать ссылку" onClick={copyLink}><ContentCopyOutlined fontSize="small" /></IconButton></Tooltip></InputAdornment> }} inputProps={{ onFocus: (event: React.FocusEvent<HTMLInputElement>) => event.target.select() }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1.5 }}>Вы можете <Link component="button" variant="body2" onClick={() => setResetLinkOpen(true)}>сбросить ссылку</Link>, чтобы создать новую ссылку для приглашения.</Typography>
            <ToggleRow label="Защита ссылки паролем" value={draft.passwordProtected} onChange={value => patch({ passwordProtected: value })} />
            {draft.passwordProtected && <TextField label="Пароль для приглашения" type="password" fullWidth value={draft.invitePassword} onChange={e => patch({ invitePassword: e.target.value })} helperText="Минимум 6 символов" autoComplete="new-password" sx={{ mt: 1 }} />}
          </Panel>
          <Panel title="Синхронизация с продуктами МТС Линк"><Stack spacing={3}>
            <TextField select fullWidth label="Команда в МТС Линк Чаты" value={draft.chatTeam} onChange={e => patch({ chatTeam: e.target.value })}><MenuItem value="">Не назначено</MenuItem>{['Research', 'Продажи и маркетинг', 'Офис', 'Поддержка'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField>
            <TextField select fullWidth label="Команда в МТС Линк Доски" value={draft.boardTeam} onChange={e => patch({ boardTeam: e.target.value })}><MenuItem value="">Не назначено</MenuItem>{['Research', 'Продуктовая команда', 'Маркетинг'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField>
          </Stack></Panel></>}
          {roleMode ? <>
            <Panel title="Квоты"><RoleQuotas value={config} onChange={role => patch({ role })} /></Panel>
            <Panel title="Просмотр от имени группы"><RolePreview name={name} value={config} products={draft.products} permissions={{ ...draft.permissions, communication: communicationState === 'allow' ? draft.permissions.communication : 'none' }} /></Panel>
          </> : <>
          <Panel title="Места на мероприятии" action={<Button size="small" onClick={() => openLimit('event')}>Изменить</Button>}><Typography variant="body2" color="text.secondary">До {draft.eventLimit} участников</Typography></Panel>
          <Panel title="Файлы" action={<Button size="small" onClick={() => openLimit('storage')}>Изменить</Button>}>
            <LinearProgress aria-label="Использовано хранилище" variant="determinate" value={usedPercent} color="success" sx={{ height: 5, borderRadius: 3, bgcolor: 'action.selected', mb: 2 }} />
            <Typography variant="body2" color="text.secondary">Занято {draft.storageUsed.toLocaleString('ru')} ГБ ({usedPercent}%) из выделенных {draft.storageLimit.toLocaleString('ru')} ГБ</Typography>
          </Panel>
          </>}
        </Stack>{actions}
        <Button disabled={!!system} color="error" onClick={() => setDeleteOpen(true)} sx={{ mt: 3, ml: -1 }}>{roleMode ? 'Удалить группу' : 'Удалить группу'}</Button>
      </>}
      {tab === 'members' && <>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Изменения состава сотрудников сохраняются сразу.</Typography>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} sx={{ mb: 2.5 }}>
          <TextField placeholder="Поиск" value={memberSearch} onChange={e => { setMemberSearch(e.target.value); setPage(0); }} inputProps={{ 'aria-label': roleMode ? 'Поиск сотрудников' : 'Поиск сотрудников' }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment> }} sx={{ width: { xs: '100%', sm: 350 }, bgcolor: 'background.paper' }} />
          <Tooltip title={roleMode ? 'Добавить сотрудников организации в группу' : draft.synced ? 'Состав группы управляется синхронизацией' : 'Добавить сотрудников'}><span><Button disabled={!roleMode && draft.synced} variant="contained" startIcon={<AddOutlined />} onClick={() => { setSelectedMembers([]); setAddMembersOpen(true); }}>{roleMode ? 'Добавить в группу' : 'Добавить'}</Button></span></Tooltip>
        </Stack>
        <TableContainer component={Paper} variant="outlined"><Table aria-label={roleMode ? 'Сотрудники группы' : 'Сотрудники группы'} sx={{ tableLayout: 'fixed' }}>
          <TableHead sx={{ bgcolor: 'background.default' }}><TableRow><TableCell sx={{ width: { xs: '82%', sm: '55%' } }}>Сотрудник</TableCell><TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Должность</TableCell><TableCell sx={{ width: 56 }}><Box component="span" sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>Действия</Box></TableCell></TableRow></TableHead>
          <TableBody>{filteredMembers.slice(page * 10, page * 10 + 10).map(member => <TableRow key={member.id} hover>
            <TableCell sx={{ py: 1.75 }}><Stack direction="row" alignItems="center" gap={1.5}>
              <Avatar sx={{ width: 34, height: 34, fontSize: 12, bgcolor: 'action.selected', color: 'text.secondary' }}>{member.name.split(' ').map(s => s[0]).slice(0, 2).join('')}</Avatar>
              <Box sx={{ minWidth: 0 }}><Stack direction="row" alignItems="center" gap={.75}><Typography variant="body2" sx={{ fontWeight: 500 }}>{member.name}</Typography>
                {member.orgAdmin && <Tooltip title="Администратор организации"><StarRounded aria-label="Администратор организации" sx={{ color: 'warning.main', fontSize: 18 }} /></Tooltip>}
                {!roleMode && member.name === group.manager && <Tooltip title="Администратор группы"><FlagRounded aria-label="Администратор группы" sx={{ color: 'success.main', fontSize: 17 }} /></Tooltip>}
              </Stack><Typography variant="caption" component="div" color="text.secondary" sx={{ overflowWrap: 'anywhere', mt: .35 }}>{member.email}</Typography><Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'block', sm: 'none' }, mt: .25 }}>{member.position}</Typography></Box>
            </Stack></TableCell>
            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{member.position}</TableCell>
            <TableCell align="right"><IconButton size="small" aria-label={'Действия: ' + member.name} onClick={e => setMemberMenu({ element: e.currentTarget, member })}><MoreVertOutlined fontSize="small" /></IconButton></TableCell>
          </TableRow>)}{!filteredMembers.length && <TableRow><TableCell colSpan={3} sx={{ py: 5, textAlign: 'center' }}><Typography variant="body2" color="text.secondary">{roleMode ? (memberSearch ? 'Сотрудники не найдены' : 'Группа пока никому не назначена') : memberSearch ? 'Сотрудники не найдены' : 'В группе пока нет сотрудников'}</Typography></TableCell></TableRow>}</TableBody>
        </Table></TableContainer>
        {filteredMembers.length > 10 && <TablePagination component="div" count={filteredMembers.length} page={page} rowsPerPage={10} rowsPerPageOptions={[10]} onPageChange={(_, next) => setPage(next)} labelDisplayedRows={({ from, to, count }) => `${from}–${to} из ${count}`} />}
      </>}
      {tab === 'products' && <><Panel title="Продукты">{(roleMode ? [...productLabels, 'Диск'] : productLabels).map(product => <ToggleRow key={product} label={product} value={!!draft.products[product]} onChange={value => patch({ products: { ...draft.products, [product]: value } })} />)}</Panel>{actions}</>}
      {tab === 'permissions' && roleMode && <><Panel title="Разрешения"><RoleRights states={draft.multiPermissions} onState={changeState} systemDefault={!!system} products={draft.products} onProduct={(name, enabled) => patch({ products: { ...draft.products, [name]: enabled } })} permissions={draft.permissions} onPermission={permission} value={config} onChange={role => patch({ role })} communication={<>
          <SettingRow label="Общение с сотрудниками" description="Личные чаты и звонки"><PermissionControl label="Общение с сотрудниками" value={communicationState} onChange={state => { changeState('communication', state); if (state === 'allow' && draft.permissions.communication === 'none') permission('communication', 'all'); }} /></SettingRow>
          {communicationState === 'allow' && <SettingRow label="Область общения"><TextField select value={draft.permissions.communication === 'none' ? 'all' : draft.permissions.communication} onChange={e => permission('communication', e.target.value as Permissions['communication'])} slotProps={{ select: { inputProps: { 'aria-label': 'Область общения' } } }} sx={{ width: 205 }}><MenuItem value="all">Все сотрудники</MenuItem><MenuItem value="groups">Выбранные группы</MenuItem></TextField></SettingRow>}
          {communicationState === 'allow' && draft.permissions.communication === 'groups' && <SettingRow label={`Выбрано групп: ${visibleCommunicationGroups.length}`}><Button size="small" onClick={() => { setSelectedGroups(visibleCommunicationGroups); setGroupSelect(true); }}>Изменить</Button></SettingRow>}
      </>} /></Panel>{actions}</>}
      {tab === 'permissions' && !roleMode && <><Panel title="Разрешения">
        <Section title="Доступ и данные организации" first>
          <ToggleRow label="Возможность загружать файлы с компьютера" description="На мероприятиях и в чатах" value={draft.permissions.upload} onChange={v => permission('upload', v)} />
          <ToggleRow label="Доступ ко всем файлам организации" description="Просмотр" value={draft.permissions.allFiles} onChange={v => permission('allFiles', v)} />
          <ToggleRow label="Доступ ко всем контактам организации" description="Просмотр" value={draft.permissions.allContacts} onChange={v => permission('allContacts', v)} />
        </Section>
        <Section title="Общение и совместная работа">
          <ToggleRow label="Приглашение участников-гостей в каналы и чаты" description="Разрешает добавлять в чаты и каналы участников, не состоящих в организации" value={draft.permissions.inviteGuests} onChange={v => permission('inviteGuests', v)} />
          <ToggleRow label="Создание групповых чатов" description="Разрешает создавать групповые чаты и добавлять в них участников" value={draft.permissions.createChats} onChange={v => permission('createChats', v)} />
          <ToggleRow label="Создание каналов" description="Разрешает создавать новые каналы в организации" value={draft.permissions.createChannels} onChange={v => permission('createChannels', v)} />
          <SettingRow label="Общение с сотрудниками" description="Разрешает напрямую связываться с другими участниками организации в личных чатах и звонках">
            <TextField select value={draft.permissions.communication} onChange={e => permission('communication', e.target.value as Permissions['communication'])} slotProps={{ select: { inputProps: { 'aria-label': 'Общение с сотрудниками' } } }} sx={{ width: 205 }}><MenuItem value="all">Все сотрудники</MenuItem><MenuItem value="groups">{roleMode ? 'Выбранные группы' : 'Выбранные группы'}</MenuItem><MenuItem value="none">Запрещено</MenuItem></TextField>
          </SettingRow>
          {draft.permissions.communication === 'groups' && <SettingRow label={roleMode ? `Выбрано групп: ${visibleCommunicationGroups.length}` : `Выбрано: ${visibleCommunicationGroups.length} ${pluralGroups(visibleCommunicationGroups.length)}`} description={roleMode ? 'Разрешает общение с сотрудниками выбранных групп' : 'Разрешает общение с участниками выбранных групп'}><Button size="small" onClick={() => { setSelectedGroups(visibleCommunicationGroups); setGroupSelect(true); }}>Изменить</Button></SettingRow>}
        </Section>
        <Section title="Встречи и мероприятия">
          <ToggleRow label="Возможность удаления сотрудником своих мероприятий" value={draft.permissions.deleteOwnEvents} onChange={v => permission('deleteOwnEvents', v)} />
          <ToggleRow label="Просмотр всех мероприятий организации" description="Сотрудники смогут просматривать все мероприятия, созданные другими участниками организации" value={draft.permissions.viewAllEvents} onChange={v => permission('viewAllEvents', v)} />
          <ToggleRow label="Редактирование всех мероприятий организации" description="Сотрудникам будет доступна возможность проводить мероприятия других участников организации" value={draft.permissions.editAllEvents} onChange={v => permission('editAllEvents', v)} />
        </Section>
        <Section title="Курсы"><ToggleRow label="Возможность создавать курсы" value={draft.permissions.createCourses} onChange={v => permission('createCourses', v)} /></Section>
      </Panel>{actions}</>}
      {tab === 'settings' && roleMode && <><Panel title="Настройки"><RoleSettings value={config} onChange={role => patch({ role })} /></Panel>{actions}</>}
      {tab === 'settings' && !roleMode && <><Panel title="Настройки">
        <Section title="Запись мероприятия" first>
          <ToggleRow label="Запускать запись при старте мероприятия" description="Запись начнётся автоматически после запуска мероприятия" value={draft.settings.autoRecord} onChange={v => setting('autoRecord', v)} />
          <ToggleRow label="Запускать текстовую расшифровку при старте мероприятия" description="Создавать текстовую расшифровку выступлений участников" value={draft.settings.autoTranscript} onChange={v => setting('autoTranscript', v)} />
          <SettingRow label="Доступ к записи мероприятия" description="Кто сможет просматривать запись по умолчанию"><TextField select value={draft.settings.recordingAccess} onChange={e => setting('recordingAccess', e.target.value as Settings['recordingAccess'])} slotProps={{ select: { inputProps: { 'aria-label': 'Доступ к записи мероприятия' } } }} sx={{ width: 205 }}><MenuItem value="self">Только у меня</MenuItem><MenuItem value="participants">Только у участников</MenuItem><MenuItem value="link">У всех по ссылке</MenuItem></TextField></SettingRow>
        </Section>
        <Section title="Подключение к встрече">
          <ToggleRow label="Включать мою камеру при подключении" description="Камера будет включена при входе на встречу" value={draft.settings.camera} onChange={v => setting('camera', v)} />
          <ToggleRow label="Включать мой микрофон при подключении" description="Микрофон будет включён при входе на встречу" value={draft.settings.microphone} onChange={v => setting('microphone', v)} />
        </Section>
      </Panel>{actions}</>}
    </Box>

    <UnsavedChangesBar visible={dirty && tab !== 'members'} attention={saveAttention} onSave={apply} onCancel={cancelChanges} />

    <Dialog open={limitEdit !== null} onClose={() => setLimitEdit(null)} fullWidth maxWidth="xs"><DialogTitle>{limitEdit === 'event' ? 'Места на мероприятии' : 'Лимит хранения файлов'}</DialogTitle><DialogContent sx={{ pt: '12px !important' }}><TextField autoFocus fullWidth type="number" label={limitEdit === 'event' ? 'Количество участников' : 'Объём хранилища, ГБ'} value={limitValue} onChange={e => { setLimitValue(e.target.value); setLimitError(''); }} error={!!limitError} helperText={limitError || (roleMode ? 'Лимит сохранится после применения изменений группы.' : 'Лимит сохранится после применения изменений группы.')} inputProps={{ min: limitEdit === 'event' ? 1 : draft.storageUsed, step: limitEdit === 'event' ? 1 : .5 }} /></DialogContent><DialogActions sx={{ p: 2 }}><Button onClick={() => setLimitEdit(null)}>Отмена</Button><Button variant="contained" onClick={saveLimit}>Готово</Button></DialogActions></Dialog>
    <Dialog open={groupSelect} onClose={() => setGroupSelect(false)} fullWidth maxWidth="sm"><DialogTitle>{roleMode ? 'Группы для общения' : 'Группы для общения'}</DialogTitle><DialogContent dividers><Stack>{groups.map(g => <FormControlLabel key={g.id} label={g.name} control={<Checkbox checked={selectedGroups.includes(g.id)} onChange={e => setSelectedGroups(current => e.target.checked ? [...current, g.id] : current.filter(id => id !== g.id))} />} />)}</Stack></DialogContent><DialogActions sx={{ p: 2 }}><Button onClick={() => setGroupSelect(false)}>Отмена</Button><Button variant="contained" disabled={!selectedGroups.length} onClick={() => { permission('communicationGroups', selectedGroups); setGroupSelect(false); }}>Выбрать</Button></DialogActions></Dialog>

    <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} fullWidth maxWidth="xs"><DialogTitle>{roleMode ? 'Удалить группу' : 'Удалить группу'} «{group.name}»?</DialogTitle><DialogContent><Typography variant="body2" color="text.secondary">{roleMode ? `Группа будет снята у ${draft.members.length} сотрудников. Они потеряют права, предоставляемые этой группой. Сотрудники останутся в организации; другие назначенные группы сохранятся.` : 'Группа будет удалена из списка. Сотрудники останутся в организации.'}</Typography></DialogContent><DialogActions sx={{ p: 2 }}><Button onClick={() => setDeleteOpen(false)}>Отмена</Button><Button color="error" variant="contained" onClick={() => { onDelete(group.id); notify(roleMode ? 'Группа удалена' : 'Группа удалена'); }}>Удалить</Button></DialogActions></Dialog>
    <Dialog open={resetLinkOpen} onClose={() => setResetLinkOpen(false)} fullWidth maxWidth="xs"><DialogTitle>Создать новую ссылку?</DialogTitle><DialogContent><Typography variant="body2" color="text.secondary">После применения изменений предыдущая ссылка перестанет действовать.</Typography></DialogContent><DialogActions sx={{ p: 2 }}><Button onClick={() => setResetLinkOpen(false)}>Отмена</Button><Button onClick={() => { patch({ inviteToken: newToken() }); setResetLinkOpen(false); }}>Создать</Button></DialogActions></Dialog>
    <Dialog open={syncOpen} onClose={() => setSyncOpen(false)} fullWidth maxWidth="sm"><DialogTitle>{roleMode ? 'Назначение группы через SSO' : 'Синхронизация состава группы'}</DialogTitle><DialogContent dividers><Typography variant="body2">{roleMode ? 'Автоматические назначения обновляются по правилам SSO. Чтобы снять автоматически назначенную группу, измените правило в SSO. Ручные назначения сохраняются при синхронизации.' : 'Участники с внешним управлением добавляются и обновляются по правилам SSO. Участники, добавленные вручную, сохраняются при следующей синхронизации.'}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Последняя синхронизация: 30 сентября 2024, 18:07.</Typography></DialogContent><DialogActions sx={{ p: 2 }}><Button onClick={() => setSyncOpen(false)}>Понятно</Button></DialogActions></Dialog>
    <Menu anchorEl={memberMenu?.element} open={!!memberMenu} onClose={() => setMemberMenu(null)}><Box sx={{ px: 2, py: 1 }}><Typography variant="caption" color="text.secondary">{roleMode ? (memberMenu?.member.source === 'sso' ? 'Группа назначена через SSO' : 'Группа назначена вручную') : memberMenu?.member.source === 'sso' ? 'Участник синхронизирован с SSO' : 'Участник добавлен вручную'}</Typography></Box><Divider /><MenuItem disabled={memberMenu?.member.source === 'sso'} onClick={() => { setRemoveMember(memberMenu!.member); setMemberMenu(null); }} sx={{ color: 'error.main' }}>{roleMode ? 'Удалить из группы' : 'Удалить из группы'}</MenuItem></Menu>
    <Dialog open={!!removeMember} onClose={() => setRemoveMember(null)} fullWidth maxWidth="xs"><DialogTitle>{roleMode ? 'Удалить сотрудника из группы?' : 'Удалить сотрудника из группы?'}</DialogTitle><DialogContent><Typography variant="body2">{removeMember?.name} останется в организации.{roleMode && ' Доступы, предоставляемые этой группой, будут сняты; другие назначенные группы сохранятся.'}</Typography></DialogContent><DialogActions sx={{ p: 2 }}><Button onClick={() => setRemoveMember(null)}>Отмена</Button><Button color="error" onClick={() => { changeMembers(draft.members.filter(m => m.id !== removeMember!.id)); setRemoveMember(null); notify(roleMode ? 'Сотрудник удалён из группы' : 'Сотрудник удалён из группы'); }}>{roleMode ? 'Удалить из группы' : 'Удалить'}</Button></DialogActions></Dialog>
    <Dialog open={addMembersOpen} onClose={() => setAddMembersOpen(false)} fullWidth maxWidth="sm"><DialogTitle>{roleMode ? 'Добавить в группу «' + group.name + '»' : 'Добавить сотрудников'}</DialogTitle><DialogContent dividers><Stack>{directory.map(m => <FormControlLabel key={m.id} control={<Checkbox checked={selectedMembers.includes(m.id)} onChange={e => setSelectedMembers(current => e.target.checked ? [...current, m.id] : current.filter(id => id !== m.id))} />} label={<Box sx={{ py: .5 }}><Typography variant="body2">{m.name}</Typography><Typography variant="caption" color="text.secondary">{m.email}</Typography></Box>} />)}{!directory.length && <Typography variant="body2" color="text.secondary">{roleMode ? 'Группа уже назначена всем доступным сотрудникам.' : 'Все доступные сотрудники уже состоят в группе.'}</Typography>}</Stack></DialogContent><DialogActions sx={{ p: 2 }}><Button onClick={() => setAddMembersOpen(false)}>Отмена</Button><Button variant="contained" disabled={!selectedMembers.length} onClick={() => { changeMembers([...draft.members, ...directory.filter(m => selectedMembers.includes(m.id)).map(m => ({ ...m, source: 'manual' as const }))]); setAddMembersOpen(false); notify(roleMode ? 'Группа назначена сотрудникам' : 'Сотрудники добавлены'); }}>{roleMode ? 'Добавить в группу' : 'Добавить'}</Button></DialogActions></Dialog>
  </>;
}
