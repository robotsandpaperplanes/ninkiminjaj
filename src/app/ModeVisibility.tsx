import { createContext, useContext } from 'react';
import { Dialog as MuiDialog, Menu as MuiMenu, TextField as MuiTextField, type DialogProps, type MenuProps, type TextFieldProps, type SelectProps } from '@mui/material';

export const ModeVisibility = createContext(true);

// Portals live outside a hidden mode's DOM subtree, so explicitly suspend their visibility.
export function Dialog({ open, ...props }: DialogProps) {
  const visible = useContext(ModeVisibility);
  return <MuiDialog {...props} open={open && visible} />;
}
export function Menu({ open, ...props }: MenuProps) {
  const visible = useContext(ModeVisibility);
  return <MuiMenu {...props} open={open && visible} />;
}
export function TextField(props: TextFieldProps) {
  const visible = useContext(ModeVisibility);
  if (!props.select) return <MuiTextField {...props} />;
  return <MuiTextField {...props} slotProps={{ ...props.slotProps, select: owner => {
    const slot = props.slotProps?.select;
    const select = { ...props.SelectProps, ...(typeof slot === 'function' ? slot(owner) : slot) } as Partial<SelectProps>;
    return { ...select, MenuProps: { ...select.MenuProps, ...(visible ? {} : { open: false }) } };
  } }} />;
}
