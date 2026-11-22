import { Box, Stack, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material';
import { CheckRounded, CloseRounded } from '@mui/icons-material';
import type { PermissionState } from './multi-model';
const options = [
  { value: 'deny', label: 'Запрещено', color: 'error.main', icon: <CloseRounded sx={{ fontSize: 18 }} /> },
  { value: 'unset', label: 'Не задано', color: 'text.secondary', icon: <Box component="span" aria-hidden="true" sx={{ fontSize: 20, lineHeight: '18px', fontWeight: 400 }}>/</Box> },
  { value: 'allow', label: 'Разрешено', color: 'success.main', icon: <CheckRounded sx={{ fontSize: 18 }} /> },
] as const;
export function PermissionControl({ label, value, onChange, administrative = false, disabled = false, setting = false }: { setting?: boolean; label: string; value: PermissionState; onChange: (value: PermissionState) => void; administrative?: boolean; disabled?: boolean }) {
  return <ToggleButtonGroup exclusive size="small" value={value} disabled={disabled} aria-label={label} onChange={(_, next: PermissionState | null) => { if (next) onChange(next); }} sx={{ flexShrink: 0, bgcolor: 'background.paper' }}>
    {options.filter(o => !administrative || o.value !== 'deny').map(option => { const o = { ...option, label: setting ? ({ deny: 'Выключено', unset: 'Не задано', allow: 'Включено' }[option.value]) : option.label }; return <Tooltip key={o.value} title={disabled ? '' : o.label}><ToggleButton value={o.value} aria-label={label + ': ' + o.label} sx={{ width: 38, height: 32, color: o.color, '&.Mui-selected': { color: o.color, bgcolor: 'action.selected', boxShadow: 'inset 0 -2px currentColor' }, '&.Mui-selected:hover': { bgcolor: 'action.hover' } }}>{o.icon}</ToggleButton></Tooltip>; })}
  </ToggleButtonGroup>;
}
export function PermissionRow({ label, description, ...props }: { label: string; description?: string; setting?: boolean; value: PermissionState; onChange: (value: PermissionState) => void; administrative?: boolean; disabled?: boolean }) {
  return <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" sx={{ py: 1.75 }}><Box><Typography>{label}</Typography>{description && <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>{description}</Typography>}</Box><PermissionControl label={label} {...props} /></Stack>;
}
