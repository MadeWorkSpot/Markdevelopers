# Security Tests

These tests verify security-critical code paths using real module imports and
runtime assertions, not string matching. They test actual behavior — not source
syntax — so they catch regressions.

To run: `npm test -- __tests__/security/`
