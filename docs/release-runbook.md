# Release Runbook (Agent Me)

This runbook is the operational checklist for releasing Agent Me safely.

## 1) Pre-release gates

Run and verify all of the following on the candidate commit:

- CI `check` job passes (types + lint, changed-file formatting checks)
- `Security Gate` workflow passes
- `Install Smoke` workflow passes
- Targeted bootstrap/auth regressions pass:
  - `src/gateway/auth.test.ts`
  - `src/gateway/tools-invoke-http.test.ts`
  - `src/gateway/server-http.bootstrap.test.ts`

## 2) Deployment procedure

1. Tag release candidate commit.
2. Deploy to a staging environment first.
3. Validate:
   - gateway connect/auth
   - control UI load/connect
   - core channel send/receive
   - bootstrap link create/exchange
4. Deploy to production in a maintenance window.
5. Monitor for 30-60 minutes.

## 3) Rollback plan

If severe regression is detected:

1. Stop rollout immediately.
2. Revert to prior known-good tag/commit.
3. Restart gateway service.
4. Re-run smoke checks:
   - connect/auth
   - channel send/receive
   - basic tool call
5. Announce rollback status and incident summary.

## 4) Token rotation playbook

Rotate gateway credentials whenever leakage is suspected.

### Gateway token mode

1. Generate new token.
2. Update `gateway.auth.token` in config.
3. Restart gateway.
4. Invalidate old bootstrap links (automatic with token-derived bootstrap secret unless custom bootstrap secret is configured).
5. Confirm clients reconnect with new token.

### Gateway password mode

1. Set new `gateway.auth.password`.
2. Restart gateway.
3. Verify control UI and API clients can re-authenticate.

### Optional dedicated bootstrap secret

If `AGENTME_BOOTSTRAP_SECRET` is set, rotate it alongside auth token/password after incidents.

## 5) Incident response checklist

For auth/bootstrap incidents:

1. Classify severity (active exploit vs attempted abuse).
2. Preserve logs and timestamps.
3. Rotate token/password and bootstrap secret.
4. Disable high-risk endpoints temporarily if needed.
5. Patch and add regression tests before re-release.
6. Publish post-incident notes:
   - root cause
   - impact window
   - mitigations
   - follow-up actions

## 6) Post-release verification

- No sustained auth errors in logs
- No repeated bootstrap exchange failures beyond expected invalid attempts
- Channel delivery latency normal
- No unexpected crash/restart loops

## 7) Ownership

- Release owner: responsible for go/no-go and rollback trigger
- Security reviewer: signs off security gate and incident actions
- Operator on-call: monitors first hour post-release
