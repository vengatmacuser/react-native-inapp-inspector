# Security Policy

## Supported Versions

Security updates and patches are actively provided for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.1.x   | :white_check_mark: |
| 1.0.x   | :x:                |
| < 1.0   | :x:                |

---

## Reporting a Vulnerability

We take the security of **`react-native-inapp-inspector`** seriously. If you believe you have found a security vulnerability, please do **NOT** report it in a public issue.

### How to Report

1. **GitHub Security Advisory**: Submit a private advisory via [GitHub Security Advisories](https://github.com/vengatmacuser/react-native-inapp-inspector/security/advisories/new).
2. **Email**: Alternatively, send details directly to **[vengatmacuser@gmail.com](mailto:vengatmacuser@gmail.com)**.

### What to Include in Your Report

Please provide:
- A description of the vulnerability and its potential impact.
- Steps to reproduce or a minimal proof-of-concept (PoC).
- React Native version, OS (iOS/Android), and library version.

### Response Timeline

- **Initial Response**: Within **48 hours** acknowledging receipt of the report.
- **Triage & Status Updates**: We will investigate and provide regular updates every **3–5 business days**.
- **Fix & Disclosure**: Once a patch is developed and verified, a patched release will be published to npm and GitHub with full credit to the reporter (if desired).

---

## Security Best Practices for Consumers

Because `react-native-inapp-inspector` inspects live network traffic, redux states, and console logs:

1. **Production Gating**: Always gate `<InAppInspector />` within `if (__DEV__)` or behind authorized internal build flags so sensitive customer data is never exposed in public app store releases.
2. **Sensitive Data**: Avoid logging unmasked credentials, private keys, or full credit card numbers in your application's network or redux payloads.
