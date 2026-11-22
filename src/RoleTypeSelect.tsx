import { Box, MenuItem, TextField, Typography } from '@mui/material';
import type { RoleConfig } from './role-model';
const types = [
  { value: 'user', label: 'Пользовательская', helper: 'Доступ к продуктам и рабочим функциям без административных полномочий.' },
  { value: 'admin', label: 'Административная', helper: 'Позволяет назначать отдельные административные полномочия во вкладке «Разрешения». Не даёт полный доступ автоматически.' },
];
export default function RoleTypeSelect({ value, onChange, label, disabled = false }: { disabled?: boolean; value: RoleConfig; onChange: (value: RoleConfig) => void; label: string }) {
  return <TextField disabled={disabled} select fullWidth label={label} value={value.administrative ? 'admin' : 'user'} onChange={e => onChange({ ...value, administrative: e.target.value === 'admin', adminPermissions: e.target.value === 'admin' ? value.adminPermissions : {}, adminStates: e.target.value === 'admin' ? value.adminStates : {} })} helperText={value.administrative ? 'Административные полномочия настраиваются отдельно во вкладке «Разрешения».' : 'При переходе на пользовательский тип административные полномочия сбрасываются.'} slotProps={{ select: { renderValue: selected => types.find(t => t.value === selected)?.label, MenuProps: { slotProps: { paper: { sx: { maxWidth: 'min(560px, calc(100vw - 32px))' } } } } } }}>
    {types.map(type => <MenuItem key={type.value} value={type.value} sx={{ whiteSpace: 'normal', py: 1.5, px: 2 }}><Box><Typography variant="body2" sx={{ fontWeight: 500 }}>{type.label}</Typography><Typography variant="caption" color="text.secondary" component="div" sx={{ mt: .5, lineHeight: 1.5 }}>{type.helper}</Typography></Box></MenuItem>)}
  </TextField>;
}
