import { useId, useLayoutEffect, useRef, useState, type FormEvent, type Ref } from 'react';
import { Box, Button, DialogActions, DialogContent, DialogTitle, IconButton, List, ListItem, MenuItem } from '@mui/material';
import { AddOutlined, CloseOutlined, MoreVertOutlined } from '@mui/icons-material';
import { Dialog, Menu } from './app/ModeVisibility';
import ProfileTextField from './ProfileTextField';
import { systemProfileFields, type EmployeeProfileField, type EmployeeProfileFieldDraft } from './employee-data';

type EditorView = { kind: 'create' } | { kind: 'edit'; field: EmployeeProfileField };
type View = { kind: 'list' } | EditorView;
type Props = {
  fields: EmployeeProfileField[];
  onClose: () => void;
  onSave: (field: EmployeeProfileField, editing: boolean) => void;
};

const viewportHeight = { xs: 'calc(100dvh - 32px)', sm: 'calc(100dvh - 80px)' };
const horizontalPadding = { xs: 2, sm: 3 };
const titleStyle = { px: horizontalPadding, py: 2, display: 'flex', alignItems: 'center', fontSize: 20, minHeight: { xs: 64, sm: 80 } };
const footerStyle = { px: horizontalPadding, py: 2, minHeight: { xs: 64, sm: 84 }, '& .MuiButton-root': { textTransform: 'uppercase' } };
const rowStyle = { minHeight: 48, px: 0, gap: 2, borderBottom: 1, borderColor: 'divider', overflowWrap: 'anywhere' };
const menuItemHeight = 40;

