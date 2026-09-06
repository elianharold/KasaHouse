---
name: user-prefers-neon
description: The user uses Neon serverless Postgres for dev databases across projects
metadata:
  type: user
---

The user runs multiple projects (mentioned "SpendSense" where we set up Neon) and reaches for **Neon** (serverless Postgres, free tier) as the dev/hosted database rather than installing Postgres locally — this machine has no local Postgres or Docker. Default to Neon (or a hosted connection string) when a project needs Postgres, and give copy-paste setup steps rather than assuming a local server. Related: [[kasahouse-deployment]].
