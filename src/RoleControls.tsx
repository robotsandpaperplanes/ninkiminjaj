import { PermissionRow } from './PermissionControl';
import { permissionState, productState, adminState, preferenceState, recordingValue, withRecordingAccess, type RoleState } from './role-states';
import { roleSections, roleProducts, roleAdminRights, rightEnabled, rightScope } from './role-catalog';
import RoleTypeSelect from './RoleTypeSelect';
import { PreviewChat } from './PreviewChat';
import { RoleExplanation } from './RoleExplanation';
import { useState, type ReactNode } from 'react';
import { Alert, Box, Button, Chip, Dialog, DialogContent, DialogTitle, Divider, IconButton, InputAdornment, MenuItem, Paper, Stack, Switch, TextField, Typography } from '@mui/material';
import { CloseOutlined, SearchOutlined, VisibilityOutlined } from '@mui/icons-material';
import { productLabels, type Permissions } from './group-model';
import { quotaCatalog, type BooleanPermission, type RoleConfig, type RolePreferences, everyoneSettings } from './role-model';

export function RoleType({ value, onChange, readOnly = false }: { readOnly?: boolean; value: RoleConfig; onChange: (v: RoleConfig) => void }) {
  return <RoleTypeSelect disabled={readOnly} label="Тип роли" value={value} onChange={onChange} />;
}
export function RoleQuotas({ value, onChange, readOnly = false }: { readOnly?: boolean; value: RoleConfig; onChange: (v: RoleConfig) => void }) {
  return <Stack spacing={2.5}>
    <Typography variant="body2" color="text.secondary">Выберите квоты, которые будут применяться к сотрудникам с этой ролью. Квоты создаются в продуктах из ресурсов тарифа организации.</Typography>
    {([{ key: 'meetingQuota', label: 'Встречи', options: quotaCatalog.meetings }, { key: 'diskQuota', label: 'Диск', options: quotaCatalog.disk }] as const).map(({ key, label, options }) => <Box key={key}>
      <TextField disabled={readOnly} id={key === 'diskQuota' ? 'role-quota-disk' : 'role-quota-meetings'} fullWidth select label={'Квота · ' + label} error={!!value[key] && !options.some(q => q.id === value[key])} helperText={value[key] && !options.some(q => q.id === value[key]) ? 'Эта квота больше недоступна. Выберите другую квоту.' : undefined} value={value[key]} onChange={e => onChange({ ...value, [key]: e.target.value })}>
        <MenuItem value="">Не назначена</MenuItem>{value[key] && !options.some(q => q.id === value[key]) && <MenuItem disabled value={value[key]}>Архивная квота · недоступна</MenuItem>}{options.map(q => <MenuItem key={q.id} value={q.id}>{q.name} — {q.detail}</MenuItem>)}
      </TextField>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: .75 }}>{value[key] ? options.find(q => q.id === value[key])?.detail : 'Выберите готовую квоту продукта'}</Typography>
    </Box>)}
    <Typography variant="caption" color="text.secondary">Квота задаёт лимит ресурса. Доступ к самому продукту включается в разделе «Доступ к продуктам» вкладки «Разрешения».</Typography>
  </Stack>;
}
export function RoleRights({ permissions, onPermission, value, onChange, communication, products, onProduct, readOnly = false }: { readOnly?: boolean; products: Record<string, boolean>; onProduct: (name: string, enabled: boolean) => void; permissions: Permissions; onPermission: (key: BooleanPermission, v: boolean) => void; value: RoleConfig; onChange: (v: RoleConfig) => void; communication: ReactNode }) {
  const [query, setQuery] = useState('');
  const normalized = query.trim().toLocaleLowerCase('ru');
  const matches = (...texts: (string | undefined)[]) => texts.join(' ').toLocaleLowerCase('ru').includes(normalized);
  const communicationMatch = matches('Чаты и коммуникация', 'Общение с сотрудниками', 'Личные чаты и звонки', 'Выбранные роли');
  const sections = roleSections.map(s => ({ ...s, items: s.items.filter(i => matches(s.title, i.label, i.description)) }));
  const admins = roleAdminRights.filter(i => matches('Административные разрешения', i.label, i.description));
  const visibleProducts = roleProducts.filter(p => matches('Доступ к продуктам', p));
  const count = sections.reduce((n, s) => n + s.items.length, 0) + (communicationMatch ? 1 : 0) + admins.length + visibleProducts.length;
  return <>
    <Alert severity="info" sx={{ mb: 2 }}>Крестик — запрещено, слэш — не задано, галочка — разрешено. «Не задано» означает, что эта роль не влияет на разрешение.</Alert>
    <TextField disabled={readOnly} fullWidth label="Поиск разрешений" placeholder="Название, раздел или описание права" value={query} onChange={e => setQuery(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment>, endAdornment: query ? <InputAdornment position="end"><IconButton size="small" aria-label="Очистить поиск прав" onClick={() => setQuery('')}><CloseOutlined fontSize="small" /></IconButton></InputAdornment> : undefined }} />
    <Typography variant="caption" color="text.secondary" component="div" aria-live="polite" sx={{ mt: 1, mb: 2 }}>Показано разрешений: {count}</Typography>
    {!count && <Box sx={{ py: 3, textAlign: 'center' }}><Typography>Права не найдены</Typography><Button onClick={() => setQuery('')}>Сбросить поиск</Button></Box>}
    {!!visibleProducts.length && <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}><Typography variant="subtitle1" component="h3">Доступ к продуктам</Typography>{visibleProducts.map(p => <PermissionRow disabled={readOnly} key={p} label={p} value={productState(p, value, products)} onChange={state => onChange({ ...value, productStates: { ...value.productStates, [p]: state } })} />)}</Box>}
    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Разрешение на функцию не открывает все объекты продукта. Доступ к конкретным чатам, доскам, документам и ящикам задаётся отдельно.</Typography>
    {sections.map(s => (s.items.length || (s.title === 'Чаты и коммуникация' && communicationMatch)) ? <Box key={s.title} sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
      <Typography variant="subtitle1" component="h3">{s.title}</Typography>
      {s.product && productState(s.product, value, products) !== 'allow' && <Typography variant="caption" color="text.secondary">{productState(s.product, value, products) === 'deny' ? 'Эта роль запрещает доступ к продукту.' : 'Доступ к продукту не задан этой ролью и может предоставляться другими ролями.'} Разрешения на функции действуют при наличии доступа к продукту.</Typography>}
      {s.items.map(i => { const enabled = rightEnabled(i, value, permissions); const scope = rightScope(i, value); return <Box key={i.key}>
        <PermissionRow disabled={readOnly} label={i.label} description={i.description} value={permissionState(i, value, permissions)} onChange={state => onChange({ ...value, permissionStates: { ...value.permissionStates, [i.key]: state } })} />
        {i.scope && <TextField select fullWidth label={'Область действия · ' + i.label.toLocaleLowerCase('ru')} disabled={readOnly || !enabled} value={scope} onChange={e => onChange({ ...value, scopes: { ...value.scopes, [i.key]: e.target.value as 'own' | 'organization' } })} sx={{ mb: 1.5 }}><MenuItem value="own">{i.scope[0]}</MenuItem><MenuItem value="organization">{i.scope[1]}</MenuItem></TextField>}
        {enabled && i.warning && (!i.scope || scope === 'organization') && <Alert severity="warning" sx={{ mb: 1 }}>{i.warning}</Alert>}
      </Box>; })}
      {s.title === 'Чаты и коммуникация' && communicationMatch && communication}
    </Box> : null)}
    {!!admins.length && <Box component="fieldset" disabled={readOnly || !value.administrative} aria-label="Административные разрешения" sx={{ m: 0, px: 0, pb: 0, minWidth: 0, mt: 2, pt: 2, border: 0, borderTop: 1, borderColor: 'divider', opacity: value.administrative ? 1 : .5 }}><Stack direction="row" alignItems="center" gap={1}><Typography variant="subtitle1" component="h3">Административные разрешения</Typography><Chip size="small" label="Административная роль" variant="outlined" /></Stack>{admins.map(i => <PermissionRow key={i.key} label={i.label} description={i.description} disabled={readOnly || !value.administrative} value={adminState(i.key, value)} onChange={state => onChange({ ...value, adminStates: { ...value.adminStates, [i.key]: state } })} />)}</Box>}
    {!value.administrative && !!admins.length && <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>Административные права доступны для типа «Административная» во вкладке «Основное».</Typography>}
  </>;
}
export function RoleSettings({ value, onChange, readOnly = false }: { readOnly?: boolean; value: RoleConfig; onChange: (v: RoleConfig) => void }) {
  const set = (key: string, state: RoleState) => onChange({ ...value, settingStates: { ...value.settingStates, [key]: state } });
  const sections: { title: string; items: { key: Exclude<keyof RolePreferences, 'recordingAccess'>; label: string; description?: string }[] }[] = [
    { title: 'Запись мероприятия', items: [
      { key: 'autoRecord', label: 'Запускать запись при старте мероприятия', description: 'Настройка не применяется к постоянным встречам' },
      { key: 'autoTranscript', label: 'Запускать текстовую расшифровку при старте мероприятия', description: 'Преобразование видеозаписи в текстовый формат' },
    ] },
    { title: 'Подключение к встрече', items: [
      { key: 'camera', label: 'Включать мою камеру при подключении' },
      { key: 'microphone', label: 'Включать мой микрофон при подключении' },
    ] },
    { title: 'Десктопное приложение', items: [
      { key: 'desktopSelf', label: 'Подключаться к мероприятию по умолчанию с помощью десктопного приложения' },
      { key: 'desktopParticipants', label: 'Использовать десктопное приложение для участников мероприятий по умолчанию' },
    ] },
    { title: 'Прочее', items: [
      { key: 'addToCalendar', label: 'Добавлять созданные мероприятия в свой календарь' },
      { key: 'meetingsHome', label: 'Использовать по умолчанию кабинет встреч' },
    ] },
  ];
  return <><Alert severity="info" sx={{ mb: 3 }}>Сотрудники могут выставить настройки индивидуально. «Не задано» — роль не меняет настройку; крестик — выключено, галочка — включено.</Alert>{sections.map((section, i) => <Box key={section.title} sx={{ pt: i ? 2.5 : 0, mt: i ? 2 : 0, borderTop: i ? 1 : 0, borderColor: 'divider' }}><Typography variant="subtitle1" component="h3">{section.title}</Typography>{section.items.map(item => <PermissionRow setting disabled={readOnly} key={item.key} label={item.label} description={item.description} value={preferenceState(item.key, value)} onChange={state => set(item.key, state)} />)}{i === 0 && <TextField disabled={readOnly} select fullWidth label="Доступ к записи мероприятия" value={recordingValue(value)} onChange={e => onChange(withRecordingAccess(value, e.target.value as RolePreferences['recordingAccess'] | 'unset'))} sx={{ mt: 2, mb: 1 }}><MenuItem value="unset">Не задано этой ролью</MenuItem><MenuItem value="self">Только мне</MenuItem><MenuItem value="participants">Для участников</MenuItem><MenuItem value="organization">Всем из организации</MenuItem></TextField>}</Box>)}</>;
}
export function RolePreview({ name, value, products, permissions }: { name: string; value: RoleConfig; products: Record<string, boolean>; permissions: Permissions }) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState('Чаты');
  return <>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Посмотрите доступные продукты и разделы организации с текущими правами роли.</Typography>
    <Button variant="outlined" startIcon={<VisibilityOutlined />} onClick={() => { setSection('Чаты'); setOpen(true); }}>Посмотреть организацию как эта роль</Button>
    <Dialog open={open} onClose={() => setOpen(false)} fullScreen aria-labelledby="role-preview-title">
      <DialogTitle id="role-preview-title" sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'action.selected' }}><Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" gap={1}><Box><Typography variant="h6">Просмотр организации · {name}</Typography><Typography variant="body2" color="text.secondary">Демонстрационный режим · текущие значения роли, включая несохранённые</Typography></Box><Button onClick={() => setOpen(false)} startIcon={<CloseOutlined />}>Выйти из просмотра</Button></Stack></DialogTitle>
      <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'background.default' }}>
        <Alert severity="info" sx={{ mb: 3 }}>Статичный макет интерфейса. Меню показано для примера; фактические доступы роли указаны в панели слева.</Alert>
        <Stack direction={{ xs: 'column', md: 'row' }} alignItems="flex-start" gap={3}>
          <Box sx={{ width: { xs: '100%', md: 300 }, flexShrink: 0, position: { md: 'sticky' }, top: 0, maxHeight: { md: 'calc(100dvh - 170px)' }, overflowY: 'auto' }}><RoleExplanation name={name} section={section} value={value} products={products} permissions={permissions} /></Box>
          <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
          <PreviewChat section={section} onSection={setSection} />
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  </>;
}
