import { OrganizationIdentity } from './app/OrganizationIdentity';
import { Dialog, TextField } from './app/ModeVisibility';
import RoleTypeSelect from './RoleTypeSelect';
import { useContext, useState, type ReactNode } from 'react';
import { Alert, Box, Button, Chip, DialogContent, DialogTitle, Divider, IconButton, InputAdornment, MenuItem, Paper, Stack, Typography } from '@mui/material';
import { CloseOutlined, SearchOutlined, VisibilityOutlined } from '@mui/icons-material';
import { PermissionRow } from './PermissionControl';
import { permissionState, type PermissionState } from './multi-model';
import { type GroupDetails, type Permissions } from './group-model';
import { ToggleRow } from './OrganizationControls';
import { functionalGroupRights } from './functional-group-rights';
import { adminRights, quotaCatalog, userRights, type BooleanPermission, type RoleConfig, type RolePreferences, everyoneSettings } from './role-model';

export function RoleType({ value, onChange }: { value: RoleConfig; onChange: (v: RoleConfig) => void }) {
  return <RoleTypeSelect label="Тип группы" value={value} onChange={onChange} />;
}
export function RoleQuotas({ value, onChange }: { value: RoleConfig; onChange: (v: RoleConfig) => void }) {
  return <Stack spacing={2.5}>
    <Typography variant="body2" color="text.secondary">Выберите квоты, которые будут применяться к сотрудникам с этой группой. Квоты создаются в продуктах из ресурсов тарифа организации.</Typography>
    {([{ key: 'meetingQuota', label: 'Встречи', options: quotaCatalog.meetings }, { key: 'diskQuota', label: 'Диск', options: quotaCatalog.disk }] as const).map(({ key, label, options }) => <Box key={key}>
      <TextField fullWidth select label={'Квота · ' + label} value={value[key]} onChange={e => onChange({ ...value, [key]: e.target.value })}>
        <MenuItem value="">Не назначена</MenuItem>{options.map(q => <MenuItem key={q.id} value={q.id}>{q.name} — {q.detail}</MenuItem>)}
      </TextField>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: .75 }}>{value[key] ? options.find(q => q.id === value[key])?.detail : 'Выберите готовую квоту продукта'}</Typography>
    </Box>)}
    <Typography variant="caption" color="text.secondary">Квота задаёт лимит ресурса. Доступ к самому продукту включается в разделе «Доступ к продуктам» вкладки «Разрешения».</Typography>
  </Stack>;
}
export function RoleRights({ permissions, onPermission, value, onChange, communication, states, onState, systemDefault = false }: {
  states?: Record<string, PermissionState>;
  onState: (key: string, value: PermissionState) => void;
  systemDefault?: boolean;
  permissions: Permissions;
  onPermission: (key: BooleanPermission, value: boolean) => void;
  value: RoleConfig;
  onChange: (value: RoleConfig) => void;
  communication: ReactNode;
}) {
  const [query, setQuery] = useState('');
  const normalized = query.trim().toLocaleLowerCase('ru');
  const matches = (...texts: (string | undefined)[]) => texts.join(' ').toLocaleLowerCase('ru').includes(normalized);
  const sections = functionalGroupRights.map(section => ({
    ...section,
    blocks: section.blocks.map(block => ({
      ...block,
      rights: block.rights.filter(right => matches(section.title, block.title, right.label, right.description)),
      communication: block.communication && matches(section.title, block.title, 'Общение с сотрудниками', 'Личные чаты и звонки'),
    })).filter(block => block.rights.length || block.communication),
  })).filter(section => section.blocks.length);
  const admins = adminRights.filter(right => matches('Администрирование', 'Административные разрешения', right.label, right.description));
  const canEditAdmin = value.administrative && !systemDefault;
  const count = sections.flatMap(section => section.blocks)
    .reduce((total, block) => total + block.rights.length + Number(!!block.communication), admins.length);

  return <>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Красный крест — запрещено · серый слэш — не задано · зелёная галочка — разрешено.</Typography>
    <TextField fullWidth label="Поиск по правам" placeholder="Название, раздел или описание права" value={query} onChange={event => setQuery(event.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment>, endAdornment: query ? <InputAdornment position="end"><IconButton size="small" aria-label="Очистить поиск прав" onClick={() => setQuery('')}><CloseOutlined fontSize="small" /></IconButton></InputAdornment> : undefined }} />
    <Typography variant="caption" color="text.secondary" component="div" aria-live="polite" sx={{ mt: 1, mb: 2 }}>Показано прав: {count}</Typography>
    {!count && <Box sx={{ py: 3, textAlign: 'center' }}><Typography>Права не найдены</Typography><Button onClick={() => setQuery('')}>Сбросить поиск</Button></Box>}
    {sections.map(section => <Box key={section.title} sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
      <Typography variant="h6" component="h3">{section.title}</Typography>
      {section.blocks.map(block => <Box key={block.title ?? section.title} sx={{ mt: block.title ? 2 : 0 }}>
        {block.title && <Typography variant="subtitle1" color="text.secondary" component="h4">{block.title}</Typography>}
        {block.rights.map(right => <PermissionRow key={right.key} label={right.label} description={right.description}
          value={permissionState(states, right.key, right.legacy ? permissions[right.key] : systemDefault)}
          onChange={state => {
            onState(right.key, state);
            if (right.legacy) onPermission(right.key, state === 'allow');
          }} />)}
        {block.communication && communication}
      </Box>)}
    </Box>)}
    {!!admins.length && <Box component="fieldset" disabled={!canEditAdmin} aria-label="Административные разрешения" sx={{ m: 0, px: 0, pb: 0, minWidth: 0, mt: 2, pt: 2, border: 0, borderTop: 1, borderColor: 'divider', opacity: canEditAdmin ? 1 : .5 }}>
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1}>
        <Typography variant="h6" component="h3">Администрирование</Typography>
        <Chip size="small" label="Административная группа" variant="outlined" />
      </Stack>
      {admins.map(right => <PermissionRow key={right.key} administrative disabled={!canEditAdmin}
        label={right.label.replace('ролями и назначениями', 'разрешениями групп')}
        description={right.description.replace('Создание ролей, изменение прав и назначение пользователям', 'Изменение разрешений других групп в пределах своих полномочий')}
        value={!systemDefault && value.adminPermissions[right.key] ? 'allow' : 'unset'}
        onChange={state => {
          if (canEditAdmin) onChange({ ...value, adminPermissions: { ...value.adminPermissions, [right.key]: state === 'allow' } });
        }} />)}
    </Box>}
    {!canEditAdmin && !!admins.length && <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
      {systemDefault ? 'Административные полномочия недоступны для @everyone.' : 'Административные полномочия: не задано или разрешено. Запреты других групп на них не действуют. Доступны для типа «Административная» во вкладке «Основное».'}
    </Typography>}
  </>;
}

