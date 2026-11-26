import { useContext, useId, useRef, useState, type FormEvent } from 'react';
import { Avatar, Box, Button, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, Stack, Switch, Typography } from '@mui/material';
import { Dialog, TextField } from './app/ModeVisibility';
import { OrganizationIdentity } from './app/OrganizationIdentity';
import { employeeInitials, systemProfileFields, type Employee, type EmployeeProfileField } from './employee-data';
import ProfileTextField from './ProfileTextField';

type ProfileUpdate = Pick<Employee, 'name' | 'email'>;

export function EmployeeAvatar({ employee, size }: { employee: Employee; size: number }) {
  return <Avatar src={employee.avatar} aria-hidden="true" sx={{
    bgcolor: 'action.selected', color: 'text.secondary', width: size, height: size, fontSize: 16,
  }}>{employeeInitials(employee.name)}</Avatar>;
}

export default function EmployeeProfileDialog({ employee, profileFields, onClose, onSave, isEmailTaken }: {
  employee: Employee;
  profileFields: EmployeeProfileField[];
  onClose: () => void;
  onSave: (update: ProfileUpdate) => void;
  isEmailTaken: (email: string) => boolean;
}) {
  const titleId = useId();
  const organizationName = useContext(OrganizationIdentity);
  const originalName = employee.name.trim();
  const firstSpace = originalName.search(/\s/);
  const originalFirstName = firstSpace === -1 ? originalName : originalName.slice(0, firstSpace);
  const originalLastName = firstSpace === -1 ? '' : originalName.slice(firstSpace).trimStart();
  const [firstName, setFirstName] = useState(originalFirstName);
  const [lastName, setLastName] = useState(originalLastName);
  const [email, setEmail] = useState(employee.email);
  const [emailError, setEmailError] = useState('');
  const emailInput = useRef<HTMLInputElement>(null);
  const actions = { textTransform: 'uppercase' };

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextEmail = email.trim();
    if (!firstName.trim() || !nextEmail) return;
    const invalidEmail = emailInput.current?.validity.typeMismatch;
    const duplicateEmail = nextEmail !== employee.email && isEmailTaken(nextEmail);
    if (invalidEmail || duplicateEmail) {
      setEmailError(invalidEmail ? 'Введите корректный адрес электронной почты' : 'Эта почта уже используется');
      emailInput.current?.focus();
      return;
    }
    const name = firstName === originalFirstName && lastName === originalLastName
      ? employee.name
      : [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
    onSave({ name, email: nextEmail });
  }

  return <Dialog open onClose={onClose} aria-labelledby={titleId} fullWidth maxWidth={false} scroll="paper"
    slotProps={{ paper: { sx: {
      m: { xs: 2, sm: '40px' }, width: { xs: 'calc(100% - 32px)', sm: 640 },
      maxWidth: { xs: 'none', sm: 'calc(100% - 80px)' },
      height: { xs: 'calc(100dvh - 32px)', sm: 'calc(100dvh - 80px)' },
      maxHeight: { xs: 'calc(100dvh - 32px)', sm: 'calc(100dvh - 80px)' },
    } } }}>
    <Box component="form" noValidate onSubmit={save} sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <DialogTitle id={titleId} sx={{ px: { xs: 2, sm: 3 }, display: 'flex', alignItems: 'center', fontSize: 20, minHeight: { xs: 64, sm: 80 }, borderBottom: 1, borderColor: 'divider' }}>
        Профиль
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: 2, overscrollBehavior: 'contain', '.MuiDialogTitle-root + &': { pt: 2 } }}>
        <Stack direction="row" alignItems="center" useFlexGap flexWrap="wrap" gap={2} sx={{ mb: 2 }}>
          <EmployeeAvatar employee={employee} size={56} />
          <Stack direction="row" useFlexGap flexWrap="wrap" columnGap={1}>
            <Button disabled>Загрузить новую фотографию</Button>
            <Button color="error" disabled>Удалить</Button>
          </Stack>
        </Stack>

        <Box sx={{
          display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' },
          columnGap: 2, rowGap: 1.5,
        }}>
          <ProfileTextField autoFocus required label={systemProfileFields.firstName} value={firstName}
            onChange={event => setFirstName(event.target.value)} />
          <ProfileTextField disabled label={`${systemProfileFields.patronymic} (не обязательно)`} />
          <ProfileTextField label={systemProfileFields.lastName} value={lastName}
            onChange={event => setLastName(event.target.value)} sx={{ gridColumn: '1' }} />
          <ProfileTextField disabled label={systemProfileFields.displayName} sx={{ gridColumn: '1 / -1' }} />
          <ProfileTextField disabled label={systemProfileFields.phone} sx={{ gridColumn: '1 / -1' }} />
          <ProfileTextField required type="email" label={systemProfileFields.email} value={email} inputRef={emailInput}
            error={Boolean(emailError)} helperText={emailError || undefined} slotProps={{ formHelperText: { role: 'alert' } }}
            onChange={event => { setEmail(event.target.value); setEmailError(''); }} sx={{ gridColumn: '1 / -1' }} />
          <Button disabled sx={{ justifySelf: 'start', px: 0 }}>Изменить пароль</Button>
          <ProfileTextField label={systemProfileFields.organization} value={organizationName}
            slotProps={{ input: { readOnly: true } }} sx={{ gridColumn: '1 / -1' }} />
          <ProfileTextField disabled label={systemProfileFields.jobTitle} sx={{ gridColumn: '1 / -1' }} />
          <ProfileTextField disabled label={systemProfileFields.about} sx={{ gridColumn: '1 / -1' }} />
          {profileFields.map(field => {
            const value = employee.customFieldValues?.[field.id];
            return <ProfileTextField key={field.id} label={field.name} value={typeof value === 'string' ? value : ''}
              helperText={field.hint || undefined} slotProps={{ input: { readOnly: true } }} sx={{ gridColumn: '1 / -1' }} />;
          })}
        </Box>

        <Typography variant="h6" component="h3" sx={{ mt: 4, mb: 1 }}>Настройки</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Индивидуальные настройки недоступны в демоверсии.</Typography>
        <Typography component="h4" fontWeight={500}>Мероприятие</Typography>
        <Stack spacing={2} sx={{ mt: 1.5 }}>
          <UnavailableSetting label="Запускать запись при старте мероприятия" />
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
            <Typography component="label" htmlFor={`${titleId}-recording`}>Доступ к записи мероприятия</Typography>
            <TextField id={`${titleId}-recording`} select disabled variant="standard" value="" slotProps={{ select: { native: true } }}>
              <option value="">—</option>
            </TextField>
          </Stack>
        </Stack>
        <Divider sx={{ my: 2.5 }} />
        <Typography component="h4" fontWeight={500}>Подключение к встрече</Typography>
        <Stack spacing={2} sx={{ mt: 1.5 }}>
          <UnavailableSetting label="Включать мою камеру при подключении" />
          <UnavailableSetting label="Включать мой микрофон при подключении" />
          <UnavailableSetting label="Разрешить подключаться через мобильный браузер" />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: { xs: 2, sm: 3 }, minHeight: { xs: 64, sm: 84 }, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onClose} sx={actions}>Отмена</Button>
        <Button type="submit" disabled={!firstName.trim() || !email.trim()} sx={actions}>Сохранить</Button>
      </DialogActions>
    </Box>
  </Dialog>;
}

function UnavailableSetting({ label }: { label: string }) {
  return <FormControlLabel disabled labelPlacement="start" control={<Switch />} label={label}
    sx={{ m: 0, justifyContent: 'space-between', gap: 2, '& .MuiFormControlLabel-label.Mui-disabled': { color: 'text.primary' } }} />;
}
