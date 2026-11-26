import { ModeVisibility } from './app/ModeVisibility';
import OnPremAdmin from './on-prem/OnPremAdmin';
import ModeSwitch from './app/ModeSwitch';
import { useAdminRoute } from './app/useAdminRoute';
import { rememberedRoute, routePath, storedValue, onPremLabels, type AdminRoute, type CloudSection, type GroupDefaultsTab, type OnPremSection } from './app/routes';
import EmployeesSection from './EmployeesSection';
import OrganizationSection from './OrganizationSection';
import SecuritySection, { SECURITY_STORAGE, createSecurityState, loadSecurityState } from './SecuritySection';
import FederationsSection from './FederationsSection';
import { OrganizationIdentity } from './app/OrganizationIdentity';
import { ORGANIZATION_STORAGE, createOrganizationState, loadOrganizationState } from './organization-model';
import { EMPLOYEE_STORAGE, createEmployeeDatabase, loadEmployeeDatabase } from './employee-data';
import SectionScenariosMenu from './SectionScenariosMenu';
import ApiSection from './ApiSection';
import { API_STORAGE, initialApiState, loadApiState } from './api-model';
import { makeRoleDemo, roleExample, exampleRole, type RoleDemo } from './role-scenarios';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, AppBar, Avatar, Box, Button, ButtonBase, Chip, CssBaseline, Dialog,
  DialogActions, DialogContent, DialogTitle, Divider, Drawer, IconButton, InputAdornment,
  List, ListItemButton, ListItemIcon, ListItemText, Menu, MenuItem, Paper, Snackbar,
  Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, ThemeProvider, Toolbar, Tooltip, Typography, useMediaQuery,
} from '@mui/material';
import {
  AddOutlined, AdminPanelSettingsOutlined, ArrowForwardOutlined,
  CheckOutlined, ChevronRightOutlined, CloseOutlined,
  DarkModeOutlined, FlagOutlined, GroupsOutlined, LightModeOutlined, MenuOutlined,
  PersonAddAltOutlined, PersonOutlineOutlined, ReplayOutlined, SearchOutlined,
  ShieldOutlined, StarRounded,
} from '@mui/icons-material';
import { initialGroups, navigation, type Group } from './data';
import { makeTheme } from './theme';
import GroupPage from './GroupPage';
import MultiGroupPage from './MultiGroupPage';
import { ensureSystemGroups, systemGroups } from './multi-model';
import { roleConfig } from './role-model';
import { hydrateGroup, newToken } from './group-model';

const DATA_KEY = 'mts-link-groups-prototype-v1';
const MULTI_KEY = 'mts-link-groups-prototype-v2';
const ROLE_KEY = 'mts-link-roles-prototype-v1';
const sectionNames = { 1: 'Группы (сейчас)', 2: 'Группы (мульти)', 3: 'Роли' } as const;
const VERSION_KEY = 'mts-link-groups-active-version';
function roleSeed(source: Group[]): Group[] {
  return structuredClone(source).filter(g => !g.systemGroup).map(g => ({ ...g, manager: '', description: undefined }));
}
const THEME_KEY = 'mts-link-groups-theme-ash-v1';
function storedGroups(key = DATA_KEY, fallback = initialGroups): Group[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    if (Array.isArray(value) && value.every(g => typeof g.id === 'string' && typeof g.name === 'string' && typeof g.manager === 'string' && Number.isInteger(g.count) && g.count >= 0 && (!g.kind || ['admin', 'system'].includes(g.kind)))) return value.map(hydrateGroup);
  } catch { /* A restricted browser still supports in-memory interaction. */ }
  return structuredClone(fallback).map(hydrateGroup);
}
function storedDark(): boolean {
  try { return localStorage.getItem(THEME_KEY) !== 'light'; } catch { return true; }
}
function Badge({ kind }: { kind?: Group['kind'] }) {
  if (!kind) return null;
  return <Chip size="small" variant="outlined" icon={kind === 'admin' ? <StarRounded /> : undefined}
    label={kind === 'admin' ? 'Админ организации' : 'Системная'}
    sx={{ color: 'text.secondary', borderColor: 'divider', '& .MuiChip-icon': { fontSize: 15, color: 'text.secondary' } }} />;
}
function DialogHeading({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) {
  return <DialogTitle sx={{ p: 3, pr: 7 }}>
    {subtitle && <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: .75 }}>{subtitle}</Typography>}
    <Typography component="span" variant="h6">{title}</Typography>
    <IconButton aria-label="Закрыть" onClick={onClose} sx={{ position: 'absolute', right: 16, top: 18 }}><CloseOutlined fontSize="small" /></IconButton>
  </DialogTitle>;
}

function cloudWorkspace(section: CloudSection): Exclude<CloudSection, 'multi-groups' | 'roles'> {
  return section === 'federations' || section === 'organization' || section === 'api' || section === 'employees' || section === 'security' ? section : 'groups';
}

