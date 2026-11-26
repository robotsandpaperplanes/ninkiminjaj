import { createContext } from 'react';
import { organizationName } from '../data';

export const OrganizationIdentity = createContext(organizationName);
