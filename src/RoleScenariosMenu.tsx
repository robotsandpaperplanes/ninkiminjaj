import { useState } from 'react';
import { Box, Divider, IconButton, ListItemText, Menu, MenuItem, Tooltip, Typography } from '@mui/material';
import { CheckOutlined, ScienceOutlined } from '@mui/icons-material';
import { cardScenarios, listScenarios } from './role-scenarios';
export default function RoleScenariosMenu({ card, active, onSelect }: { card: boolean; active?: string; onSelect: (id: string) => void }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return <>
    <Tooltip title="Сценарии прототипа"><IconButton aria-label="Сценарии прототипа" aria-haspopup="menu" aria-expanded={!!anchor} color={active ? 'primary' : 'default'} onClick={e => setAnchor(e.currentTarget)}><ScienceOutlined /></IconButton></Tooltip>
    <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} slotProps={{ paper: { sx: { width: 360, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 90px)' } } }}>
      <Box sx={{ px: 2, py: 1 }}><Typography variant="subtitle1">{card ? 'Сценарии карточки роли' : 'Сценарии списка ролей'}</Typography><Typography variant="caption" color="text.secondary">Отдельные демонстрационные данные</Typography></Box>
      {(card ? cardScenarios : listScenarios).map(s => <MenuItem key={s.id} selected={s.id === active} onClick={() => { setAnchor(null); onSelect(s.id); }} sx={{ whiteSpace: 'normal' }}><ListItemText primary={s.label} secondary={s.helper} />{s.id === active && <CheckOutlined fontSize="small" color="primary" />}</MenuItem>)}
      <Divider /><MenuItem disabled={!active} onClick={() => { setAnchor(null); onSelect('restore'); }}>Вернуть исходный пример</MenuItem>
    </Menu>
  </>;
}