export function RoleSettings({ value, onChange, invitationType, onInvitationTypeChange }: {
  value: RoleConfig;
  onChange: (value: RoleConfig) => void;
  invitationType: NonNullable<GroupDetails['meetingInvitationType']>;
  onInvitationTypeChange: (value: NonNullable<GroupDetails['meetingInvitationType']>) => void;
}) {
  const settings = { ...everyoneSettings, ...value.preferences };
  const set = <K extends keyof RolePreferences>(key: K, next: RolePreferences[K]) =>
    onChange({ ...value, preferences: { ...settings, [key]: next } });
  return <Stack spacing={2.5}>
    <Stack component="section" spacing={1}>
      <Typography variant="subtitle1" component="h3">Запись</Typography>
      <ToggleRow label="Автоматически начинать запись встреч"
        description="Запись начинается автоматически при старте встречи. Организатор может управлять записью, если у него есть соответствующее полномочие."
        checked={settings.autoRecord} onChange={next => set('autoRecord', next)} />
      <TextField select label="Доступ к записям по умолчанию" value={settings.recordingAccess}
        helperText="Определяет, кому по умолчанию будут доступны записи новых встреч. Индивидуальные ограничения доступа действуют отдельно."
        onChange={event => set('recordingAccess', event.target.value as RolePreferences['recordingAccess'])}>
        <MenuItem value="self">Только мне</MenuItem>
        <MenuItem value="participants">Для участников</MenuItem>
        <MenuItem value="organization">Всем из организации</MenuItem>
      </TextField>
      <ToggleRow label="Запускать текстовую расшифровку при старте мероприятия"
        description="Преобразование видеозаписи в текстовый формат"
        checked={settings.autoTranscript} onChange={next => set('autoTranscript', next)} />
    </Stack>
    <Divider />
    <Stack component="section" spacing={1}>
      <Typography variant="subtitle1" component="h3">Подключение к встречам</Typography>
      <ToggleRow label="Включать камеру при подключении"
        description="Камера автоматически включается при входе во встречу. Сотрудник может изменить её состояние."
        checked={settings.camera} onChange={next => set('camera', next)} />
      <ToggleRow label="Включать микрофон при подключении"
        description="Микрофон автоматически включается при входе во встречу. Сотрудник может изменить его состояние."
        checked={settings.microphone} onChange={next => set('microphone', next)} />
      <ToggleRow label="Использовать десктопное приложение для участников по умолчанию"
        description="Определяет предпочтительный способ подключения участников к мероприятиям, создаваемым сотрудниками этой группы."
        checked={settings.desktopParticipants} onChange={next => set('desktopParticipants', next)} />
    </Stack>
    <Divider />
    <Stack component="section" spacing={1}>
      <Typography variant="subtitle1" component="h3">Приглашения</Typography>
      <TextField select label="Тип ссылки-приглашения по умолчанию" value={invitationType}
        helperText="Определяет тип ссылки, предлагаемый при создании новой встречи."
        onChange={event => onInvitationTypeChange(event.target.value as typeof invitationType)}>
        <MenuItem value="shared">Общая</MenuItem>
        <MenuItem value="personal">Персональная</MenuItem>
      </TextField>
    </Stack>
    <Divider />
    <Stack component="section" spacing={1}>
      <Typography variant="subtitle1" component="h3">Прочее</Typography>
      <ToggleRow label="Добавлять созданные мероприятия в свой календарь"
        checked={settings.addToCalendar} onChange={next => set('addToCalendar', next)} />
      <ToggleRow label="Использовать по умолчанию кабинет встреч"
        checked={settings.meetingsHome} onChange={next => set('meetingsHome', next)} />
    </Stack>
  </Stack>;
}
export function RolePreview({ name, value, products, permissions }: { name: string; value: RoleConfig; products: Record<string, boolean>; permissions: Permissions }) {
  const organizationName = useContext(OrganizationIdentity);
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState('Главная');
  const productNames = Object.keys(products).filter(k => products[k]);
  const availableAdmin = value.administrative ? adminRights.filter(i => value.adminPermissions[i.key]) : [];
  const allowedActions = userRights.flatMap(s => s.items).filter(i => permissions[i.key]);
  return <>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Посмотрите доступные продукты и разделы организации с текущими правами группы.</Typography>
    <Button variant="outlined" startIcon={<VisibilityOutlined />} onClick={() => { setSection('Главная'); setOpen(true); }}>Посмотреть организацию как эта группа</Button>
    <Dialog open={open} onClose={() => setOpen(false)} fullScreen aria-labelledby="role-preview-title">
      <DialogTitle id="role-preview-title" sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'action.selected' }}><Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" gap={1}><Box><Typography variant="h6">Просмотр организации · {name}</Typography><Typography variant="body2" color="text.secondary">Демонстрационный режим · текущие значения группы, включая несохранённые</Typography></Box><Button onClick={() => setOpen(false)} startIcon={<CloseOutlined />}>Выйти из просмотра</Button></Stack></DialogTitle>
      <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'background.default' }}>
        <Alert severity="info" sx={{ mb: 3 }}>Просмотр только этой группы. Другие группы пользователя не учитываются; реальные данные и сеанс сотрудника не изменяются.</Alert>
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={3}>
          <Paper variant="outlined" component="nav" aria-label="Навигация в предпросмотре" sx={{ p: 2, width: { sm: 240 }, flexShrink: 0 }}><Typography variant="subtitle1" sx={{ mb: 2 }}>{organizationName}</Typography>
            {['Главная', ...productNames].map(p => <Button key={p} fullWidth onClick={() => setSection(p)} variant={section === p ? 'contained' : 'text'} sx={{ justifyContent: 'flex-start', py: value.compactInterface ? .5 : 1, mb: .5 }}>{p}</Button>)}
            {!!availableAdmin.length && <><Divider sx={{ my: 2 }} /><Typography variant="caption" color="text.secondary">Администрирование</Typography>{availableAdmin.map(p => <Button key={p.key} fullWidth onClick={() => setSection(p.destination)} variant={section === p.destination ? 'contained' : 'text'} sx={{ justifyContent: 'flex-start', py: value.compactInterface ? .5 : 1 }}>{p.destination}</Button>)}</>}
          </Paper>
          <Box sx={{ flex: 1, minWidth: 0 }}><Typography variant="h4" sx={{ mb: 2 }}>{section}</Typography>{value.showHints && <Typography color="text.secondary" sx={{ mb: 3 }}>Демонстрация разделов и возможностей, доступных группе «{name}».</Typography>}
            <Paper variant="outlined" sx={{ p: 3 }}><Typography variant="h6" sx={{ mb: 2 }}>{section === 'Главная' ? 'Доступные продукты' : 'Возможности группы'}</Typography>
              {section === 'Главная' ? <Stack direction="row" flexWrap="wrap" useFlexGap gap={1}>{productNames.length ? productNames.map(p => <Chip key={p} label={p} onClick={() => setSection(p)} />) : <Typography color="text.secondary">Продукты для этой группы не включены.</Typography>}</Stack> : <Typography variant="body2">{availableAdmin.find(i => i.destination === section)?.description || `Доступ к продукту «${section}» включён. Рабочие данные в демонстрации не загружаются.`}</Typography>}
            </Paper>
            <Paper variant="outlined" sx={{ p: 3, mt: 2 }}><Typography variant="h6" sx={{ mb: 2 }}>Разрешения группы</Typography>{allowedActions.map(i => <Typography key={i.key} variant="body2" sx={{ mb: 1 }}>{i.label}</Typography>)}{!allowedActions.length && <Typography color="text.secondary">Пользовательские права не включены.</Typography>}</Paper>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  </>;
}
