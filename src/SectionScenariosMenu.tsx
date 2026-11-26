import { useState } from 'react';
import { Box, Divider, IconButton, ListItemText, Menu, MenuItem, Tooltip, Typography } from '@mui/material';
import { AppsOutlined, CheckOutlined } from '@mui/icons-material';
import { cardScenarios, listScenarios } from './role-scenarios';

export default function SectionScenariosMenu({ section, roles, card, active, onSelect, entries, disabled = false }: {
  section: string; roles?: boolean; card?: boolean; active?: string; onSelect: (id: string) => void;
  entries?: { id: string; label: string; helper?: string }[]; disabled?: boolean;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const scenarios = entries ?? (roles ? (card ? cardScenarios : listScenarios) : [{ id: 'default', label: 'По умолчанию', helper: 'Основной сценарий раздела' }]);
  return <>
    <Tooltip describeChild title="Сценарии прототипа"><span><IconButton disabled={disabled} aria-label="Сценарии прототипа" aria-haspopup="menu" aria-expanded={!!anchor} onClick={e => setAnchor(e.currentTarget)}><AppsOutlined /></IconButton></span></Tooltip>
    <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} slotProps={{ paper: { sx: { width: 360, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 90px)' } } }}>
      <Box sx={{ px: 2, py: 1 }}><Typography variant="subtitle1">{section}</Typography><Typography variant="body2" color="text.secondary">{roles ? card ? 'Сценарии карточки роли' : 'Сценарии списка ролей' : 'Сценарии раздела'}</Typography></Box>
      {scenarios.map(s => <MenuItem key={s.id} selected={roles || entries ? s.id === active : true} onClick={() => { setAnchor(null); onSelect(s.id); }} sx={{ whiteSpace: 'normal' }}><ListItemText primary={s.label} secondary={s.helper} />{(roles || entries ? s.id === active : true) && <CheckOutlined fontSize="small" color="primary" />}</MenuItem>)}
      {roles && <Divider />}
      {roles && <MenuItem disabled={!active} onClick={() => { setAnchor(null); onSelect('restore'); }}>Вернуть исходный пример</MenuItem>}
    </Menu>
  </>;
}