export default function App() {
  const { route, navigate } = useAdminRoute(next => {
    // Mode changes retain mounted drafts. Leaving a Cloud detail still uses its existing guard.
    if (next.mode === 'on-prem' || (!selectedGroup && !organizationMode && !securityMode) || routePath(next) === lastCloudPath.current) return true;
    const currentSection = version === 3 ? 'roles' : version === 2 ? 'multi-groups' : 'groups';
    if (selectedGroup && next.section === currentSection && next.id === selectedId) return true;
    let allowed = !leaveRef.current;
    leaveRef.current?.(() => { allowed = true; });
    return allowed;
  });
  const onPrem = route.mode === 'on-prem';
  const [initialCloud] = useState(() => route.mode === 'cloud' ? route : rememberedRoute('cloud') as Extract<AdminRoute, { mode: 'cloud' }>);
  const lastCloudPath = useRef(routePath(initialCloud));
  const [dark, setDark] = useState(storedDark);
  const theme = useMemo(() => makeTheme(dark), [dark]);
  const mobile = useMediaQuery(theme.breakpoints.down('md'));
  const phone = useMediaQuery(theme.breakpoints.down('sm'));
  const [version, setVersion] = useState<1 | 2 | 3>(() => initialCloud.section === 'roles' ? 3 : initialCloud.section === 'multi-groups' ? 2 : initialCloud.section === 'groups' ? 1 : storedValue(VERSION_KEY) === '3' ? 3 : storedValue(VERSION_KEY) === '2' ? 2 : 1);
  const [activeSection, setActiveSection] = useState(() => cloudWorkspace(initialCloud.section));
  const federationsMode = activeSection === 'federations';
  const organizationMode = activeSection === 'organization';
  const securityMode = activeSection === 'security';
  const [security, setSecurity] = useState(loadSecurityState);
  const [securityRevision, setSecurityRevision] = useState(0);
  useEffect(() => {
    try { localStorage.setItem(SECURITY_STORAGE, JSON.stringify(security)); } catch { /* Retain the in-memory working copy. */ }
  }, [security]);
  const groupMode = activeSection === 'groups';
  const [organization, setOrganization] = useState(loadOrganizationState);
  const [organizationRevision, setOrganizationRevision] = useState(0);
  useEffect(() => {
    try { localStorage.setItem(ORGANIZATION_STORAGE, JSON.stringify(organization)); } catch { /* Retain the in-memory working copy. */ }
  }, [organization]);
  const apiMode = activeSection === 'api';
  const employeeMode = activeSection === 'employees';
  const [employeeDatabase, setEmployeeDatabase] = useState(loadEmployeeDatabase);
  useEffect(() => { try { localStorage.setItem(EMPLOYEE_STORAGE, JSON.stringify(employeeDatabase)); } catch {} }, [employeeDatabase]);
  const [apiState, setApiState] = useState(loadApiState);
  const roleMode = groupMode && version === 3;
  const advancedMode = version !== 1;
  const DetailPage = version === 2 ? MultiGroupPage : GroupPage;
  const [originalGroups, setOriginalGroups] = useState<Group[]>(() => storedGroups());
  const [multiGroups, setMultiGroups] = useState<Group[]>(() => ensureSystemGroups(storedGroups(MULTI_KEY, roleSeed(storedGroups()))));
  const [roles, setRoles] = useState<Group[]>(() => storedGroups(ROLE_KEY, roleSeed(storedGroups(MULTI_KEY, roleSeed(storedGroups())))));
  const [roleDemo, setRoleDemo] = useState<RoleDemo | null>(null);
  const [scenarioRevision, setScenarioRevision] = useState(0);
  const setDemoRoles: typeof setRoles = update => setRoleDemo(previous => previous ? { ...previous, roles: typeof update === 'function' ? update(previous.roles) : update } : previous);
  const groups = roleMode ? roleDemo?.roles ?? roles : version === 2 ? multiGroups : originalGroups;
  const setGroups = roleMode ? roleDemo ? setDemoRoles : setRoles : version === 2 ? setMultiGroups : setOriginalGroups;
  const [mobileNav, setMobileNav] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(initialCloud.id ?? null);
  const [groupDefaultsTab, setGroupDefaultsTab] = useState(initialCloud.groupTab);
  const selectedGroup = groupMode ? groups.find(g => g.id === selectedId) : undefined;
  const leaveRef = useRef<((after?: () => void) => void) | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [edit, setEdit] = useState<Group | 'new' | null>(null);
  const [name, setName] = useState('');
  const [manager, setManager] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [defaultsOpen, setDefaultsOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [profileAnchor, setProfileAnchor] = useState<HTMLElement | null>(null);
  useEffect(() => { setProfileAnchor(null); }, [onPrem]);
  useEffect(() => { try { localStorage.setItem(API_STORAGE, JSON.stringify(apiState)); } catch {} }, [apiState]);
  useEffect(() => { try { localStorage.setItem('mts-link-admin-active-section', activeSection); } catch {} }, [activeSection]);

  useEffect(() => { try { localStorage.setItem(DATA_KEY, JSON.stringify(originalGroups)); } catch { /* Keep changes in memory. */ } }, [originalGroups]);
  useEffect(() => { try { localStorage.setItem(MULTI_KEY, JSON.stringify(multiGroups)); } catch {} }, [multiGroups]);
  useEffect(() => { try { localStorage.setItem(ROLE_KEY, JSON.stringify(roles)); } catch {} }, [roles]);
  useEffect(() => { try { localStorage.setItem(VERSION_KEY, String(version)); } catch {} }, [version]);
  useEffect(() => { try { localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light'); } catch { /* Theme remains usable. */ } }, [dark]);
  useEffect(() => {
    if (route.mode !== 'cloud' || routePath(route) === lastCloudPath.current) return;
    lastCloudPath.current = routePath(route);
    setActiveSection(cloudWorkspace(route.section));
    if (['groups', 'multi-groups', 'roles'].includes(route.section)) setVersion(route.section === 'roles' ? 3 : route.section === 'multi-groups' ? 2 : 1);
    setSelectedId(route.id ?? null);
    setGroupDefaultsTab(route.groupTab);
    setQuery(''); setSearchOpen(false); setMobileNav(false);
  }, [route]);
  const cloudSection: CloudSection = groupMode ? version === 3 ? 'roles' : version === 2 ? 'multi-groups' : 'groups' : activeSection;
  const cloudList = () => {
    const next: AdminRoute = { mode: 'cloud', section: cloudSection };
    if (routePath(next) === routePath(route)) {
      const close = () => { setSelectedId(null); window.scrollTo(0, 0); };
      if (selectedGroup && leaveRef.current) leaveRef.current(close); else close();
    } else navigate(next);
  };
  const filtered = (version === 2 ? ensureSystemGroups(groups) : groups).filter(g => (g.name + ' ' + (advancedMode ? '' : g.manager)).toLocaleLowerCase('ru').includes(query.trim().toLocaleLowerCase('ru')));
  const duplicate = groups.some(g => g.id !== (edit && edit !== 'new' ? edit.id : '') && g.name.trim().toLocaleLowerCase('ru') === name.trim().toLocaleLowerCase('ru'));
  const nameError = !name.trim() ? (roleMode ? 'Введите название роли' : 'Введите название группы') : duplicate ? (roleMode ? 'Роль с таким названием уже существует' : 'Группа с таким названием уже существует') : '';
  const dirty = edit !== null && (name !== (edit === 'new' ? '' : edit.name) || manager !== (edit === 'new' ? '' : edit.manager));

  function openGroup(group: Group | 'new') {
    if (group !== 'new') { navigate({ mode: 'cloud', section: cloudSection, id: group.id }); return; }
    setEdit('new'); setName(''); setManager(''); setSubmitted(false);
  }
  function closeGroup() { if (dirty) setDiscardOpen(true); else setEdit(null); }
  function saveGroup() {
    setSubmitted(true);
    if (nameError || !edit) return;
    if (edit === 'new') {
      const created = roleMode ? exampleRole(newToken(), name.trim()) : hydrateGroup({ id: newToken(), name: name.trim(), manager: '', count: 0 });
      setGroups(previous => [...previous, created]);
      navigate({ mode: 'cloud', section: cloudSection, id: created.id });
      setNotice((roleMode ? 'Роль «' : 'Группа «') + name.trim() + '» создана');
    } else {
      setGroups(previous => previous.map(g => g.id === edit.id ? { ...g, name: name.trim(), manager } : g));
      setNotice('Изменения сохранены');
    }
    setEdit(null);
  }
  function switchVersion(next: 1 | 2 | 3) {
    navigate({ mode: 'cloud', section: next === 3 ? 'roles' : next === 2 ? 'multi-groups' : 'groups' });
  }
  function selectRoleScenario(id: string) {
    const navigate = () => {
      const demo = id === 'restore' ? null : makeRoleDemo(id);
      setRoleDemo(demo); setScenarioRevision(n => n + 1);
      setSelectedId(demo?.card ? roleExample(demo.card).id : null);
      setQuery(id === 'no-results' ? 'Несуществующая роль' : '');
      setSearchOpen(id === 'no-results'); setEdit(null); window.scrollTo(0, 0);
    };
    if (selectedGroup) leaveRef.current?.(navigate); else navigate();
  }
  function openGroupDefaults(groupTab: GroupDefaultsTab) {
    const group = multiGroups.find(group => group.systemGroup === 'everyone');
    if (group) navigate({ mode: 'cloud', section: 'multi-groups', id: group.id, groupTab });
  }
  function openSection(next: 'api' | 'employees' | 'organization' | 'federations' | 'security') { navigate({ mode: 'cloud', section: next }); }
  const activeMenu = onPrem ? onPremLabels[route.section] : federationsMode ? 'Федерации' : organizationMode ? 'Организация' : securityMode ? 'Безопасность' : employeeMode ? 'Сотрудники' : apiMode ? 'API и вебхуки' : sectionNames[version];
  useEffect(() => { document.title = activeMenu + ' · МТС Линк Бизнес'; }, [activeMenu]);
  function sectionNotice(section: string) { setNotice('Раздел «' + section + '» пока не представлен.'); }


  const sidebar = <Box component="nav" aria-label="Разделы админ-панели" sx={{ py: 3 }}>
    {(onPrem ? [{ label: 'Серверное администрирование', items: Object.values(onPremLabels) }] : navigation).map((section, i) => <Box key={section.label}>
      {i > 0 && <Divider sx={{ ml: 3, mr: 0, my: 1 }} />}
      <Typography component="div" sx={{ px: 3, pt: i === 0 ? 2 : 1, pb: 1, color: 'text.secondary', fontSize: 14, lineHeight: '20px', fontWeight: 500, letterSpacing: '.1px', overflowWrap: 'anywhere' }}>{!onPrem && i === 0 ? organization.overview.name : section.label}</Typography>
      <List disablePadding>
        {section.items.flatMap(item => item === 'Группы' ? Object.values(sectionNames) : [item]).map(item => <ListItemButton key={item} selected={item === activeMenu} aria-current={item === activeMenu ? 'page' : undefined}
          onClick={() => { setMobileNav(false); if (onPrem) { const section = (Object.keys(onPremLabels) as OnPremSection[]).find(key => onPremLabels[key] === item)!; navigate({ mode: 'on-prem', section, ...(section === 'network' ? { tab: 'ip' as const } : {}) }); } else if (item === sectionNames[1]) switchVersion(1); else if (item === sectionNames[2]) switchVersion(2); else if (item === sectionNames[3]) switchVersion(3); else if (item === 'API и вебхуки') openSection('api'); else if (item === 'Сотрудники') openSection('employees'); else if (item === 'Организация') openSection('organization'); else if (item === 'Федерации') openSection('federations'); else if (item === 'Безопасность') openSection('security'); else sectionNotice(item); }}
          sx={{ minHeight: 40, height: 40, py: .5, pl: 3, pr: item === 'Сотрудники' ? 2 : 3, my: 0, '@media(pointer:coarse)': { minHeight: 44, height: 44 }, borderRadius: 0, color: 'text.primary', '&.Mui-selected': { bgcolor: 'action.selected', '&:hover': { bgcolor: 'action.selected' } } }}>
          <ListItemText primary={item} sx={{ my: 0 }} primaryTypographyProps={{ fontSize: 16, lineHeight: '32px', fontWeight: 400 }} />
          {item === 'Сотрудники' && <PersonAddAltOutlined sx={{ fontSize: 16, ml: 1, color: 'text.secondary' }} />}
        </ListItemButton>)}
      </List>
    </Box>)}
  </Box>;

  return <ThemeProvider theme={theme}><OrganizationIdentity.Provider value={organization.overview.name}><CssBaseline />
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
      <AppBar position="fixed" color="inherit" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ minHeight: '64px !important', px: { xs: 1, sm: 2, md: 3 }, gap: { xs: 0, sm: 2 } }}>
          {mobile && <IconButton edge="start" aria-label="Открыть меню" onClick={() => setMobileNav(true)}><MenuOutlined /></IconButton>}
          <Stack direction="row" alignItems="center" spacing={1.25} sx={{ flexShrink: 0 }}>
            <Box component="img" src="/brand/mts-mark.svg" alt="" sx={{ width: 28, height: 28 }} />
            <Box component="img" src={dark ? '/brand/mts-link.svg' : '/brand/mts-link-dark.svg'} alt="МТС Линк" sx={{ height: 29, width: 56, display: { xs: 'none', sm: 'block' } }} />
          </Stack>
          <Divider orientation="vertical" flexItem sx={{ height: 22, alignSelf: 'center', mx: { xs: 0, sm: 1 } }} />
          <Stack direction="row" alignItems="center" gap={1.5} sx={{ flex: 1 }}><Typography sx={{ fontSize: 16, fontWeight: 500, display: { xs: 'none', md: 'block' } }}>Бизнес</Typography><ModeSwitch mode={route.mode} onChange={mode => { if (mode !== route.mode) { setMobileNav(false); navigate(rememberedRoute(mode)); } }} /></Stack>
          <Button variant="outlined" size="small" onClick={() => sectionNotice('Тарифы')} sx={{ display: { xs: 'none', sm: onPrem ? 'none' : 'inline-flex' }, px: 2, mr: .5 }}>Тарифы</Button>
          <Tooltip title={dark ? 'Включить светлую тему' : 'Включить тёмную тему'}><IconButton aria-label={dark ? 'Включить светлую тему' : 'Включить тёмную тему'} onClick={() => setDark(value => !value)}>{dark ? <LightModeOutlined sx={{ fontSize: 22 }} /> : <DarkModeOutlined sx={{ fontSize: 22 }} />}</IconButton></Tooltip>
          {!onPrem && groupMode && <Tooltip title={roleMode ? 'Поиск ролей' : 'Поиск групп'}><IconButton aria-label={roleMode ? 'Поиск ролей' : 'Поиск групп'} color={searchOpen ? 'primary' : 'default'} onClick={() => { if (selectedGroup) { leaveRef.current?.(); return; } setSearchOpen(v => !v); setQuery(''); }}><SearchOutlined sx={{ fontSize: 22 }} /></IconButton></Tooltip>}
          <Tooltip title="Уведомления"><IconButton aria-label="Уведомления" sx={{ display: { xs: 'none', sm: 'inline-flex' } }} onClick={() => setNotice('Новых уведомлений нет')}><FlagOutlined sx={{ fontSize: 21 }} /></IconButton></Tooltip>
          <Box component="span" id="on-prem-scenarios" sx={{ display: onPrem ? 'inline-flex' : 'none' }} />
          {!onPrem && <SectionScenariosMenu key={activeMenu} section={activeMenu} roles={roleMode} card={!!selectedGroup} active={roleDemo?.id} onSelect={id => { if (roleMode) selectRoleScenario(id); }} />}
          <Tooltip title="Профиль и оформление"><IconButton aria-label="Профиль и оформление" aria-haspopup="menu" aria-expanded={Boolean(profileAnchor)} onClick={e => setProfileAnchor(e.currentTarget)} sx={{ p: .5, ml: { xs: 0, sm: .5 } }}><Avatar sx={{ width: 34, height: 34, bgcolor: 'action.selected', color: 'primary.main', border: 1, borderColor: 'divider' }}><PersonOutlineOutlined sx={{ fontSize: 21 }} /></Avatar></IconButton></Tooltip>
        </Toolbar>
      </AppBar>
      <Drawer variant={mobile ? 'temporary' : 'permanent'} open={!mobile || mobileNav} onClose={() => setMobileNav(false)}
        sx={{ width: { md: 240 }, flexShrink: 0, '& .MuiDrawer-paper': { width: 240, boxSizing: 'border-box', top: 64, height: 'calc(100% - 64px)', bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' } }}
        ModalProps={{ keepMounted: true }}>
        {sidebar}
      </Drawer>
      <Box component="main" sx={{ ml: { md: '240px' }, pt: '64px' }}>
        <Box sx={{ p: { xs: 2, sm: 3, md: 5 }, maxWidth: 1500, mx: 'auto' }}>
          <OnPremAdmin active={onPrem} section={route.mode === 'on-prem' ? route.section : 'certificates'} networkTab={route.mode === 'on-prem' && route.section === 'network' ? route.tab : undefined} onNetworkTabChange={tab => navigate({ mode: 'on-prem', section: 'network', tab })} notify={setNotice} />
          <ModeVisibility.Provider value={!onPrem}><Box hidden={onPrem} sx={{ display: onPrem ? 'none' : 'block' }}>
          {!onPrem && route.mode === 'cloud' && route.id && !selectedGroup && !roleDemo && <Alert severity="warning" sx={{ mb: 3 }} action={<Button color="inherit" onClick={cloudList}>К списку</Button>}>Запись не найдена. Возможно, она была удалена или демоданные были сброшены.</Alert>}
          {federationsMode ? <FederationsSection /> : organizationMode ? <OrganizationSection key={organizationRevision} state={organization} setState={setOrganization}
            employees={employeeDatabase.employees} notify={setNotice} leaveRef={leaveRef} onOpenGroupDefaults={openGroupDefaults} /> : securityMode ?
            <SecuritySection key={securityRevision} state={security} onSave={setSecurity} notify={setNotice} leaveRef={leaveRef} /> : employeeMode ? <EmployeesSection database={employeeDatabase} setDatabase={setEmployeeDatabase} notify={setNotice} /> : apiMode ? <ApiSection state={apiState} setState={setApiState} notify={setNotice} query={query} setQuery={setQuery} /> : <>
          {roleMode && roleDemo && <Alert severity="info" sx={{ mb: 3 }} action={<Button size="small" color="inherit" onClick={() => selectRoleScenario('restore')}>Вернуть исходный пример</Button>}>Сценарий: {roleDemo.label}. Изменения остаются в демонстрационном примере.</Alert>}
          {roleMode && roleDemo?.readOnly && <Alert severity="info" sx={{ mb: 3 }}>Вы можете просматривать роли. Для изменений нужно разрешение «Управление ролями и назначениями».</Alert>}
          {selectedGroup ? <DetailPage key={version + selectedGroup.id + (roleMode ? scenarioRevision : '')} readOnly={roleMode && !!roleDemo?.readOnly} scenario={roleMode && roleDemo?.card && selectedGroup.id === roleExample(roleDemo.card).id ? roleDemo.card : undefined} roleMode={advancedMode} group={selectedGroup} groups={groups} defaultTab={groupDefaultsTab}
            onSave={next => setGroups(previous => previous.map(g => g.id === next.id ? next : g))}
            onDelete={id => { setGroups(previous => previous.filter(g => g.id !== id)); setSelectedId(null); navigate({ mode: 'cloud', section: cloudSection }, false, true); }}
            onBack={cloudList} notify={setNotice} leaveRef={leaveRef}
          /> : <>
          {!advancedMode && <Paper variant="outlined" sx={{ mb: 3.5, overflow: 'hidden' }}>
            <ButtonBase onClick={() => setDefaultsOpen(true)} aria-label="Проверьте права для новых сотрудников по умолчанию" sx={{ width: '100%', p: { xs: 2, sm: 2.5 }, textAlign: 'left', justifyContent: 'flex-start', gap: 2, '&:hover': { bgcolor: 'action.hover' } }}>
              <Box sx={{ flexShrink: 0, display: { xs: 'none', sm: 'flex' }, alignItems: 'center', justifyContent: 'center', width: 40, height: 44, borderRadius: '7px', bgcolor: 'action.selected', color: 'primary.main' }}><ShieldOutlined sx={{ fontSize: 23 }} /></Box>
              <Box sx={{ flex: 1 }}><Typography variant="subtitle1" sx={{ mb: .5 }}>Проверьте права для новых сотрудников по умолчанию</Typography>
                <Typography variant="body2" color="text.secondary">Они распространяются на участников, не входящих в группы @nobs и @plebs</Typography></Box>
              <ChevronRightOutlined sx={{ color: 'text.secondary', fontSize: 23, flexShrink: 0 }} />
            </ButtonBase>
          </Paper>}
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={2} sx={{ mb: 3 }}>
            <Box sx={{ minWidth: 0 }}><Typography component="h1" variant="h4">{sectionNames[version]}</Typography>
              <Typography color="text.secondary" variant="body2" sx={{ mt: 1, maxWidth: 720 }}>{roleMode ? 'Роли определяют доступ к продуктам и разрешения пользователей. Управление — у администратора и владельца организации.' : version === 2 ? 'Сотрудник может состоять в нескольких группах. Группы определяют квоты, разрешения и настройки.' : 'Используйте группы для индивидуальных лимитов, настроек и управления пользователями'}</Typography></Box>
            <Button disabled={roleMode && !!roleDemo?.readOnly} variant="contained" startIcon={<AddOutlined />} onClick={() => openGroup('new')} sx={{ flexShrink: 0, mt: .25, px: 2, minHeight: 38 }}>{roleMode ? 'Создать роль' : 'Добавить'}</Button>
          </Stack>
          {roleMode && groups.length > 0 && groups.every(g => !!g.systemGroup) && <Alert severity="info" sx={{ mb: 3 }}>Пока нет созданных ролей. Системные роли уже доступны — создайте свою роль для нужного набора разрешений.</Alert>}
          {searchOpen && <Stack direction="row" gap={1} sx={{ mb: 2 }}>
            <TextField autoFocus fullWidth inputProps={{ 'aria-label': roleMode ? 'Поиск по ролям' : advancedMode ? 'Поиск по группам' : 'Поиск по группам и менеджерам' }} placeholder={roleMode ? 'Поиск по названию роли' : advancedMode ? 'Поиск по названию группы' : 'Поиск по названию группы или менеджеру'} value={query} onChange={e => setQuery(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment>, endAdornment: query ? <InputAdornment position="end"><IconButton aria-label="Очистить поиск" size="small" onClick={() => setQuery('')}><CloseOutlined fontSize="small" /></IconButton></InputAdornment> : undefined }}
              sx={{ bgcolor: 'background.paper' }} />
            <Tooltip title="Закрыть поиск"><IconButton aria-label="Закрыть поиск" onClick={() => { setSearchOpen(false); setQuery(''); }}><CloseOutlined fontSize="small" /></IconButton></Tooltip>
          </Stack>}
          <TableContainer component={Paper} variant="outlined" sx={{ overflow: 'hidden' }}>
            <Table aria-label={roleMode ? 'Созданные роли' : 'Созданные группы'} sx={{ tableLayout: 'fixed' }}>
              <TableHead sx={{ bgcolor: 'background.default' }}><TableRow>
                <TableCell sx={{ width: { xs: '67%', sm: advancedMode ? '84%' : '51%' }, px: { xs: 2, sm: 2.5 }, py: 1.5 }}>{roleMode ? 'Созданные роли' : version === 2 ? 'Группы' : 'Созданные группы'}</TableCell>
                {!phone && !advancedMode && <TableCell sx={{ width: '33%', py: 1.5 }}>Менеджер</TableCell>}
                <TableCell align="right" sx={{ width: { xs: '33%', sm: '16%' }, px: { xs: 2, sm: 2.5 }, py: 1.5 }}>Сотрудники</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {filtered.map(g => <TableRow key={g.id} hover sx={{ '&:last-child td': { borderBottom: 0 }, cursor: 'pointer', ...(version === 2 && g.systemGroup ? { bgcolor: 'action.hover', ...(g.systemGroup === 'everyone' ? { '& td': { borderTop: 2, borderColor: 'divider' } } : {}), ...(g.systemGroup === 'administrator' ? { '& td': { borderBottom: 2, borderColor: 'divider' } } : {}) } : {}) }} onClick={() => openGroup(g)}>
                  <TableCell sx={{ px: { xs: 2, sm: 2.5 }, py: 2.25 }}>
                    <Stack direction="row" alignItems="center" flexWrap="wrap" useFlexGap gap={1}>
                      <Box component="button" aria-label={(roleMode ? 'Открыть роль ' : 'Открыть группу ') + g.name} onClick={e => { e.stopPropagation(); openGroup(g); }} sx={{ font: 'inherit', color: 'inherit', bgcolor: 'transparent', border: 0, p: 0, textAlign: 'left', cursor: 'pointer', overflowWrap: 'anywhere', '&:hover': { color: 'primary.main' } }}>{g.name}</Box>{(version === 2 || roleMode) && g.systemGroup ? <Chip size="small" color={systemGroups[g.systemGroup].color} label={systemGroups[g.systemGroup].caption} /> : advancedMode ? <Chip size="small" variant="outlined" label={roleConfig(g).administrative ? 'Административная' : 'Пользовательская'} sx={{ color: 'text.secondary', borderColor: 'divider' }} /> : <Badge kind={g.kind} />}
                    </Stack>
                    
                    {phone && !advancedMode && <Typography variant="caption" component="div" color="text.secondary" sx={{ mt: .75 }}>{g.manager || 'Не назначен'}</Typography>}
                  </TableCell>
                  {!phone && !advancedMode && <TableCell sx={{ color: !g.manager || g.kind === 'admin' ? 'text.secondary' : 'text.primary', py: 2.25, overflowWrap: 'anywhere' }}>{g.manager || 'Не назначен'}</TableCell>}
                  <TableCell align="right" sx={{ px: { xs: 2, sm: 2.5 }, py: 2.25, fontVariantNumeric: 'tabular-nums' }}>{(version === 2 || roleMode) && g.systemGroup ? <Typography variant="caption" color="text.secondary">Автоматически</Typography> : g.count}</TableCell>
                </TableRow>)}
                {!filtered.length && <TableRow><TableCell colSpan={phone || advancedMode ? 2 : 3} sx={{ borderBottom: 0, py: 7, textAlign: 'center' }}>
                  <SearchOutlined sx={{ color: 'text.secondary', fontSize: 28, mb: 1 }} /><Typography variant="subtitle1">{roleMode ? 'Роли не найдены' : 'Группы не найдены'}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: .5, mb: 2 }}>{advancedMode ? 'Попробуйте другое название' : 'Попробуйте другое название или имя менеджера'}</Typography><Button onClick={() => setQuery('')}>Сбросить поиск</Button>
                </TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
          </>}
          </>}
          </Box></ModeVisibility.Provider>
        </Box>
      </Box>
    </Box>

    <Dialog open={!onPrem && edit !== null} onClose={closeGroup} fullWidth maxWidth="sm" fullScreen={phone} aria-labelledby="group-dialog-title">
      <DialogHeading title={roleMode ? 'Создать роль' : edit === 'new' ? 'Добавить группу' : 'Настройки группы'} subtitle={roleMode ? 'Организация / Роли' : 'Организация / Группы'} onClose={closeGroup} />
      <Box component="form" onSubmit={e => { e.preventDefault(); saveGroup(); }}>
        <DialogContent dividers sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{roleMode ? 'Укажите название. Затем назначьте роль пользователям и настройте разрешения.' : edit === 'new' ? 'Укажите название. Затем можно добавить участников и настроить группу.' : 'Основная информация о группе и ответственном менеджере.'}</Typography>
          {edit && edit !== 'new' && edit.kind && <Box sx={{ mb: 2.5 }}><Badge kind={edit.kind} /></Box>}
          <Stack spacing={3}>
            <TextField autoFocus label={roleMode ? 'Название роли' : 'Название группы'} value={name} onChange={e => setName(e.target.value)} fullWidth required error={submitted && !!nameError} helperText={submitted && nameError ? nameError : undefined} inputProps={{ maxLength: 120 }} />

          </Stack>
          {edit && edit !== 'new' && <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 3, pt: 2.5, borderTop: 1, borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" gap={1}><GroupsOutlined sx={{ color: 'text.secondary', fontSize: 19 }} /><Typography variant="body2">{roleMode ? 'Сотрудники с ролью' : 'Сотрудники в группе'}</Typography></Stack><Typography variant="subtitle1">{edit.count}</Typography>
          </Stack>}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}><Button onClick={closeGroup} color="inherit">Отмена</Button><Button variant="contained" type="submit">{roleMode ? 'Создать роль' : edit === 'new' ? 'Создать группу' : 'Сохранить'}</Button></DialogActions>
      </Box>
    </Dialog>

    <Dialog open={!onPrem && discardOpen} onClose={() => setDiscardOpen(false)} maxWidth="xs" fullWidth aria-labelledby="discard-title">
      <DialogTitle id="discard-title">Отменить изменения?</DialogTitle><DialogContent><Typography variant="body2" color="text.secondary">Введённые данные не сохранятся.</Typography></DialogContent>
      <DialogActions sx={{ p: 2 }}><Button onClick={() => setDiscardOpen(false)}>Продолжить</Button><Button color="error" onClick={() => { setDiscardOpen(false); setEdit(null); }}>Отменить изменения</Button></DialogActions>
    </Dialog>
    <Dialog open={!onPrem && defaultsOpen} onClose={() => setDefaultsOpen(false)} maxWidth="sm" fullWidth aria-labelledby="defaults-title">
      <DialogHeading title="Права новых сотрудников" subtitle="Организация / Права по умолчанию" onClose={() => setDefaultsOpen(false)} />
      <DialogContent dividers sx={{ p: 3 }}>
        <Alert icon={<AdminPanelSettingsOutlined fontSize="small" />} severity="info" sx={{ mb: 3 }}><Typography variant="body2">Права по умолчанию распространяются на участников, не входящих в группы @nobs и @plebs.</Typography></Alert>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Группы, исключённые из этого правила</Typography>
        {['nobs', 'plebs'].map(id => groups.find(g => g.id === id)).filter((g): g is Group => Boolean(g)).map(g => <ButtonBase key={g.id} onClick={() => { setDefaultsOpen(false); openGroup(g); }} sx={{ width: '100%', justifyContent: 'space-between', textAlign: 'left', py: 1.75, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap"><Typography variant="body2">{g.name}</Typography><Badge kind={g.kind} /><Typography variant="caption" color="text.secondary">@{g.id}</Typography></Stack><ArrowForwardOutlined sx={{ color: 'text.secondary', fontSize: 18 }} />
        </ButtonBase>)}
      </DialogContent><DialogActions sx={{ px: 3, py: 2 }}><Button variant="contained" onClick={() => setDefaultsOpen(false)}>Понятно</Button></DialogActions>
    </Dialog>
    <Menu anchorEl={profileAnchor} open={Boolean(profileAnchor)} onClose={() => setProfileAnchor(null)} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }} transformOrigin={{ horizontal: 'right', vertical: 'top' }} slotProps={{ paper: { sx: { width: 255, mt: 1 } } }}>
      <Box sx={{ px: 2, py: 1 }}><Typography variant="subtitle1">{onPrem ? 'Администратор сервера' : 'Администратор организации'}</Typography><Typography variant="caption" color="text.secondary">{onPrem ? 'Серверное администрирование' : organization.overview.name}</Typography></Box><Divider />
      <MenuItem onClick={() => { setDark(false); setProfileAnchor(null); }}><ListItemIcon><LightModeOutlined fontSize="small" /></ListItemIcon><ListItemText>Светлая тема</ListItemText>{!dark && <CheckOutlined fontSize="small" color="primary" />}</MenuItem>
      <MenuItem onClick={() => { setDark(true); setProfileAnchor(null); }}><ListItemIcon><DarkModeOutlined fontSize="small" /></ListItemIcon><ListItemText>Тёмная тема</ListItemText>{dark && <CheckOutlined fontSize="small" color="primary" />}</MenuItem>
      {!onPrem && !federationsMode && <Divider />}
      {!onPrem && !federationsMode && <MenuItem onClick={() => { setProfileAnchor(null); setResetOpen(true); }}><ListItemIcon><ReplayOutlined fontSize="small" /></ListItemIcon><ListItemText primary="Сбросить изменения" secondary={activeMenu} /></MenuItem>}
    </Menu>
    <Dialog open={!onPrem && !federationsMode && resetOpen} onClose={() => setResetOpen(false)} maxWidth="xs" fullWidth aria-labelledby="reset-title">
      <DialogTitle id="reset-title">{organizationMode ? 'Вернуть исходные настройки организации?' : securityMode ? 'Вернуть исходные настройки безопасности?' : employeeMode ? 'Вернуть исходную базу сотрудников?' : apiMode ? 'Вернуть исходный пример API?' : roleMode ? 'Вернуть исходные роли?' : 'Вернуть исходные группы?'}</DialogTitle><DialogContent><Typography variant="body2" color="text.secondary">Изменения текущей версии будут сброшены. Данные остальных разделов сохранятся.</Typography></DialogContent><DialogActions sx={{ p: 2 }}><Button onClick={() => setResetOpen(false)}>Отмена</Button><Button color="error" onClick={() => { if (organizationMode) {
        setOrganization(createOrganizationState()); setOrganizationRevision(value => value + 1);
        setResetOpen(false); setNotice('Исходные настройки организации восстановлены'); return;
      } if (securityMode) {
        setSecurity(createSecurityState()); setSecurityRevision(value => value + 1);
        setResetOpen(false); setNotice('Исходные настройки безопасности восстановлены'); return;
      } if (employeeMode) { setEmployeeDatabase(createEmployeeDatabase()); setResetOpen(false); setNotice('Исходная база сотрудников восстановлена'); return; } if (apiMode) { setApiState(initialApiState()); setQuery(''); setResetOpen(false); setNotice('Исходный пример API восстановлен'); return; } setGroups(version === 2 ? ensureSystemGroups(roleSeed(initialGroups).map(hydrateGroup)) : (advancedMode ? roleSeed(initialGroups) : structuredClone(initialGroups)).map(hydrateGroup)); setSelectedId(null); navigate({ mode: 'cloud', section: cloudSection }, false, true); setQuery(''); setResetOpen(false); setNotice(roleMode ? 'Исходные роли восстановлены' : 'Исходные группы восстановлены'); }}>Вернуть</Button></DialogActions>
    </Dialog>
    <Snackbar open={!!notice} autoHideDuration={4500} onClose={() => setNotice('')} anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }} message={notice} action={<IconButton color="inherit" size="small" aria-label="Закрыть уведомление" onClick={() => setNotice('')}><CloseOutlined fontSize="small" /></IconButton>} />
  </OrganizationIdentity.Provider></ThemeProvider>;
}
