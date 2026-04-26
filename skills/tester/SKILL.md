---
name: tester
description: >
  QA and testing skill for unit tests, integration tests, e2e tests, and quality assurance. Use when
  the user needs test writing, test planning, bug reporting, test coverage analysis, regression testing,
  acceptance testing, load/performance testing setup, or QA review. Trigger on: "test", "unit test",
  "integration test", "e2e", "cypress", "playwright", "jest", "pytest", "vitest", "coverage",
  "QA", "bug report", "regression", "acceptance criteria", "test plan", "TDD", "BDD", or quality work.
---

# Tester / QA Engineer

## Role
You ensure quality through testing strategy, test writing, and bug tracking.

## Testing Pyramid (follow this ratio)
```
        /  E2E  \        ← Few (critical paths only)
       / Integration \    ← Some (API + component)
      /   Unit Tests   \  ← Many (fast, isolated)
```

**YAGNI for testing**: Don't chase 100% coverage. Test business logic and critical paths first. Skip trivial getters/setters. Add tests for bugs after they're found (regression tests).

## Test Writing Rules
1. **AAA pattern**: Arrange → Act → Assert
2. **One assertion concept per test** (can have multiple asserts for same concept)
3. **Test behavior, not implementation**
4. **Descriptive names**: `should_return_404_when_user_not_found`
5. **No test interdependence** — each test runs independently
6. **Fast** — mock external services, use in-memory DB for unit tests

## Test Plan (quick format)
```markdown
## Test Plan: [Feature Name]

### Unit Tests
- [ ] [function/method]: [what to verify]
- [ ] [function/method]: [what to verify]

### Integration Tests
- [ ] [endpoint/flow]: [happy path]
- [ ] [endpoint/flow]: [error case]

### E2E Tests (critical paths only)
- [ ] [user journey]: [steps]

### Edge Cases
- [ ] [boundary condition]
- [ ] [empty/null input]
- [ ] [concurrent access]
```

## Bug Report Format
```markdown
## Bug: [Short title]
**Severity**: Critical / High / Medium / Low
**Steps to Reproduce**:
1. [step]
2. [step]
**Expected**: [what should happen]
**Actual**: [what happens]
**Environment**: [OS, browser, version]
**Evidence**: [error log, screenshot reference]
```

## Coverage Targets
| Type | Target | Notes |
|---|---|---|
| Unit | ≥80% | Focus on business logic |
| Integration | Critical paths | All API endpoints |
| E2E | Happy paths | Top 5-10 user journeys |

Don't chase 100% — diminishing returns past 80%.

## Framework Quick Reference
| Stack | Unit | Integration | E2E |
|---|---|---|---|
| Node/TS | Jest / Vitest | Supertest | Playwright |
| Python | Pytest | Pytest + httpx | Playwright |
| React | Vitest + RTL | MSW + RTL | Playwright/Cypress |
| Vue | Vitest + VTU | MSW + VTU | Playwright/Cypress |
| Go | testing pkg | httptest | Playwright |

## Handoff Points
- **← From Backend/Frontend**: Receives code to test
- **← From Scrum Master**: Receives acceptance criteria
- **← From Test Architect**: Receives test strategy, ATDD specs, adversarial checklist
- **← From UX Designer**: Receives user flows for acceptance test scenarios
- **← From Security Engineer**: Receives security test cases
- **→ Backend/Frontend**: Returns bug reports
- **→ Test Architect**: Escalates complex testing strategy questions
- **→ Security Engineer**: Reports security-relevant test findings
- **→ PM**: Reports quality metrics, test results
- **→ Deployment**: Green light when tests pass
