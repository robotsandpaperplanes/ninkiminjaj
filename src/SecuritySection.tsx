import { Typography } from '@mui/material';

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

export default function SecuritySection() {
  return <>
    <Typography component="h1" variant="h4" sx={{ mb: 2.5 }}>Безопасность</Typography>
    <Typography variant="body2" color="text.secondary">Раздел «Безопасность» пока не представлен.</Typography>
  </>;
}
