# Business rules represented in the prototype

These rules describe visible mock behavior. Backend contracts and real infrastructure behavior still need definition.

## Shared operation pattern

Show current state, change, checks, affected scope, confirmation, execution, and final result. Surface a running operation after navigating away from its result view. Retain a history entry and product/node-level outcome. A failed or partial outcome must remain distinguishable from full success.

## Certificate replacement

- A `.crt` certificate and matching `.key` are required before continuing. Intermediate chain upload (`.crt` or `.pem`) is optional when not included in the main certificate.
- The UI simulates format, key match, expiry, chain, and FQDN coverage checks. A mismatched key or uncovered selected FQDN blocks confirmation.
- Scope is selected by product; dependent nodes are included automatically. Chats and Platform share related endpoints in this mock model.
- Confirmation shows current versus future certificate, product/FQDN scope, node impact, and interruption warning. The administrator acknowledges before applying.
- A partial node failure is reported and can be retried. Current status should not imply all nodes succeeded when one remains failed. The interface offers replacement, not deletion, for installed certificates.
- Private key material is not displayed in details or history. The demo helper supplies filenames only.

## License replacement

- The accepted input is a `.lic` file. The mock checks file validity, installation match, and product coverage before comparison.
- The license applies as a whole to the installation; the mock comparison shows changed expiry/limits and additional services. User confirmation is required. Reductions and disabled services receive an extra acknowledgement.
- Results are tracked per product. Partial success keeps successful product state and lets the user retry failed products.
- License keys and JWTs are not shown. In the current exported mock, product and service entitlement labels are not yet fully unified; proposed “Доступно / Недоступно” copy is a discussion, not an implemented change.

## Network changes

- IP editing supports one or several VM rows. The local check validates IPv4 syntax and duplicate addresses; only changed rows become direct targets. Dependencies are shown before confirmation.
- The admin edits a product's primary FQDN. Service FQDNs are derived from it. The UI previews old and future addresses, validates domain syntax/conflicts, and simulates DNS checks.
- If the current certificate does not cover the future FQDN set, a new `.crt` + `.key` is required in the same FQDN workflow. The mock confirmation presents FQDN and certificate as one operation.
- The UI models success, blocked preflight, certificate failure, partial application, and unknown result after loss of contact. Unknown state requires reconciliation rather than an assumed success.

All checks and operations above are mock simulations, not guarantees of production behavior.
