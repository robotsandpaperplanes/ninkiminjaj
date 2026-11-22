# UserAPI module decisions

Current export: 22 November 2026. Product references: CHATS-21776, DEV-125970 and the supplied administrative journal/common response-format story. This frontend illustrates these requirements; it does not implement their backend.

## Implemented

Keys, Journal and Access tabs share the existing shell. The nine-dot menu contains only the API default scenario. Modern and legacy keys support creation, editing name/scopes, enable/disable, rotation and deletion. Modern secrets have one-time display and save acknowledgement; legacy demo values can be shown again. Expired keys require rotation before enabling. Rotation preserves enabled/disabled state. Mutations append local journal records; deletion preserves history. Personal administrator permission can be granted/revoked, except the owner's. Revocation leaves issued keys operational.

Journal supports filters, ten-row pagination, local CSV and details with integration, responsible administrator, actual cabinet actor, organization, target, outcome/reason, safe changes and request ID. Sample events include employee creation, LDAP-managed attribute denial (422), private-chat read, cabinet actions and invalid-key authentication (401). Security category exists without default events.

## Confirmed requirement boundaries

Modern keys cannot use userapi_organization or userapi_link_chats; legacy keys cannot use userapi_employees_write or userapi_organization_email. Legacy keys have no expiry. Modern validity is 1-365 days. Owner always has API administration permission. Actual delegation checks and automatic loss-of-role/membership reactions are not simulated.

Journal requirements cover administrative changes, key operations, permission/scopes changes, security-policy changes, OTP outcomes, failures and integration chat reads. Only the key/permission frontend mutations and sample events are currently modeled. SIEM delivery, shared backend storage, retention and production On-Prem behavior are not implemented.

Response requirements include standard HTTP statuses, JSON 401 for absent/invalid/expired keys and X-Request-Id returned with error requestId. The shown flat code/message/requestId envelope is illustrative, not an approved final contract. No real requests or changes to existing methods occur.

## Prototype assumptions and gaps

Integration name reuses key comment (50 characters); integration identity reuses key record ID. Legacy issuer is unknown rather than fabricated. Default modern lifetime is 90 days; maximum 365 is a requirement. Explicit scopes must be nonempty; all-current-permissions is a separate explicit mode, not automatic access to new administrative scopes. Catalog covers named story codes only. CSV is a local convenience, not SIEM export. No automatic retention cleanup runs.

Open: chat-list audit granularity, old read-method coverage, service ownership of journal storage, retention, legacy issuer migration, integration/key identity, all-method error migration and compatibility of machine codes. Publish a changelog before a future real rollout; no such rollout is included.

No employee HTTP endpoints, OAuth/LDAP integration, IP-policy/OTP/mTLS editors or webhook editor are present. New values are generated locally using Web Crypto with demo_ prefixes; modern persisted state uses a SHA-256 hash, legacy state uses plaintext only to demonstrate old behavior. Never enter real credentials.

Seven model tests pass. Complete interactive API creation/rotation/copy/export regression remains outstanding; static rendering is not equivalent to that browser coverage. See HANDOFF.md for the current overall verification status.
