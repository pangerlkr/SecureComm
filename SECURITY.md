# Security Policy

## Overview

SecureComm is designed with security as a primary objective. This document outlines supported security practices, reporting procedures, and scope of responsibility.

## Supported Versions

Only the latest version of SecureComm is actively maintained and supported with security updates.

Users are encouraged to stay up to date.

## Security Model Summary

- End-to-end encryption enforced at the client layer.
- Server operates as an untrusted relay.
- No plaintext data stored server-side.
- Cryptographic keys are generated and retained by clients only.

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it responsibly.

Do not disclose vulnerabilities publicly before coordination.

### How to Report

- Open a private issue if available  
  or  
- Contact the repository owner directly through GitHub

Include:

- A clear description of the issue
- Steps to reproduce if applicable
- Potential impact assessment

## Scope

In scope:

- Cryptographic implementation flaws
- Authentication or authorization bypasses
- Information disclosure vulnerabilities
- Design weaknesses affecting confidentiality or integrity

Out of scope:

- Denial of service attacks
- Social engineering attacks
- Issues caused by compromised client devices
- Third-party dependency vulnerabilities unless directly exploitable

## Disclosure Policy

Valid vulnerabilities will be acknowledged and addressed in a reasonable timeframe. Credit will be given where appropriate.

## Disclaimer

This project is provided as-is. No guarantee is made regarding suitability for specific threat environments.
