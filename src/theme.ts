import { createTheme } from '@mui/material/styles';

// Neutral surfaces and dividers follow the supplied Figma CSS; Roboto stays local.
export function makeTheme(dark: boolean) {
  return createTheme({
    palette: {
      mode: dark ? 'dark' : 'light',
      primary: { main: dark ? '#90caf9' : '#1565c0' },
      background: { default: dark ? '#202020' : '#ffffff', paper: dark ? '#282828' : '#ffffff' },
      text: { primary: dark ? '#eeeeee' : 'rgba(0, 0, 0, 0.87)', secondary: dark ? '#b5b5b5' : 'rgba(0, 0, 0, 0.54)' },
      divider: dark ? '#444444' : 'rgba(0, 0, 0, 0.12)',
      success: { main: dark ? '#8dd6a5' : '#2e7d32' },
      warning: { main: dark ? '#ffca80' : '#ed6c02' },
      error: { main: dark ? '#ffb4ab' : '#d32f2f' },
      action: { hover: dark ? '#333333' : 'rgba(0, 0, 0, 0.04)', selected: dark ? '#383838' : '#e0e0e0' },
    },
    shape: { borderRadius: 8 },
    typography: {
      fontFamily: 'Roboto, Arial, sans-serif', fontSize: 14,
      h4: { fontSize: 27, lineHeight: 1.25, fontWeight: 500, letterSpacing: '-.6px' },
      h6: { fontSize: 18, lineHeight: 1.4, fontWeight: 500 },
      subtitle1: { fontSize: 14, fontWeight: 500 },
      body2: { fontSize: 13, lineHeight: 1.5 },
      button: { textTransform: 'none', fontWeight: 500 },
    },
    components: {
      MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { borderRadius: 4, minHeight: 36 } } },
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' }, outlined: { borderColor: dark ? '#444444' : '#e0e0e0' } } },
      MuiDialog: { styleOverrides: { paper: { borderRadius: 10 } } },
      MuiChip: { styleOverrides: { root: { fontSize: 11.5, height: 24, fontWeight: 400 } } },
      MuiTextField: {
        defaultProps: { size: 'small', slotProps: { inputLabel: { shrink: true } } },
        styleOverrides: {
          root: {
            // Keep the real, associated label in normal flow above the control.
            '& > .MuiInputLabel-root': {
              position: 'static', transform: 'none', transition: 'none',
              alignSelf: 'flex-start', maxWidth: '100%', marginBottom: 8,
              fontSize: 14, lineHeight: '20px', whiteSpace: 'normal',
              pointerEvents: 'auto',
            },
            '& > .MuiOutlinedInput-root': {
              borderRadius: 4,
              backgroundColor: dark ? '#2e2e2e' : '#ffffff',
              '& > .MuiOutlinedInput-notchedOutline': {
                top: 0,
                '& > legend': { display: 'none' },
              },
            },
            '& > .MuiFormHelperText-root': { marginLeft: 0, marginRight: 0 },
          },
        },
      },
      MuiTableCell: { styleOverrides: { root: { borderColor: dark ? '#444444' : 'rgba(0, 0, 0, 0.12)' }, head: { fontSize: 12, fontWeight: 500, color: dark ? '#b5b5b5' : 'rgba(0, 0, 0, 0.54)' }, body: { fontSize: 14 } } },
      MuiTooltip: { defaultProps: { arrow: true } },
    },
  });
}
