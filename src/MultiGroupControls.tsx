import RoleTypeSelect from './RoleTypeSelect';
import { useState, type ReactNode } from 'react';
import { Alert, Box, Button, Chip, Dialog, DialogContent, DialogTitle, Divider, IconButton, InputAdornment, MenuItem, Paper, Stack, Switch, TextField, Typography } from '@mui/material';
import { CloseOutlined, SearchOutlined, VisibilityOutlined } from '@mui/icons-material';
import { PermissionRow } from './PermissionControl';
import { permissionState, type PermissionState } from './multi-model';
import { productLabels, type Permissions } from './group-model';
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
function RightRow({ label, description, checked, onChange, disabled = false }: { disabled?: boolean; label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <Stack direction="row" gap={2} alignItems="center" justifyContent="space-between" sx={{ py: 1.75 }}><Box><Typography>{label}</Typography>{description && <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>{description}</Typography>}</Box><Switch disabled={disabled} size="small" checked={checked} onChange={e => onChange(e.target.checked)} slotProps={{ input: { 'aria-label': label } }} /></Stack>;
}
export function RoleRights({ permissions, onPermission, value, onChange, communication, products, onProduct, states, onState, systemDefault = false }: { states?: Record<string, PermissionState>; onState: (key: string, value: PermissionState) => void; systemDefault?: boolean; products: Record<string, boolean>; onProduct: (name: string, enabled: boolean) => void; permissions: Permissions; onPermission: (key: BooleanPermission, v: boolean) => void; value: RoleConfig; onChange: (v: RoleConfig) => void; communication: ReactNode }) {
  const [query, setQuery] = useState('');
  const normalized = query.trim().toLocaleLowerCase('ru');
  const matches = (...texts: (string | undefined)[]) => texts.join(' ').toLocaleLowerCase('ru').includes(normalized);
  const communicationMatch = matches('Общение и совместная работа', 'Общение с сотрудниками', 'Личные чаты и звонки', 'Выбранные группы');
  const sections = userRights.map(s => ({ ...s, items: s.items.filter(i => matches(s.section, i.label, i.description)) }));
  const admins = adminRights.filter(i => matches('Административные разрешения', i.label, i.description));
  const visibleProducts = [...productLabels, 'Диск'].filter(p => matches('Доступ к продуктам', p));
  const count = sections.reduce((n, s) => n + s.items.length, 0) + (communicationMatch ? 1 : 0) + admins.length + visibleProducts.length;
  return <>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{systemDefault ? 'Красный крест — запрещено · серый слэш — не задано · зелёная галочка — разрешено. Значения по умолчанию применяются, если группы сотрудника не задали разрешение. Не задано — базовое значение каталога.' : 'Красный крест — запрещено · серый слэш — не задано · зелёная галочка — разрешено. Для обычных разрешений запрет любой группы побеждает. Если значение не задано, учитываются другие группы, затем Everyone.'}</Typography>
    <TextField fullWidth label="Поиск по правам" placeholder="Название, раздел или описание права" value={query} onChange={e => setQuery(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment>, endAdornment: query ? <InputAdornment position="end"><IconButton size="small" aria-label="Очистить поиск прав" onClick={() => setQuery('')}><CloseOutlined fontSize="small" /></IconButton></InputAdornment> : undefined }} />
    <Typography variant="caption" color="text.secondary" component="div" aria-live="polite" sx={{ mt: 1, mb: 2 }}>Показано прав: {count}</Typography>
    {!count && <Box sx={{ py: 3, textAlign: 'center' }}><Typography>Права не найдены</Typography><Button onClick={() => setQuery('')}>Сбросить поиск</Button></Box>}
    {!!visibleProducts.length && <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}><Typography variant="subtitle1" component="h3">Доступ к продуктам</Typography>{visibleProducts.map(p => <PermissionRow key={p} label={p} value={permissionState(states, "product:" + p, !!products[p])} onChange={state => { onState("product:" + p, state); onProduct(p, state === "allow"); }} />)}</Box>}
    {sections.map(s => (s.items.length || (s.section === 'Общение и совместная работа' && communicationMatch)) ? <Box key={s.section} sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}><Typography variant="subtitle1" component="h3">{s.section}</Typography>{s.items.map(i => <PermissionRow key={i.key} label={i.label} description={i.description} value={permissionState(states, i.key, permissions[i.key])} onChange={state => { onState(i.key, state); onPermission(i.key, state === "allow"); }} />)}{s.section === 'Общение и совместная работа' && communicationMatch && communication}</Box> : null)}
    {!!admins.length && <Box component="fieldset" disabled={!value.administrative || systemDefault} aria-label="Административные разрешения" sx={{ m: 0, px: 0, pb: 0, minWidth: 0, mt: 2, pt: 2, border: 0, borderTop: 1, borderColor: 'divider', opacity: value.administrative ? 1 : .5 }}><Stack direction="row" alignItems="center" gap={1}><Typography variant="subtitle1" component="h3">Административные разрешения</Typography><Chip size="small" label="Административная группа" variant="outlined" /></Stack>{admins.map(i => <PermissionRow key={i.key} administrative label={i.label.replace("ролями и назначениями", "разрешениями групп")} description={i.description.replace("Создание ролей, изменение прав и назначение пользователям", "Изменение разрешений других групп в пределах своих полномочий")} disabled={!value.administrative || systemDefault} value={value.adminPermissions[i.key] ? "allow" : "unset"} onChange={state => onChange({ ...value, adminPermissions: { ...value.adminPermissions, [i.key]: state === "allow" } })} />)}</Box>}
    {!value.administrative && !!admins.length && <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>{systemDefault ? "В Everyone административные полномочия недоступны." : "Административные полномочия: не задано или разрешено. Запреты других групп на них не действуют. Доступны для типа «Административная» во вкладке «Основное»."}</Typography>}
  </>;
}
export function RoleSettings({ value, onChange }: { value: RoleConfig; onChange: (v: RoleConfig) => void }) {
  const settings = { ...everyoneSettings, ...value.preferences };
  const set = <K extends keyof RolePreferences>(key: K, v: RolePreferences[K]) => onChange({ ...value, preferences: { ...settings, [key]: v } });
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
  return <><Alert severity="info" sx={{ mb: 3 }}>Сотрудники могут выставить настройки индивидуально</Alert>{sections.map((section, i) => <Box key={section.title} sx={{ pt: i ? 2.5 : 0, mt: i ? 2 : 0, borderTop: i ? 1 : 0, borderColor: 'divider' }}><Typography variant="subtitle1" component="h3">{section.title}</Typography>{section.items.map(item => <RightRow key={item.key} label={item.label} description={item.description} checked={settings[item.key]} onChange={v => set(item.key, v)} />)}{i === 0 && <TextField select fullWidth label="Доступ к записи мероприятия" value={settings.recordingAccess} onChange={e => set('recordingAccess', e.target.value as RolePreferences['recordingAccess'])} sx={{ mt: 2, mb: 1 }}><MenuItem value="self">Только мне</MenuItem><MenuItem value="participants">Для участников</MenuItem><MenuItem value="organization">Всем из организации</MenuItem></TextField>}</Box>)}</>;
}
export function RolePreview({ name, value, products, permissions }: { name: string; value: RoleConfig; products: Record<string, boolean>; permissions: Permissions }) {
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
          <Paper variant="outlined" component="nav" aria-label="Навигация в предпросмотре" sx={{ p: 2, width: { sm: 240 }, flexShrink: 0 }}><Typography variant="subtitle1" sx={{ mb: 2 }}>Dunder Mifflin Paper Co</Typography>
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
