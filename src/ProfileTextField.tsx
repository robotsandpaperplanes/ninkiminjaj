import { useState } from 'react';
import type { StandardTextFieldProps } from '@mui/material';
import { TextField } from './app/ModeVisibility';

type Props = Omit<StandardTextFieldProps, 'label' | 'value' | 'defaultValue' | 'select'> & {
  label: string;
  value?: string;
};

// Scope floating labels to the underlined profile forms. The Cloud theme uses
// permanently raised labels for other forms.
const fieldStyle = {
  '&& > .MuiInputLabel-root': {
    position: 'absolute',
    top: 0,
    left: 0,
    m: 0,
    transform: 'translateY(16px)',
    fontSize: 16,
    lineHeight: '24px',
    whiteSpace: 'nowrap',
    transition: 'transform 150ms, font-size 150ms',
  },
  '&& > .MuiInputLabel-shrink': {
    transform: 'translateY(0)',
    fontSize: 12,
    lineHeight: '16px',
  },
  '&& > .MuiInput-root': { mt: 0, height: 48, alignItems: 'flex-end' },
  '& .MuiInput-input': { fontSize: 16, height: 24, lineHeight: '24px', pt: 0, pb: 1 },
} as const;

export default function ProfileTextField({ label, value = '', onFocus, onBlur, slotProps, sx, ...props }: Props) {
  const [focused, setFocused] = useState(false);

  return <TextField
    {...props}
    variant="standard"
    label={label}
    value={value}
    onFocus={event => { setFocused(true); onFocus?.(event); }}
    onBlur={event => { setFocused(false); onBlur?.(event); }}
    slotProps={{ ...slotProps, inputLabel: { shrink: focused || value !== '' } }}
    sx={[fieldStyle, ...(Array.isArray(sx) ? sx : [sx ?? {}])]}
  />;
}
