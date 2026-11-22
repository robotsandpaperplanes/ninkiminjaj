import { useEffect, useRef, type ReactNode } from 'react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { SaveOutlined, WarningAmberRounded } from '@mui/icons-material';

export default function UnsavedChangesBar({ visible, attention, onSave, onCancel, impact, errorText }: { errorText?: string; impact?: ReactNode; visible: boolean; attention: number; onSave: () => void; onCancel: () => void }) {
  const saveButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (visible && attention > 0) saveButton.current?.focus({ preventScroll: true });
  }, [attention, visible]);
  if (!visible) return null;
  return <>
    <Box aria-hidden="true" sx={{ height: { xs: 144, sm: 104 } }} />
    <Box sx={{ position: 'fixed', bottom: { xs: 12, sm: 24 }, left: { xs: 16, sm: 24, md: 280 }, right: { xs: 16, sm: 24, md: 40 }, zIndex: 1100, pointerEvents: 'none' }}>
      <Paper key={attention} role="region" aria-label="Несохранённые изменения" elevation={6} className={attention ? 'save-bar save-bar-attention' : 'save-bar'} sx={{ maxWidth: 1420, mx: 'auto', px: { xs: 2, sm: 2.5 }, py: 1.5, border: 1, borderColor: attention ? 'warning.main' : (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,.2)' : 'rgba(130,100,50,.24)', borderRadius: 2, pointerEvents: 'auto', boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 8px 32px rgba(0,0,0,.4)' : '0 8px 32px rgba(0,0,0,.16)', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(58,57,55,.88)' : 'rgba(255,251,243,.9)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', '@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))': { bgcolor: (theme) => theme.palette.mode === 'dark' ? '#3a3937' : '#fffbf3' } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between" gap={1.5}>
          <Stack direction="row" alignItems="center" gap={1}><WarningAmberRounded fontSize="small" sx={{ color: 'warning.main' }} /><Box><Typography variant="body2" role="status">{attention ? 'Сохраните или отмените изменения, чтобы продолжить' : 'Есть несохранённые изменения'}</Typography>{errorText && <Typography role="alert" variant="caption" color="error.main" component="div">{errorText}</Typography>}{impact}</Box></Stack>
          <Stack direction="row" justifyContent="flex-end" gap={1} flexShrink={0}>
            <Button color="inherit" onClick={onCancel}>Отменить изменения</Button>
            <Button ref={saveButton} variant="contained" startIcon={<SaveOutlined />} onClick={onSave}>Сохранить</Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  </>;
}
