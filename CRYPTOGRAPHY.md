# Cryptography Design

This document describes the cryptographic design and assumptions used in SecureComm.

SecureComm does not implement custom cryptographic algorithms. It relies on established standards and browser-provided cryptographic primitives.

## Design Principles

- Client-side encryption by default
- No server-side access to cryptographic keys
- Use of well-reviewed cryptographic primitives
- Ephemeral key material where feasible
- No security through obscurity

## Key Generation and Storage

- Cryptographic keys are generated locally on client devices.
- Keys are retained only in client memory for the duration of a session.
- Long-term key storage on the server is explicitly avoided.
- The server does not receive sufficient information to reconstruct keys.

## Key Exchange

SecureComm establishes shared secrets between participants using secure key exchange mechanisms.

Key exchange occurs directly between clients, with the server acting solely as a relay for encrypted key material.

The server is treated as an untrusted intermediary.

## Encryption and Integrity

- Message confidentiality is enforced using symmetric encryption.
- Message integrity and authenticity are enforced using authenticated encryption mechanisms.
- Messages are encrypted before transmission and decrypted only by the intended recipient.

Plaintext messages are never transmitted or stored server-side.

## Randomness

SecureComm relies on cryptographically secure random number generation provided by the browser environment.

No custom random number generators are implemented.

## Forward Secrecy

Where supported by the underlying cryptographic mechanisms, SecureComm aims to provide forward secrecy.

Compromise of long-term keys should not expose previously transmitted messages.

Forward secrecy is a design objective and may evolve as the system matures.

## Metadata Considerations

While message contents are protected, SecureComm does not attempt to fully conceal metadata such as:

- Timing of messages
- Volume of traffic
- Network-level identifiers

These limitations are acknowledged and documented.

## Threat Assumptions

The cryptographic design assumes:

- Client devices are not compromised
- Browser cryptographic APIs are correctly implemented
- Users do not intentionally disclose keys or session material

## Non-Goals

SecureComm does not attempt to:

- Provide anonymity against network-level observers
- Protect against endpoint compromise
- Replace operating system or browser security controls

## Review and Evolution

Cryptographic choices may evolve over time as standards and best practices change.

Changes to cryptographic design will be documented and versioned.
