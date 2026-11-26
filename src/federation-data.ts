type FederationOrganization = {
  id: string;
  name: string;
  domain: string | null;
  status: 'invitation' | 'trusted';
  avatar: { initials: string; src?: string };
};

export const federationOrganizations: readonly FederationOrganization[] = [
  { id: 'goldfrapp', name: 'Goldfrapp', domain: null, status: 'invitation', avatar: { initials: 'G' } },
  { id: 'courteeners', name: 'The Courteeners', domain: 'courteeners.mts-link.co.uk', status: 'invitation', avatar: { initials: 'C' } },
  { id: 'northline-studio', name: 'Northline Studio', domain: 'northline.example', status: 'invitation', avatar: { initials: 'N' } },
  { id: 'arcade-fire', name: 'Arcade Fire', domain: 'arcadefire.mts-link.ca', status: 'trusted', avatar: { initials: 'AF' } },
  { id: 'muse', name: 'Muse', domain: 'helium3.mts-link.co.uk', status: 'trusted', avatar: { initials: 'M' } },
  { id: 'echo-bunnymen', name: 'Echo & The Bunnymen', domain: 'etb.mts-link.co.uk', status: 'trusted', avatar: { initials: 'EB' } },
];
