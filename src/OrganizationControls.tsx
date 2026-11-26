import { useId } from 'react';
import { Button, FormControlLabel, Stack, Switch, Typography } from '@mui/material';

export function ToggleRow({ label, description, checked, onChange }: {
  label: string; description?: string; checked: boolean; onChange: (checked: boolean) => void;
}) {
  const descriptionId = useId();
  return <FormControlLabel labelPlacement="start"
    label={<>
      <Typography component="span" display="block">{label}</Typography>
      {description && <Typography id={descriptionId} component="span" variant="body2" color="text.secondary" display="block">{description}</Typography>}
    </>}
    control={<Switch checked={checked} onChange={event => onChange(event.target.checked)}
      slotProps={{ input: { role: 'switch', 'aria-label': label, 'aria-describedby': description ? descriptionId : undefined } }} />}
    sx={{ m: 0, py: .75, gap: 1, justifyContent: 'space-between', alignItems: 'flex-start',
      '& .MuiFormControlLabel-label': { py: .75, minWidth: 0 } }}
  />;
}

export function SaveActions({ dirty, disabled = false, label = 'Сохранить', onCancel, onSave }: {
  dirty: boolean; disabled?: boolean; label?: string; onCancel: () => void; onSave: () => void;
}) {
  return <Stack direction="row" justifyContent="flex-end" flexWrap="wrap" gap={1}>
    <Button disabled={!dirty} onClick={onCancel}>Отмена</Button>
    <Button variant="contained" disabled={!dirty || disabled} onClick={onSave}>{label}</Button>
  </Stack>;
}
