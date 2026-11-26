import type { Operation } from './model';

export type NetworkPayload = { kind: 'ip' | 'fqdn'; product: string; direct: string[]; targetDomain: string; replaceCert: boolean; certSAN: string[] };
export type NetworkConfiguration = { ips: Record<string, string>; domains: Record<string, string>; certs: Record<string, string[]> };

// IPs commit per confirmed VM; the combined FQDN/certificate configuration commits only on full success.
export function applyNetworkOutcome(config: NetworkConfiguration, operation: Operation<NetworkPayload>): NetworkConfiguration {
  const ips = { ...config.ips }, domains = { ...config.domains }, certs = { ...config.certs };
  if (operation.payload.kind === 'ip') {
    operation.rows.forEach(row => { if (row.node && operation.results[row.node] === 'success') ips[row.node] = row.after; });
  } else if (operation.status === 'success') {
    domains[operation.payload.product] = operation.payload.targetDomain;
    if (operation.payload.replaceCert) certs[operation.payload.product] = [...operation.payload.certSAN];
  }
  return { ips, domains, certs };
}
