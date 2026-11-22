import { permissionState, productState, preferenceState, recordingValue, communicationState } from './role-states';
import { roleSections, rightEnabled, rightScope } from './role-catalog';
import { Box, Divider, Paper, Stack, Tooltip, Typography } from '@mui/material';
import { CheckRounded, CloseRounded, RemoveRounded, InfoOutlined } from '@mui/icons-material';
import type { Permissions } from './group-model';
import { everyoneSettings, quotaCatalog, type RoleConfig, type RolePreferences } from './role-model';

type Row = { label: string; status: boolean | null; detail?: string };
function StatusRow({ label, status, detail }: Row) {
  const Icon = status === true ? CheckRounded : status === false ? CloseRounded : RemoveRounded;
  const state = status === true ? 'Включено' : status === false ? 'Не предоставлено или выключено' : 'Нейтрально или не определено';
  return <Stack direction="row" gap={1} alignItems="flex-start" sx={{ py: .6 }}><Tooltip title={state}><Icon aria-label={state} sx={{ fontSize: 17, mt: .15, flexShrink: 0, color: status === true ? 'success.main' : status === false ? 'error.main' : 'text.disabled' }} /></Tooltip><Box><Typography variant="body2">{label}</Typography>{detail && <Typography variant="caption" color="text.secondary">{detail}</Typography>}</Box></Stack>;
}
function Category({ title, rows }: { title: string; rows: Row[] }) {
  if (!rows.length) return null;
  return <Box sx={{ mt: 1.5 }}><Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{title}</Typography>{rows.map(r => <StatusRow key={r.label} {...r} />)}</Box>;
}
export function RoleExplanation({ name, section, value, products, permissions }: { name: string; section: string; value: RoleConfig; products: Record<string, boolean>; permissions: Permissions }) {
  const rights: Row[] = roleSections.filter(s => s.product === section).flatMap(s => s.items).map(i => ({ label: i.label, status: permissionState(i, value, permissions) === 'unset' ? null : rightEnabled(i, value, permissions), detail: i.scope && rightEnabled(i, value, permissions) ? i.scope[rightScope(i, value) === 'own' ? 0 : 1] : undefined }));
  if (section === 'Чаты') rights.push({ label: 'Личные сообщения и звонки', status: communicationState(value, permissions) === 'unset' ? null : communicationState(value, permissions) === 'allow', detail: communicationState(value, permissions) === 'unset' ? 'Не задано этой ролью' : communicationState(value, permissions) === 'deny' ? 'Запрещено этой ролью' : permissions.communication === 'groups' ? 'С сотрудниками выбранных ролей' : 'Со всеми сотрудниками' });
  const settingLabels: { key: keyof RolePreferences; label: string }[] = [{ key: 'autoRecord', label: 'Автозапись' }, { key: 'autoTranscript', label: 'Расшифровка' }, { key: 'recordingAccess', label: 'Доступ к записи' }, { key: 'camera', label: 'Камера при входе' }, { key: 'microphone', label: 'Микрофон при входе' }, { key: 'desktopSelf', label: 'Десктопное приложение' }, { key: 'desktopParticipants', label: 'Десктоп для участников' }, { key: 'addToCalendar', label: 'Добавление в календарь' }, { key: 'meetingsHome', label: 'Кабинет встреч по умолчанию' }];
  const toRow = ({ key, label }: typeof settingLabels[number]): Row => ({ label, status: key === 'recordingAccess' || preferenceState(key, value) === 'unset' ? null : preferenceState(key, value) === 'allow', detail: key === 'recordingAccess' ? { unset: 'Не задано этой ролью', self: 'Только мне', participants: 'Для участников', organization: 'Всем из организации' }[recordingValue(value)] : preferenceState(key, value) === 'unset' ? 'Не задано этой ролью' : undefined });
  const ownSettings = section === 'Встречи' ? settingLabels.filter(s => (s.key === 'recordingAccess' ? recordingValue(value) !== 'unset' : preferenceState(s.key, value) !== 'unset')).map(toRow) : [];
  const baseSettings = section === 'Встречи' ? settingLabels.filter(s => (s.key === 'recordingAccess' ? recordingValue(value) === 'unset' : preferenceState(s.key, value) === 'unset')).map(toRow) : [];
  const selectedQuota = section === 'Встречи' ? quotaCatalog.meetings.find(q => q.id === value.meetingQuota) : section === 'Диск' ? quotaCatalog.disk.find(q => q.id === value.diskQuota) : undefined;
  const quotaRows: Row[] = (section === 'Встречи' || section === 'Диск') ? [{ label: selectedQuota ? selectedQuota.name : 'Квота не выбрана', status: null, detail: selectedQuota?.detail || 'Не означает безлимит' }] : [];
  return <Paper component="aside" aria-label="Почему это доступно" variant="outlined" sx={{ p: 2.25, borderRadius: 2, boxShadow: '0 4px 20px rgba(20,40,70,.06)' }}>
    <Stack direction="row" alignItems="center" gap={1}><InfoOutlined fontSize="small" color="primary" /><Typography component="h2" variant="subtitle1">Почему это доступно</Typography></Stack>
    <Typography variant="caption" color="text.secondary">{section} · текущие значения</Typography>
    <Divider sx={{ my: 2 }} />
    <Typography variant="subtitle2">Роль «{name}»</Typography><Typography variant="caption" color="text.secondary">Источник разрешений и значений ниже</Typography>
    <Category title="Доступ к продукту" rows={[{ label: section, status: productState(section, value, products) === 'unset' ? null : productState(section, value, products) === 'allow', detail: productState(section, value, products) === 'unset' ? 'Не задано этой ролью' : undefined }]} />
    <Category title="Разрешения" rows={rights} />
    <Category title="Квота" rows={quotaRows} />
    <Category title="Настройки" rows={ownSettings} />
    {!!baseSettings.length && <><Divider sx={{ my: 2 }} /><Typography variant="subtitle2">Не задано этой ролью</Typography><Typography variant="caption" color="text.secondary">Значение определяется другими назначениями и базовыми настройками</Typography><Category title="Настройки" rows={baseSettings} /></>}
    <Divider sx={{ my: 2 }} /><Typography variant="subtitle2">Тариф организации</Typography><Typography variant="caption" color="text.secondary">Общий ресурс для квот продуктов</Typography><StatusRow label="Остаток тарифа не загружен" status={null} />
    <Divider sx={{ my: 2 }} /><Typography variant="caption" color="text.secondary">Галочка — включено. Крестик — выключено или не предоставлено этой ролью. Серый знак — нейтральное значение или нет данных.</Typography>
    <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1 }}>Просмотр одной роли. Другие роли и индивидуальные настройки сотрудника не учитываются.</Typography>
  </Paper>;
}
