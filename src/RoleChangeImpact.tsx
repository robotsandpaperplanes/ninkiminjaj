import { Dialog } from './app/ModeVisibility';
import { useState } from 'react';
import { Box, Button, DialogActions, DialogContent, DialogTitle, Link, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import type { RoleChange } from './role-catalog';
export default function RoleChangeImpact({ changes, count }: { changes: RoleChange[]; count: number }) {
  const [open, setOpen] = useState(false);
  return <Box sx={{ mt: .5 }}>
    <Typography variant="caption" color="text.secondary">Изменений: {changes.length} · Сотрудников с ролью: {count} · </Typography>
    <Link component="button" type="button" variant="caption" underline="always" onClick={() => setOpen(true)}>Подробнее</Link>
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md" aria-labelledby="role-changes-title" aria-describedby="role-changes-help">
      <DialogTitle id="role-changes-title">Изменения роли</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Сотрудников с этой ролью: {count}. Итоговый доступ также зависит от других ролей, доступа к объектам и тарифа.</Typography>
        <TableContainer><Table size="small" aria-label="Изменения роли: было и стало" sx={{ tableLayout: 'fixed', '& td, & th': { overflowWrap: 'anywhere', verticalAlign: 'top', py: 1.5 } }}>
          <TableHead><TableRow><TableCell sx={{ width: '40%' }}>Поле</TableCell><TableCell>Было</TableCell><TableCell>Стало</TableCell></TableRow></TableHead>
          <TableBody>{changes.map((c, i) => <TableRow key={i}><TableCell>{c.label}</TableCell><TableCell sx={{ color: 'text.secondary' }}>{c.before}</TableCell><TableCell>{c.after}</TableCell></TableRow>)}</TableBody>
        </Table></TableContainer>
        <Typography id="role-changes-help" variant="body2" sx={{ mt: 3 }}>Изменения ещё не сохранены. Чтобы применить их, вернитесь в карточку роли и нажмите «Сохранить».</Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}><Button variant="contained" onClick={() => setOpen(false)}>Понятно</Button></DialogActions>
    </Dialog>
  </Box>;
}
