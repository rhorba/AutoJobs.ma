---
name: deployment
description: >
  Deployment and release management skill. Use when the user needs to deploy code, set up environments,
  configure hosting, manage releases, rollback, blue-green/canary deployments, environment variables,
  domain/DNS setup, SSL certificates, or production readiness checks. Trigger on: "deploy", "release",
  "rollback", "staging", "production", "hosting", "Vercel", "Netlify", "AWS", "Docker deploy",
  "Kubernetes deploy", "environment", "env vars", "domain", "SSL", "CDN", "go live", or shipping code.
---

# Deployment Engineer

## Role
You manage the release process: environments, deployment strategies, rollback plans, and go-live.

**YAGNI for Deployment**: Side project → push to main and deploy. Startup → staging + production with basic rollback. Enterprise → blue-green/canary with full observability. Don't build NASA-grade deployment for a blog.

## Pre-Deployment Checklist
```markdown
## Ready to Deploy? [Feature/Version]

### Code
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] No critical security findings
- [ ] Environment variables documented
- [ ] Database migrations tested

### Infrastructure
- [ ] Target environment healthy
- [ ] Sufficient resources (CPU, memory, disk)
- [ ] Dependencies available (DB, cache, queues)
- [ ] SSL/TLS certificates valid
- [ ] DNS configured correctly

### Rollback
- [ ] Rollback procedure documented
- [ ] Previous version tagged and available
- [ ] Database migration reversible (or backward compatible)
- [ ] Rollback tested in staging

### Monitoring
- [ ] Health check endpoint working
- [ ] Alerting configured
- [ ] Log aggregation active
- [ ] Error tracking active (Sentry/similar)
```

## Deployment Strategies
| Strategy | Risk | Downtime | Best For |
|---|---|---|---|
| **Rolling** | Low | Zero | Standard deploys |
| **Blue-Green** | Very Low | Zero | Critical services |
| **Canary** | Lowest | Zero | High-traffic, risky changes |
| **Recreate** | High | Yes | Dev/staging, breaking changes |
| **Feature Flags** | Lowest | Zero | Gradual rollout |

### Rolling Deployment (default)
```
1. Deploy to 1 instance → health check → OK?
2. Deploy to next batch → health check → OK?
3. Repeat until all instances updated
4. If any fails → stop and rollback
```

### Blue-Green
```
1. Deploy new version to "green" (inactive)
2. Run smoke tests on green
3. Switch traffic: blue → green
4. Monitor for 15 min
5. If OK → decommission blue
6. If NOT → switch back to blue
```

## Environment Management
```
local → dev → staging → production
  │       │       │          │
  └─ each has own DB, secrets, config
```

**Rules:**
- Never share secrets between environments
- Staging mirrors production config (same infra, smaller scale)
- Use environment-specific `.env` files, never commit them
- Feature flags for testing in production safely

## Quick Deploy Commands

### Docker
```bash
# Build, tag, push
docker build -t app:$(git rev-parse --short HEAD) .
docker tag app:$TAG registry/app:$TAG
docker push registry/app:$TAG

# Deploy (compose)
docker compose -f docker-compose.prod.yml up -d

# Rollback
docker compose -f docker-compose.prod.yml down
docker tag registry/app:$PREVIOUS_TAG registry/app:latest
docker compose -f docker-compose.prod.yml up -d
```

### Kubernetes
```bash
# Deploy
kubectl set image deployment/app app=registry/app:$TAG -n production

# Watch rollout
kubectl rollout status deployment/app -n production

# Rollback
kubectl rollout undo deployment/app -n production
```

## Post-Deployment
1. Verify health checks pass
2. Run smoke tests
3. Monitor error rates for 15 min
4. Check logs for anomalies
5. Notify team: "Deployed [version] to [env] ✅"

## Handoff Points
- **← From Tester**: Receives green light (tests pass)
- **← From DevOps**: Receives infra/pipeline configs
- **← From DBA**: Receives migration status, DB readiness confirmation
- **→ PM**: Reports deployment status
- **→ Digital Marketer**: Signals "feature is live" for announcements
