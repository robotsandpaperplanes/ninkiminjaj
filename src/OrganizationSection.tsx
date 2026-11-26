import { useEffect, useState, type Dispatch, type ReactNode, type RefObject, type SetStateAction } from 'react';
import { Alert, AlertTitle, Box, Button, Divider, MenuItem, Paper, Stack, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Typography } from '@mui/material';
import { InfoOutlined } from '@mui/icons-material';
import { visuallyHidden } from '@mui/utils';
import { TextField } from './app/ModeVisibility';
import type { Employee } from './employee-data';
import { meetingPreferenceLabels, productLabels, recordingAccessLabels } from './group-model';
import { generalOrganizationRights, type OrganizationState } from './organization-model';
import { userRights, viewAllEventsDescription } from './role-model';
import OrganizationOverview from './OrganizationOverview';
import { SaveActions, ToggleRow } from './OrganizationControls';
import type { GroupDefaultsTab } from './app/routes';

const sharedTabs = [
  ['overview', 'Организация'],
  ['productVisibility', 'Управление продуктами'],
] as const;
const telephonyTab = ['telephony', 'Телефония'] as const;
const asIsTabs = [
  ...sharedTabs,
  ['rights', 'Права'],
  ['settings', 'Настройки'],
  telephonyTab,
] as const;
const toBeTabs = [...sharedTabs, ['defaults', 'Права и настройки'], telephonyTab] as const;
type TabKey = typeof asIsTabs[number][0];
type EditableTab = Exclude<TabKey, 'telephony'>;
const rightsMetadata = Object.fromEntries(userRights.flatMap(section => section.items.map(item => [item.key, item])));

const extensions = [
  { extension: '201', label: 'Ресепшен', assigned: true },
  { extension: '202', label: 'Переговорная', assigned: true },
  { extension: '203', label: 'Служба поддержки', assigned: true, employeeId: 'employee-001' },
  { extension: '204', label: 'Резерв', assigned: false },
];