export default function EmployeeProfileFieldsDialog({ fields, onClose, onSave }: Props) {
  const titleId = useId();
  const menuId = useId();
  const addButtonId = useId();
  const [view, setView] = useState<View>({ kind: 'list' });
  const [menu, setMenu] = useState<{ anchor: HTMLButtonElement; fieldId: string; above: boolean } | null>(null);
  const listContent = useRef<HTMLDivElement>(null);
  const editorTitle = useRef<HTMLHeadingElement>(null);
  const listPosition = useRef<{ scrollTop: number; triggerId: string } | null>(null);
  const menuField = fields.find(field => field.id === menu?.fieldId);
  const editorOpen = view.kind !== 'list';

  useLayoutEffect(() => {
    if (editorOpen) {
      editorTitle.current?.focus({ preventScroll: true });
    } else if (listContent.current && listPosition.current) {
      const { scrollTop, triggerId } = listPosition.current;
      listContent.current.scrollTop = scrollTop;
      document.getElementById(triggerId)?.focus({ preventScroll: true });
      listPosition.current = null;
    }
  }, [editorOpen]);

  function openEditor(next: EditorView, triggerId: string) {
    listPosition.current = { scrollTop: listContent.current?.scrollTop ?? 0, triggerId };
    setMenu(null);
    setView(next);
  }

  function returnToList() {
    setView({ kind: 'list' });
  }

  function openMenu(anchor: HTMLButtonElement, fieldId: string) {
    anchor.focus({ preventScroll: true });
    const { top, bottom } = anchor.getBoundingClientRect();
    const spaceBelow = window.innerHeight - bottom;
    setMenu({ anchor, fieldId, above: spaceBelow < 2 * menuItemHeight + 32 && top > spaceBelow });
  }

  return <Dialog open keepMounted onClose={editorOpen ? returnToList : onClose} aria-labelledby={titleId} maxWidth={false} scroll="paper"
    slotProps={{ paper: { sx: {
      m: { xs: 2, sm: '40px' }, width: { xs: 'calc(100% - 32px)', sm: editorOpen ? 448 : 640 },
      maxWidth: { xs: 'none', sm: 'calc(100% - 80px)' }, maxHeight: viewportHeight,
      height: editorOpen ? 'auto' : viewportHeight,
    } } }}>
    {view.kind === 'list' ? <>
      <Box sx={{ ...titleStyle, flexShrink: 0, justifyContent: 'space-between', gap: 2, borderBottom: 1, borderColor: 'divider' }}>
        <DialogTitle id={titleId} sx={{ p: 0, fontSize: 'inherit' }}>Настройка полей профиля сотрудников</DialogTitle>
        <IconButton aria-label="Закрыть" onClick={onClose} sx={{ flexShrink: 0 }}><CloseOutlined /></IconButton>
      </Box>
      <DialogContent ref={listContent} tabIndex={0} role="region" aria-label="Поля профиля"
        sx={{ px: horizontalPadding, py: 0, overscrollBehavior: 'contain' }}>
        <List disablePadding>
          {Object.entries(systemProfileFields).map(([key, label]) => (
            <ListItem key={key} sx={{ ...rowStyle, color: 'text.secondary' }}>{label}</ListItem>
          ))}
          {fields.map(field => {
            const menuOpen = field.id === menuField?.id;
            return <ListItem key={field.id} sx={{ ...rowStyle, justifyContent: 'space-between' }}>
              <Box sx={{ minWidth: 0 }}>{field.name}</Box>
              <IconButton id={`${titleId}-field-${field.id}`} size="small" aria-label={`Действия: ${field.name}`}
                aria-haspopup="menu" aria-expanded={menuOpen} aria-controls={menuOpen ? menuId : undefined}
                onClick={event => openMenu(event.currentTarget, field.id)}
                sx={{ flexShrink: 0, '&[aria-expanded="true"]': { bgcolor: 'action.selected' } }}>
                <MoreVertOutlined fontSize="small" />
              </IconButton>
            </ListItem>;
          })}
        </List>
      </DialogContent>
      <DialogActions sx={{ ...footerStyle, justifyContent: 'flex-start', borderTop: 1, borderColor: 'divider' }}>
        <Button id={addButtonId} startIcon={<AddOutlined />} onClick={() => openEditor({ kind: 'create' }, addButtonId)}>
          Добавить поле
        </Button>
      </DialogActions>
      <Menu anchorEl={menu?.anchor} open={Boolean(menuField)} onClose={() => setMenu(null)}
        anchorOrigin={{ vertical: menu?.above ? 'top' : 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: menu?.above ? 'bottom' : 'top', horizontal: 'right' }}
        slotProps={{
          list: { id: menuId, 'aria-label': menuField && `Действия: ${menuField.name}` },
          paper: { sx: { minWidth: 240, '& .MuiMenuItem-root': { minHeight: menuItemHeight } } },
        }}>
        <MenuItem onClick={() => {
          if (menuField && menu) openEditor({ kind: 'edit', field: menuField }, menu.anchor.id);
        }}>Изменить</MenuItem>
        <MenuItem disabled sx={{ color: 'error.main' }}>Удалить</MenuItem>
      </Menu>
    </> : <ProfileFieldEditor view={view} titleId={titleId} titleRef={editorTitle} onCancel={returnToList}
      onSave={draft => {
        const id = view.kind === 'edit' ? view.field.id
          : `profile-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
        onSave({ ...draft, id }, view.kind === 'edit');
        returnToList();
      }} />}
  </Dialog>;
}

function ProfileFieldEditor({ view, titleId, titleRef, onCancel, onSave }: {
  view: EditorView;
  titleId: string;
  titleRef: Ref<HTMLHeadingElement>;
  onCancel: () => void;
  onSave: (draft: EmployeeProfileFieldDraft) => void;
}) {
  const [draft, setDraft] = useState<EmployeeProfileFieldDraft>(() => view.kind === 'edit'
    ? { name: view.field.name, hint: view.field.hint, ssoKey: view.field.ssoKey }
    : { name: '', hint: '', ssoKey: '' });

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draft.name.trim()) onSave(draft);
  }

  return <Box component="form" onSubmit={save} sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
    <DialogTitle id={titleId} ref={titleRef} tabIndex={-1} sx={{ ...titleStyle, '&:focus': { outline: 0 } }}>
      Поле профиля сотрудников
    </DialogTitle>
    <DialogContent sx={{ px: horizontalPadding, py: 2, '.MuiDialogTitle-root + &': { pt: 2 }, overscrollBehavior: 'contain' }}>
      <Box sx={{ display: 'grid', rowGap: { xs: 2, sm: 3 } }}>
        <ProfileTextField required label="Название поля" value={draft.name}
          onChange={event => setDraft({ ...draft, name: event.target.value })} />
        <ProfileTextField label="Подсказка (не обязательно)" value={draft.hint}
          onChange={event => setDraft({ ...draft, hint: event.target.value })} />
        <ProfileTextField label="SSO-ключ поля (не обязательно)" value={draft.ssoKey}
          onChange={event => setDraft({ ...draft, ssoKey: event.target.value })} />
      </Box>
    </DialogContent>
    <DialogActions sx={{ ...footerStyle, gap: 1 }}>
      <Button onClick={onCancel}>Отмена</Button>
      <Button type="submit" variant="contained" disabled={!draft.name.trim()}>Сохранить</Button>
    </DialogActions>
  </Box>;
}
