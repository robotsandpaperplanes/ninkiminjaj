import { ModeVisibility } from '../app/ModeVisibility';
import { Box } from '@mui/material';
import Certificates from './Certificates';
import License from './License';
import Network from './Network';
import { FeatureVisible } from './shared';

type Props = { section: 'certificates' | 'license' | 'network'; active: boolean; notify: (message: string) => void; networkTab?: 'ip' | 'fqdn' | 'history'; onNetworkTabChange?: (tab: 'ip' | 'fqdn' | 'history') => void };
export default function OnPremAdmin({ section, active, notify, networkTab, onNetworkTabChange }: Props) {
  // Stable mounts retain drafts and keep simulated operations alive across mode changes.
  return <>{(['certificates', 'license', 'network'] as const).map(name => <FeatureVisible.Provider key={name} value={active && section === name}><ModeVisibility.Provider value={active && section === name}><Box hidden={!active || section !== name} sx={{ display: active && section === name ? 'block' : 'none' }}>{name === 'certificates' ? <Certificates notify={notify} /> : name === 'license' ? <License notify={notify} /> : <Network notify={notify} networkTab={networkTab} onNetworkTabChange={onNetworkTabChange} />}</Box></ModeVisibility.Provider></FeatureVisible.Provider>)}</>;
}
