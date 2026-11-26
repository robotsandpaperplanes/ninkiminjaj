import { useEffect, useId, useState, type RefObject } from 'react';
import {
  Alert, Box, Button, Checkbox, DialogActions, DialogContent, DialogTitle,
  Divider, FormControlLabel, FormGroup, FormHelperText, Paper, Stack, Tab, Tabs, Typography,
} from '@mui/material';
import { Dialog } from './app/ModeVisibility';
import { SaveActions, ToggleRow } from './OrganizationControls';

const tabs = [
  ['connection', 'Способы подключения'],
  ['files', 'Файлы'],
  ['dlp', 'DLP'],
] as const;
type SecurityTab = typeof tabs[number][0];
const fileTypes = ['PDF', 'DOCX', 'XLSX', 'PPTX', 'PNG', 'JPEG', 'ZIP'] as const;
type FileType = typeof fileTypes[number];

export const SECURITY_STORAGE = 'mts-link-admin-security-v1';
export function createSecurityState() {
  return { mobileBrowser: true, allowedFileTypes: [...fileTypes] as FileType[], externalFileTransfer: true, dlpEnabled: false };
}
type SecurityState = ReturnType<typeof createSecurityState>;

export function loadSecurityState(): SecurityState {
  const defaults = createSecurityState();
  try {
    const saved: Partial<SecurityState> | null = JSON.parse(localStorage.getItem(SECURITY_STORAGE) ?? 'null');
    if (!saved) return defaults;
    return {
      mobileBrowser: typeof saved.mobileBrowser === 'boolean' ? saved.mobileBrowser : defaults.mobileBrowser,
      allowedFileTypes: Array.isArray(saved.allowedFileTypes)
        ? fileTypes.filter(type => saved.allowedFileTypes?.includes(type)) : defaults.allowedFileTypes,
      externalFileTransfer: typeof saved.externalFileTransfer === 'boolean' ? saved.externalFileTransfer : defaults.externalFileTransfer,
      dlpEnabled: typeof saved.dlpEnabled === 'boolean' ? saved.dlpEnabled : defaults.dlpEnabled,
    };
  } catch { return defaults; }
}

export default function SecuritySection({ state, onSave, notify, leaveRef }: {
  state: SecurityState;
  onSave: (state: SecurityState) => void;
  notify: (message: string) => void;
  leaveRef: RefObject<((after?: () => void) => void) | null>;
}) {
  const [tab, setTab] = useState<SecurityTab>('connection');
  const [draft, setDraft] = useState(state);
  const [blocked, setBlocked] = useState(false);
  const [configurationOpen, setConfigurationOpen] = useState(false);
  const fileHelpId = useId();
  const dirty = JSON.stringify(draft) !== JSON.stringify(state);

  useEffect(() => {
    if (!dirty) return;
    leaveRef.current = () => setBlocked(true);
    return () => { leaveRef.current = null; };
  }, [dirty, leaveRef]);

  function change<K extends keyof SecurityState>(key: K, value: SecurityState[K]) {
    setDraft(previous => ({ ...previous, [key]: value }));
    setBlocked(false);
  }

  const panels = {
    connection: <ToggleRow label="Разрешить подключение через мобильный браузер"
      description="Разрешает участникам подключаться к встречам через браузер мобильного устройства. Ограничение действует на уровне всей организации."
      checked={draft.mobileBrowser} onChange={checked => change('mobileBrowser', checked)} />,
    files: <>
      <Box component="fieldset" aria-describedby={fileHelpId} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
        <Typography component="legend" sx={{ p: 0 }}>Разрешённые типы файлов</Typography>
        <FormHelperText id={fileHelpId} sx={{ mx: 0 }}>
          Определяет типы файлов, которые сотрудники могут загружать и передавать в продуктах организации.
        </FormHelperText>
        <FormGroup row sx={{ mt: 1, columnGap: 1 }}>
          {fileTypes.map(type => <FormControlLabel key={type} label={type} control={
            <Checkbox checked={draft.allowedFileTypes.includes(type)} onChange={(_, checked) =>
              change('allowedFileTypes', fileTypes.filter(item => item === type ? checked : draft.allowedFileTypes.includes(item)))} />
          } />)}
        </FormGroup>
      </Box>
      <Divider />
      <ToggleRow label="Передача файлов внешним пользователям"
        description="Разрешает передавать файлы пользователям за пределами организации с учётом действующих полномочий сотрудников."
        checked={draft.externalFileTransfer} onChange={checked => change('externalFileTransfer', checked)} />
    </>,
    dlp: <>
      <ToggleRow label="Контроль передачи конфиденциальных файлов"
        description="Проверяет передачу файлов в соответствии с политиками защиты данных организации."
        checked={draft.dlpEnabled} onChange={checked => change('dlpEnabled', checked)} />
      <Button variant="outlined" onClick={() => setConfigurationOpen(true)} sx={{ alignSelf: 'flex-start' }}>Настроить политики DLP</Button>
    </>,
  };

  return <>
    <Typography component="h1" variant="h4" sx={{ mb: 2.5 }}>Безопасность</Typography>
    <Tabs value={tab} onChange={(_, next: SecurityTab) => setTab(next)} aria-label="Разделы безопасности"
      variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
      {tabs.map(([key, label]) => <Tab key={key} value={key} label={label} id={`security-tab-${key}`} aria-controls={`security-panel-${key}`} />)}
    </Tabs>
    <Stack spacing={2.5} sx={{ maxWidth: 652 }}>
      {blocked && dirty && <Alert severity="warning">Сохраните или отмените изменения, чтобы продолжить.</Alert>}
      <Paper variant="outlined" role="tabpanel" id={`security-panel-${tab}`} aria-labelledby={`security-tab-${tab}`}
        sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={2}>{panels[tab]}</Stack>
      </Paper>
      <SaveActions dirty={dirty} onCancel={() => { setDraft(state); setBlocked(false); }}
        onSave={() => { onSave(draft); setBlocked(false); notify('Изменения сохранены'); }} />
    </Stack>
    <Dialog open={configurationOpen} onClose={() => setConfigurationOpen(false)} aria-labelledby="dlp-configuration-title" fullWidth maxWidth="xs">
      <DialogTitle id="dlp-configuration-title">Политики DLP</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">Демонстрационный раздел настройки политик защиты данных организации.</Typography>
      </DialogContent>
      <DialogActions><Button onClick={() => setConfigurationOpen(false)}>Закрыть</Button></DialogActions>
    </Dialog>
  </>;
}
