import { useEffect, useRef, useState } from 'react';
import { Box, Button, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, LinearProgress, Paper, Stack, Typography } from '@mui/material';
import { ContentCopyOutlined, ImageOutlined } from '@mui/icons-material';
import { Dialog } from './app/ModeVisibility';
import ProfileTextField from './ProfileTextField';
import { SaveActions, ToggleRow } from './OrganizationControls';
import { organizationInvitationUrl, rotateOrganizationInvitation, type OrganizationOverviewData, type OrganizationState } from './organization-model';

const logoFormats = ['image/png', 'image/jpeg', 'image/svg+xml'];
const storageNumber = new Intl.NumberFormat('ru-RU');

export default function OrganizationOverview({ draft, state, dirty, onChange, onSave, onCancel, notify }: {
  draft: OrganizationOverviewData;
  state: OrganizationState;
  dirty: boolean;
  onChange: (value: OrganizationOverviewData) => void;
  onSave: () => void;
  onCancel: () => void;
  notify: (message: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [savedLogo, setSavedLogo] = useState<File | null>(null);
  const [pendingLogo, setPendingLogo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageError, setImageError] = useState(false);
  const [rotateOpen, setRotateOpen] = useState(false);
  const previewFile = pendingLogo ?? savedLogo;
  const invitationUrl = organizationInvitationUrl(draft.invitation.token);

  useEffect(() => {
    setImageError(false);
    if (!previewFile) { setPreviewUrl(''); return; }
    const url = URL.createObjectURL(previewFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [previewFile]);

  function chooseLogo(file?: File) {
    if (!file) return;
    if (!logoFormats.includes(file.type)) {
      notify('Выберите изображение PNG, JPG или SVG');
      return;
    }
    setPendingLogo(file);
    onChange({ ...draft, logoReference: file.name });
  }

  async function copyInvitation() {
    try { await navigator.clipboard.writeText(invitationUrl); notify('Демонстрационная ссылка скопирована'); }
    catch { notify('Не удалось скопировать ссылку'); }
  }

  return <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 2fr) minmax(0, 1fr)' }, gap: 3, alignItems: 'start' }}>
    <Stack spacing={3} sx={{ minWidth: 0 }}>
      <Stack spacing={2}>
        <ProfileTextField label="Название организации" value={draft.name} required
          onChange={event => onChange({ ...draft, name: event.target.value })} />
        <ProfileTextField label="Страница организации" value={state.slug} slotProps={{ input: { readOnly: true } }} />
      </Stack>
      <Stack spacing={1.5} component="section" aria-labelledby="organization-logo">
        <Typography id="organization-logo" component="h2" variant="h6">Логотип</Typography>
        <Box onDragOver={event => event.preventDefault()} onDrop={event => {
          event.preventDefault();
          chooseLogo(event.dataTransfer.files[0]);
        }} sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          {(['Светлый фон', 'Тёмный фон'] as const).map((label, index) => (
            <Box key={label} aria-label={label} sx={{
              display: 'grid', placeItems: 'center', p: 2, minWidth: 0, height: { xs: 104, sm: 152 },
              border: '1px dashed', borderColor: index ? 'grey.600' : 'grey.400',
              bgcolor: index ? 'grey.800' : 'common.white', color: index ? 'grey.400' : 'grey.600',
            }}>
              {previewUrl && !imageError
                ? <Box component="img" src={previewUrl} alt={`Логотип — ${label.toLocaleLowerCase('ru')}`}
                    onError={() => setImageError(true)} sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                : <ImageOutlined sx={{ fontSize: 48 }} />}
            </Box>
          ))}
        </Box>
        <Box>
          <input ref={input} type="file" hidden accept={logoFormats.join(',')} onChange={event => {
            chooseLogo(event.target.files?.[0]);
            event.target.value = '';
          }} />
          <Button onClick={() => input.current?.click()} sx={{ px: 0 }}>Добавить логотип</Button>
          <Typography variant="body2" color="text.secondary">Перетащите файл или выберите PNG, JPG или SVG. Рекомендуемый размер — 200 × 50 пикселей.</Typography>
          {draft.logoReference && <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
            {draft.logoReference}{!previewFile && ' · для предпросмотра выберите файл повторно'}
          </Typography>}
          {imageError && <Typography variant="body2" color="error" role="alert">Не удалось открыть изображение.</Typography>}
        </Box>
      </Stack>
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={1.5}>
          <Typography component="h2" variant="h6">Ссылка для приглашения в организацию</Typography>
          <ProfileTextField fullWidth label="Демонстрационная ссылка" value={invitationUrl}
            sx={{ '& .MuiInput-input': { textOverflow: 'ellipsis' } }}
            slotProps={{ input: { readOnly: true, endAdornment: <InputAdornment position="end">
              <IconButton onClick={copyInvitation} edge="end" aria-label="Скопировать ссылку"><ContentCopyOutlined fontSize="small" /></IconButton>
            </InputAdornment> } }} />
          <Box><Button onClick={() => setRotateOpen(true)} sx={{ px: 0 }}>Сбросить ссылку</Button></Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
            <Typography>Защита ссылки паролем</Typography>
            <Button disabled>Установить</Button>
          </Stack>
          <Typography variant="body2" color="text.secondary">Защита паролем недоступна для демонстрационной ссылки.</Typography>
        </Stack>
      </Paper>
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
        <ToggleRow label="Разрешать добавляться сотрудникам по домену" description="Настройка сохраняется в демоверсии."
          checked={draft.domainJoining} onChange={domainJoining => onChange({ ...draft, domainJoining })} />
      </Paper>
      <SaveActions dirty={dirty || Boolean(pendingLogo)} disabled={!draft.name.trim() || imageError}
        onCancel={() => { setPendingLogo(null); onCancel(); }}
        onSave={() => { if (pendingLogo) setSavedLogo(pendingLogo); setPendingLogo(null); onSave(); }} />
    </Stack>
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Stack spacing={2}>
        <Stack direction="row" flexWrap="wrap" alignItems="center" justifyContent="space-between" gap={1}>
          <Typography component="h2" variant="h6">Файлы</Typography><Button disabled>Добавить тариф</Button>
        </Stack>
        <LinearProgress variant="determinate" color="success" aria-label="Использование хранилища"
          value={Math.min(100, state.storage.usedGb / state.storage.quotaGb * 100)} sx={{ borderRadius: 1 }} />
        <Stack direction="row" flexWrap="wrap" justifyContent="space-between" gap={1}>
          <Typography variant="body2" color="text.secondary">{storageNumber.format(state.storage.usedGb)} ГБ используется</Typography>
          <Typography variant="body2" color="text.secondary">из {storageNumber.format(state.storage.quotaGb)} ГБ</Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">Демонстрационные данные</Typography>
      </Stack>
    </Paper>
    <Dialog open={rotateOpen} onClose={() => setRotateOpen(false)} maxWidth="xs" fullWidth aria-labelledby="organization-invite-rotate">
      <DialogTitle id="organization-invite-rotate">Создать новую ссылку?</DialogTitle>
      <DialogContent>Новая демонстрационная ссылка заменит предыдущую после сохранения изменений.</DialogContent>
      <DialogActions>
        <Button onClick={() => setRotateOpen(false)}>Отмена</Button>
        <Button onClick={() => {
          onChange({ ...draft, invitation: rotateOrganizationInvitation(draft.invitation) });
          setRotateOpen(false);
        }}>Создать ссылку</Button>
      </DialogActions>
    </Dialog>
  </Box>;
}
