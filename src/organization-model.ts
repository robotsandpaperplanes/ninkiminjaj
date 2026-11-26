import { organizationName } from './data';
import { defaultPermissions, defaultSettings, newToken, productLabels, recordingAccessLabels, type Settings } from './group-model';

export const ORGANIZATION_STORAGE = 'mts-link-admin-organization-v1';
export const generalOrganizationRights = ['deleteOwnEvents', 'viewAllEvents', 'allFiles', 'allContacts', 'upload'] as const;
const organizationRights = [...generalOrganizationRights, 'createCourses'] as const;
type RightKey = typeof organizationRights[number];

export type OrganizationOverviewData = {
  name: string;
  logoReference: string | null;
  invitation: { token: string; passwordProtected: boolean };
  domainJoining: boolean;
};

export type OrganizationState = {
  version: 1;
  id: string;
  slug: string;
  overview: OrganizationOverviewData;
  productVisibility: Record<string, boolean>;
  rights: Record<RightKey, boolean>;
  settings: Pick<Settings, 'autoRecord' | 'recordingAccess' | 'camera' | 'microphone'> & { desktopSelf: boolean };
  storage: { usedGb: number; quotaGb: number };
};

export function createOrganizationState(): OrganizationState {
  return {
    version: 1,
    id: 'org-dunder-mifflin',
    slug: 'dundermifflinpaper',
    overview: {
      name: organizationName,
      logoReference: null,
      invitation: { token: 'demo-organization-dunder-mifflin', passwordProtected: false },
      domainJoining: false,
    },
    productVisibility: Object.fromEntries(productLabels.map(label => [label, false])),
    rights: {
      deleteOwnEvents: defaultPermissions.deleteOwnEvents,
      viewAllEvents: defaultPermissions.viewAllEvents,
      allFiles: defaultPermissions.allFiles,
      allContacts: defaultPermissions.allContacts,
      upload: defaultPermissions.upload,
      createCourses: defaultPermissions.createCourses,
    },
    settings: {
      autoRecord: defaultSettings.autoRecord,
      recordingAccess: defaultSettings.recordingAccess,
      camera: defaultSettings.camera,
      microphone: defaultSettings.microphone,
      desktopSelf: false,
    },
    storage: { usedGb: 16.5, quotaGb: 200 },
  };
}

export function loadOrganizationState(): OrganizationState {
  const baseline = createOrganizationState();
  try {
    const saved: Partial<OrganizationState> | null = JSON.parse(localStorage.getItem(ORGANIZATION_STORAGE) ?? 'null');
    if (saved?.version !== 1 || saved.id !== baseline.id || saved.slug !== baseline.slug) return baseline;

    const { overview, productVisibility, rights, settings, storage } = saved;
    if (overview && typeof overview.name === 'string' && overview.name.trim() &&
      (overview.logoReference === null || typeof overview.logoReference === 'string') &&
      typeof overview.invitation?.token === 'string' && /^demo-[a-z0-9-]+$/i.test(overview.invitation.token) &&
      typeof overview.invitation.passwordProtected === 'boolean' && typeof overview.domainJoining === 'boolean') {
      baseline.overview = overview;
    }
    if (productVisibility && productLabels.every(key => typeof productVisibility[key] === 'boolean')) baseline.productVisibility = productVisibility;
    if (rights && organizationRights.every(key => typeof rights[key] === 'boolean')) baseline.rights = rights;
    if (settings && typeof settings.autoRecord === 'boolean' && typeof settings.camera === 'boolean' &&
      typeof settings.microphone === 'boolean' && Object.hasOwn(recordingAccessLabels, settings.recordingAccess)) {
      baseline.settings = { ...settings, desktopSelf: settings.desktopSelf === true };
    }
    if (storage && Number.isFinite(storage.usedGb) && storage.usedGb >= 0 &&
      Number.isFinite(storage.quotaGb) && storage.quotaGb > 0) baseline.storage = storage;
  } catch { /* The prototype remains usable without browser storage. */ }
  return baseline;
}

export function organizationInvitationUrl(token: string) {
  return 'https://link.example/organization/invite/' + encodeURIComponent(token);
}

export function rotateOrganizationInvitation(invitation: OrganizationOverviewData['invitation']) {
  return { ...invitation, token: 'demo-organization-' + newToken() };
}
