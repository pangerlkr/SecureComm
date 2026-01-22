# SecureComm Usage Guide

This document explains how to use SecureComm as an end user, particularly via the publicly hosted instance.

SecureComm is designed to be simple to use while enforcing strong privacy guarantees by default.

## Accessing SecureComm

SecureComm is available as a web-based application and does not require installation.

Public instance:
https://securecomm.pangerlkr.link

A modern web browser with Web Crypto API support is required.

## General Usage Flow

1. Open SecureComm in a supported browser.
2. Create or join a secure communication session (preferably create chat rooms or use very unique room IDs)
3. Exchange text messages and voice messages with other participants.
4. Messages are encrypted on your device and decrypted only on the recipient device.

No user account or registration is required.

## Message Security

- Messages are encrypted end-to-end.
- Encryption occurs before messages leave your device.
- The server does not have access to plaintext messages.
- Messages are decrypted only by intended recipients.

If a message is intercepted during transmission, it cannot be read without the appropriate cryptographic keys.

## Session Behavior

- Communication sessions are ephemeral by design.
- Messages exist only for the duration of the active session.
- Once a session ends or participants disconnect, messages are not recoverable.

Users should assume that messages are permanently lost after session termination.

## Data Storage and Retention

- SecureComm does not store plaintext messages.
- No long-term message history is maintained.
- Cryptographic keys are generated locally and are not uploaded or stored server-side.

Users are responsible for preserving any information they wish to retain outside the platform.

## Browser and Device Considerations

- Use updated browsers to ensure proper cryptographic support.
- Private or incognito modes may affect session persistence.
- SecureComm does not protect against compromised devices.

Security guarantees assume that the client device is trusted and uncompromised.

## Limitations

SecureComm does not provide:

- User identity verification beyond session-level trust.
- Message recovery after session termination.
- Protection against screen capture, malware, or physical device access.
- Anonymity against network-level observers.
- Any user with the Chat Room ID can join the Chat.

Users should evaluate whether SecureComm meets their specific threat model.

## Responsible Use

SecureComm is intended for lawful and ethical communication.

Users are responsible for complying with applicable laws and regulations in their jurisdiction.

## Support

SecureComm is provided as an open-source project.

For issues, bugs, or feature requests, refer to the GitHub repository issue tracker.

send support mail/ context here: contact@pangerlkr.link