export default function OrganizationSection({ state, setState, employees, notify, leaveRef, onOpenGroupDefaults, toBe, onShowVariant, mobileBrowser, onSaveMobileBrowser }: {
  state: OrganizationState;
  setState: Dispatch<SetStateAction<OrganizationState>>;
  employees: Employee[];
  notify: (message: string) => void;
  leaveRef: RefObject<((after?: () => void) => void) | null>;
  onOpenGroupDefaults: (tab: GroupDefaultsTab) => void;
  toBe: boolean;
  onShowVariant: (toBe: boolean) => void;
  mobileBrowser: boolean;
  onSaveMobileBrowser: (checked: boolean) => void;
}) {
  const [tab, setTab] = useState<TabKey>('overview');
  const [draft, setDraft] = useState(state);
  const [mobileDraft, setMobileDraft] = useState(mobileBrowser);
  const [blocked, setBlocked] = useState(false);

  const mobileDirty = mobileDraft !== mobileBrowser;
  const isDirty = (key: EditableTab) => JSON.stringify(draft[key]) !== JSON.stringify(state[key])
    || (key === 'overview' && toBe && mobileDirty);
  const dirtyTab = asIsTabs.find(([key]) => key !== 'telephony' && isDirty(key))?.[0];
  const blockedTab = dirtyTab ?? (mobileDirty ? 'overview' : undefined);
  const selectedTab = toBe && (tab === 'rights' || tab === 'settings') ? 'defaults' : tab;
  const tabs = toBe ? toBeTabs : asIsTabs;

  useEffect(() => {
    if (!blockedTab) return;
    leaveRef.current = () => {
      if (toBe && (blockedTab === 'rights' || blockedTab === 'settings')) onShowVariant(false);
      if (!toBe && !dirtyTab) onShowVariant(true);
      setBlocked(true);
      setTab(blockedTab);
    };
    return () => { leaveRef.current = null; };
  }, [blockedTab, dirtyTab, leaveRef, onShowVariant, toBe]);

  function change<K extends EditableTab>(key: K, value: OrganizationState[K]) {
    setDraft(previous => ({ ...previous, [key]: value }));
  }

  function actions<K extends EditableTab>(key: K) {
    return {
      dirty: isDirty(key),
      onCancel: () => {
        change(key, state[key]);
        if (key === 'overview' && toBe) setMobileDraft(mobileBrowser);
        setBlocked(false);
      },
      onSave: () => {
        const value = key === 'overview' ? { ...draft.overview, name: draft.overview.name.trim() } : draft[key];
        setState(previous => ({ ...previous, [key]: value }));
        setDraft(previous => ({ ...previous, [key]: value }));
        if (key === 'overview' && toBe && mobileDirty) onSaveMobileBrowser(mobileDraft);
        setBlocked(false);
        notify('Изменения сохранены');
      },
    };
  }

  function rightRow(key: keyof OrganizationState['rights']) {
    const { label, description } = rightsMetadata[key];
    return <ToggleRow key={key} label={label} description={key === 'viewAllEvents' ? viewAllEventsDescription : description}
      checked={draft.rights[key]} onChange={checked => change('rights', { ...draft.rights, [key]: checked })} />;
  }

  function preferenceRow(key: 'autoRecord' | 'camera' | 'microphone') {
    return <ToggleRow label={meetingPreferenceLabels[key]} checked={draft.settings[key]}
      onChange={checked => change('settings', { ...draft.settings, [key]: checked })} />;
  }

  const panels = {
    overview: <OrganizationOverview draft={draft.overview} state={state} notify={notify}
      mobileBrowser={toBe ? { checked: mobileDraft, onChange: setMobileDraft } : undefined}
      onChange={value => change('overview', value)} {...actions('overview')} />,
    productVisibility: <Stack spacing={3} sx={{ maxWidth: 652 }}>
      <Typography>Управляйте видимостью продуктов для сотрудников по умолчанию.</Typography>
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={1}>
          <Typography component="h2" variant="h6">Продукты</Typography>
          {productLabels.map(product => <ToggleRow key={product} label={product} checked={draft.productVisibility[product]}
            onChange={checked => change('productVisibility', { ...draft.productVisibility, [product]: checked })} />)}
        </Stack>
      </Paper>
      <SaveActions label="Применить" {...actions('productVisibility')} />
    </Stack>,
    rights: <Stack spacing={3} sx={{ maxWidth: 652 }}>
      <Typography>Права сотрудников по умолчанию. Исключения для групп сохраняются.</Typography>
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={1}>
          <Typography component="h2" variant="h6">Общие</Typography>
          {generalOrganizationRights.map(rightRow)}
          <Divider />
          <Typography component="h2" variant="h6">Курсы</Typography>
          {rightRow('createCourses')}
        </Stack>
      </Paper>
      <SaveActions {...actions('rights')} />
    </Stack>,
    settings: <Stack spacing={3} sx={{ maxWidth: 652 }}>
      <Typography>Настройки сотрудников по умолчанию на уровне организации.</Typography>
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={1.5}>
          <Typography component="h2" variant="h6">Мероприятие</Typography>
          {preferenceRow('autoRecord')}
          <TextField select label={meetingPreferenceLabels.recordingAccess} value={draft.settings.recordingAccess}
            onChange={event => change('settings', { ...draft.settings, recordingAccess: event.target.value as OrganizationState['settings']['recordingAccess'] })}
            sx={{ width: { xs: '100%', sm: 264 } }}>
            {Object.entries(recordingAccessLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
          </TextField>
          <Divider />
          <Typography component="h2" variant="h6">Подключение к встрече</Typography>
          {preferenceRow('camera')}{preferenceRow('microphone')}
          <ToggleRow label="Подключаться к мероприятию по умолчанию с помощью десктопного приложения"
            checked={draft.settings.desktopSelf} onChange={checked => change('settings', { ...draft.settings, desktopSelf: checked })} />
        </Stack>
      </Paper>
      <SaveActions {...actions('settings')} />
    </Stack>,
    telephony: <Telephony employees={employees} />,
  };

  return <Box>
    <Typography component="h1" sx={visuallyHidden}>Организация</Typography>
    <Tabs value={selectedTab} onChange={(_, value: TabKey | 'defaults') => setTab(value === 'defaults' ? 'rights' : value)} aria-label="Разделы организации"
      variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
      {tabs.map(([key, label]) => <Tab key={key} value={key} label={label} id={`organization-tab-${key}`} aria-controls={`organization-panel-${key}`} />)}
    </Tabs>
    {tabs.map(([key]) => <Box key={key} role="tabpanel" hidden={selectedTab !== key}
        id={`organization-panel-${key}`} aria-labelledby={`organization-tab-${key}`}>
        {key === 'productVisibility' && <GroupDefaultsBanner onOpen={() => onOpenGroupDefaults('products')} />}
        {blocked && dirtyTab === key && selectedTab === key && <Alert severity="warning" sx={{ mb: 2 }}>Сохраните или отмените изменения, чтобы продолжить.</Alert>}
        {key === 'defaults'
          ? <GroupDefaultsInformer title="Права и настройки по умолчанию"
              description="Базовые права и настройки сотрудников теперь управляются в системной группе @everyone. Для отдельных категорий сотрудников можно задать собственные значения в соответствующих группах.">
              <Stack direction="row" flexWrap="wrap" useFlexGap gap={.5} sx={{ mt: .5, ml: -.75 }}>
                <Button size="small" onClick={() => onOpenGroupDefaults('permissions')}>Права по умолчанию</Button>
                <Button size="small" onClick={() => onOpenGroupDefaults('settings')}>Настройки по умолчанию</Button>
              </Stack>
            </GroupDefaultsInformer>
          : panels[key]}
      </Box>)}
  </Box>;
}

function GroupDefaultsBanner({ onOpen }: { onOpen: () => void }) {
  return <GroupDefaultsInformer title="Настройки по умолчанию теперь управляются через группы"
    description="Права, настройки и доступ к продуктам для сотрудников организации теперь можно задавать в системной группе @everyone. Для отдельных категорий сотрудников используйте другие функциональные группы.">
    <Button size="small" onClick={onOpen} sx={{ mt: .5, ml: -.75, textAlign: 'left' }}>Перейти к настройкам по умолчанию</Button>
  </GroupDefaultsInformer>;
}

function GroupDefaultsInformer({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <Alert severity="info" icon={<InfoOutlined fontSize="small" />} sx={{ mb: 3, maxWidth: 652, bgcolor: 'action.hover', color: 'text.primary' }}>
    <AlertTitle>{title}</AlertTitle>
    <Typography variant="body2">{description}</Typography>
    {children}
  </Alert>;
}

function Telephony({ employees }: { employees: Employee[] }) {
  return <Stack spacing={2} sx={{ maxWidth: 820 }}>
    <Typography component="h2" variant="h6">Внутренние номера</Typography>
    <Typography color="text.secondary">Демонстрационные данные</Typography>
    <TableContainer component={Paper} variant="outlined" tabIndex={0}>
      <Table aria-label="Внутренние номера" sx={{ minWidth: 520 }}>
        <TableHead><TableRow>
          <TableCell>Внутренний номер</TableCell><TableCell>Название</TableCell><TableCell>Сотрудник</TableCell><TableCell>Статус</TableCell>
        </TableRow></TableHead>
        <TableBody>{extensions.map(row => <TableRow key={row.extension}>
          <TableCell>{row.extension}</TableCell><TableCell>{row.label}</TableCell>
          <TableCell>{row.employeeId ? employees.find(employee => employee.id === row.employeeId)?.name ?? 'Сотрудник недоступен' : '—'}</TableCell>
          <TableCell>{row.assigned ? 'Назначен' : 'Свободен'}</TableCell>
        </TableRow>)}</TableBody>
      </Table>
    </TableContainer>
  </Stack>;
}
