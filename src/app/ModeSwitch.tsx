import { useEffect, useState } from 'react';
import { Button, Menu, MenuItem, ListItemText } from '@mui/material';
import { CheckOutlined, ExpandMoreOutlined } from '@mui/icons-material';

export default function ModeSwitch({ mode, onChange }: { mode: 'cloud' | 'on-prem'; onChange: (mode: 'cloud' | 'on-prem') => void }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  useEffect(() => { setAnchor(null); }, [mode]);
  return <>
    <Button color="inherit" variant="outlined" size="small" aria-label={'Режим администрирования: ' + (mode === 'cloud' ? 'Облако' : 'Сервер')} aria-haspopup="menu" aria-expanded={!!anchor} endIcon={<ExpandMoreOutlined />} onClick={e => setAnchor(e.currentTarget)} sx={{ flexShrink: 0, px: 1 }}>
      {mode === 'cloud' ? 'Облако' : 'Сервер'}
    </Button>
    <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
      {(['cloud', 'on-prem'] as const).map(value => <MenuItem key={value} selected={mode === value} onClick={() => { setAnchor(null); onChange(value); }}>
        <ListItemText>{value === 'cloud' ? 'Облачное администрирование' : 'Серверное администрирование'}</ListItemText>
        {mode === value && <CheckOutlined color="primary" fontSize="small" sx={{ ml: 2 }} />}
      </MenuItem>)}
    </Menu>
  </>;
}
