# Features in the exported prototype

## Certificates

- Current certificate list with status, expiry, linked products/FQDNs, and expandable details including issuer and nodes.
- Consistent icon actions for details and replacement on certificate rows.
- Replacement wizard: upload `.crt` and `.key`, optionally add intermediate chain `.crt`/`.pem`, inspect simulated validation, select product scope, review affected FQDNs/nodes, confirm, monitor outcome.
- Scenarios: success, mismatched key, uncovered FQDNs, and one-node failure. A partial result can be retried. Operation history and per-node details are shown.
- “Use demo bundle” is a prototype-only helper, not a product requirement.

## License

- Current licensing by product and additional services, with sample limits and expiry.
- `.lic` file picker, simulated file/installation/product checks, “Now / After” comparison, changed-parameter filtering, confirmation, and application status per product.
- Scenarios: success, damaged file, other installation, missing product, reduced limits, and partial success. Reduced limits require additional acknowledgement. Partial application supports retry of failed products.
- Operation history is available. Raw license keys and JWTs are not shown.

## Network

- Tabs: Internal IP, FQDN, and change history.
- Edit one or several VM IPs; local IPv4 and duplicate checks; preview affected dependencies; simulated preflight; confirm; view per-node result.
- Edit a product's primary FQDN; derive future service FQDNs automatically; preview the full future set.
- If current certificate coverage is insufficient, upload a new certificate and key inside the same FQDN operation. The intended change is applied as one operation in the mock flow.
- Scenarios: success, blocked IP/DNS check, certificate check failure, partial application, and lost contact/unknown result. The result view offers retry or reconciliation where appropriate.

All “checks” and “application” outcomes are simulations. The file inputs retain filenames only; they do not process file contents.
