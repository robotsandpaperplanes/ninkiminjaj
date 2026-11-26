import type { ReactNode } from 'react';
import { Avatar, Box, Button, IconButton, Stack, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography, type SxProps, type Theme } from '@mui/material';
import { AddLinkOutlined, ArchiveOutlined, BlockOutlined, CheckOutlined, EditOutlined, FindInPageOutlined, ScheduleSendOutlined, SettingsOutlined } from '@mui/icons-material';
import { visuallyHidden } from '@mui/utils';
import { federationOrganizations } from './federation-data';

const headerActions = [
  { label: 'Архив', Icon: ArchiveOutlined },
  { label: 'Исходящие приглашения', Icon: ScheduleSendOutlined },
  { label: 'Добавить федерацию', Icon: AddLinkOutlined },
  { label: 'Найти организацию', Icon: FindInPageOutlined },
  { label: 'Настройки федераций', Icon: SettingsOutlined },
];

const buttonFeedback = {
  transition: 'background-color 150ms ease, transform 100ms ease',
  '&:hover': { bgcolor: 'action.hover' },
  '&:active': { bgcolor: 'action.selected', transform: 'scale(.94)' },
  '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 0, bgcolor: 'action.hover' },
  '@media (prefers-reduced-motion: reduce)': { '&:active': { transform: 'none' } },
} satisfies SxProps<Theme>;

function ActionIcon({ label, children }: { label: string; children: ReactNode }) {
  return <Tooltip title={label}>
    <IconButton aria-label={label} color="default" sx={{
      ...buttonFeedback, color: 'text.secondary', width: { xs: 36, sm: 40 }, height: { xs: 36, sm: 40 },
      '@media (pointer: coarse)': { width: 44, height: 44 },
      '& .MuiSvgIcon-root': { fontSize: 22 },
    }}>{children}</IconButton>
  </Tooltip>;
}

export default function FederationsSection() {
  const invitations = federationOrganizations.filter(organization => organization.status === 'invitation');
  const trusted = federationOrganizations.filter(organization => organization.status === 'trusted');
  const visibleInvitations = invitations.slice(0, 2);
  const remainingInvitations = invitations.length - visibleInvitations.length;

  return <Stack spacing={3}>
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" gap={1.5}>
        <Typography variant="h4" component="h1">Федерации</Typography>
        <Stack direction="row" role="group" aria-label="Действия федераций" flexWrap="wrap" gap={{ xs: 1, sm: 2 }}>
          {headerActions.map(({ label, Icon }) => <ActionIcon key={label} label={label}><Icon /></ActionIcon>)}
        </Stack>
      </Stack>
      <Typography sx={{ mt: 1.5 }}>Управляйте связями с доверенными организациями для общения и безопасного обмена контентом</Typography>
    </Box>
    <Box>
      <FederationTable title={`Приглашения · ${invitations.length}`} rows={visibleInvitations} invitations />
      {remainingInvitations > 0 && <Button sx={{ ...buttonFeedback, mt: 1, ml: -1, px: 1 }}>Показать ещё {remainingInvitations}</Button>}
    </Box>
    <FederationTable title={`Доверенные организации · ${trusted.length}`} rows={trusted} />
  </Stack>;
}

function FederationTable({ title, rows, invitations = false }: {
  title: string; rows: typeof federationOrganizations; invitations?: boolean;
}) {
  return <Table aria-label={title} sx={{
    tableLayout: 'fixed',
    '& .MuiTableCell-root': { px: 0 },
    '& tbody tr:last-child td': { borderBottom: 0 },
  }}>
    <TableHead><TableRow>
      <TableCell sx={{ width: { xs: 'auto', sm: '43.3%' }, py: 1.5 }}>
        <Typography component="h2" variant="subtitle1" sx={{ color: 'text.primary', fontSize: 16 }}>{title}</Typography>
      </TableCell>
      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
        <Typography component="span" variant="subtitle1" sx={invitations ? { color: 'text.primary', fontSize: 16 } : visuallyHidden}>Домен</Typography>
      </TableCell>
      <TableCell sx={{ width: { xs: invitations ? 92 : 44, sm: 112 } }}><Box component="span" sx={visuallyHidden}>Действия</Box></TableCell>
    </TableRow></TableHead>
    <TableBody>{rows.map(({ id, name, domain, avatar }) => {
      const domainText = <Typography variant="body2" color={domain ? 'text.primary' : 'text.secondary'} sx={{ fontSize: 14, overflowWrap: 'anywhere' }}>
        {domain ?? 'Домен отсутствует'}
      </Typography>;
      return <TableRow key={id} sx={{ height: 56 }}>
        <TableCell sx={{ py: 1 }}>
          <Stack direction="row" alignItems="center" gap={{ xs: 1, sm: 2 }} sx={{ pr: 1.5 }}>
            <Avatar variant="rounded" alt="" aria-hidden src={avatar.src} sx={{
              width: 32, height: 32, bgcolor: 'action.selected', color: 'text.secondary', fontSize: 14,
            }}>{avatar.initials}</Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontSize: 14, overflowWrap: 'anywhere' }}>{name}</Typography>
              <Box sx={{ display: { xs: 'block', sm: 'none' } }}>{domainText}</Box>
            </Box>
          </Stack>
        </TableCell>
        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, py: 1 }}>{domainText}</TableCell>
        <TableCell align="right" sx={{ py: 1 }}>
          <Stack direction="row" justifyContent="flex-end" gap={{ xs: .5, sm: 2 }}>
            {invitations ? <>
              <ActionIcon label={`Отклонить приглашение: ${name}`}><BlockOutlined /></ActionIcon>
              <ActionIcon label={`Принять приглашение: ${name}`}><CheckOutlined /></ActionIcon>
            </> : <ActionIcon label={`Изменить организацию: ${name}`}><EditOutlined /></ActionIcon>}
          </Stack>
        </TableCell>
      </TableRow>;
    })}</TableBody>
  </Table>;
}
