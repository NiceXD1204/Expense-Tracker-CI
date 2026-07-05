# Expense Tracker

## The idea

I wanted a project that goes through the *whole* DevOps loop, not just "containerize an
app and call it done": write the app, package it, define the infrastructure as code,
deploy it through GitOps, wire up CI/CD so a `git push` ships to a real cluster, and
have monitoring in place so I'd actually know if something broke — all on AWS, on a
student budget.

This is an expense tracker app — a FastAPI backend backed by PostgreSQL, with a
React + Vite frontend (served by nginx) for adding, listing, and summarizing expenses. The point isn't really
the app itself; it's everything around it: Terraform-provisioned EKS, Helm charts,
ArgoCD GitOps deploys, GitHub Actions CI/CD, and Prometheus/Grafana monitoring,
all built so the whole stack can be spun up for a session and torn down again
without leaving anything running (and billing) overnight.

## Architecture

```mermaid
flowchart LR
    Root["Expense Tracker DevOps Project"] --> AppArch["App Architecture"]
    Root --> Infra["Infrastructure - IaC"]
    Root --> CICD["CI-CD and GitOps"]
    Root --> Features["Application Features"]
    Root --> Mon["Monitoring"]
    Root --> Cost["Cost Management"]
    Root --> Repos["Repositories"]

    classDef appArch fill:#dbeafe,stroke:#3b82f6,color:#1e3a8a;
    classDef infra fill:#dcfce7,stroke:#22c55e,color:#14532d;
    classDef cicd fill:#fef9c3,stroke:#eab308,color:#713f12;
    classDef features fill:#fae8ff,stroke:#d946ef,color:#701a75;
    classDef mon fill:#ffe4e6,stroke:#f43f5e,color:#881337;
    classDef cost fill:#e0f2fe,stroke:#0ea5e9,color:#0c4a6e;
    classDef repos fill:#ede9fe,stroke:#8b5cf6,color:#4c1d95;

    class AppArch appArch;
    class Infra infra;
    class CICD cicd;
    class Features features;
    class Mon mon;
    class Cost cost;
    class Repos repos;
```

> 🔍 **Want the full breakdown?** Open [ARCHITECTURE.html](ARCHITECTURE.html) in a
> browser for an interactive, NotebookLM-style mind map — click a branch to
> expand/collapse it, scroll to zoom, drag to pan. (GitHub can't run the
> interactive version inline in this README, so download/open the file locally.)

## What I used

- **App**: Python, FastAPI, React + Vite, nginx, PostgreSQL, pytest, ruff
- **Containers**: Docker, multi-stage builds, Docker Compose for local dev
- **Infrastructure as Code**: Terraform (`terraform-aws-modules/vpc`, `terraform-aws-modules/eks`, IAM/OIDC for GitHub Actions)
- **Orchestration**: Amazon EKS, AWS EBS CSI driver
- **Packaging & GitOps**: Helm charts (per service + Bitnami `postgresql` dependency), ArgoCD "app of apps"
- **CI/CD**: GitHub Actions (lint/test/build, deploy-to-staging on merge, deploy-to-production on tag), GitHub Flow
- **Monitoring**: kube-prometheus-stack (Prometheus + Grafana + Alertmanager), `prometheus-fastapi-instrumentator`, Slack alerts
- **Registry**: Amazon ECR

## Project layout

This project spans two repos:

```
expense-tracker/                 # this repo - the application
├── backend/                     # FastAPI service (+ tests)
├── frontend/                    # React + Vite UI (served by nginx)
├── charts/
│   ├── backend/                 # Deployment, Service, Ingress, ServiceMonitor, seed Job
│   ├── frontend/                # Deployment, Service, Ingress
│   └── db/                      # thin wrapper around the Bitnami postgresql chart
└── .github/workflows/
    ├── ci.yml                   # lint + test + build (PRs)
    ├── deploy-staging.yml       # build, push to ECR, update GitOps repo (push to master)
    └── deploy-production.yml    # same, tagged release (push tag v*.*.*)

expense-tracker-infra/           # sibling repo - infrastructure + GitOps
├── bootstrap/                   # one-time: S3 state bucket + DynamoDB lock table
├── modules/platform/            # VPC, EKS, ECR, GitHub OIDC IAM role, EBS CSI
├── envs/dev/                    # the environment - calls modules/platform,
│                                 # installs ingress-nginx / ArgoCD / kube-prometheus-stack
└── gitops/dev/                  # ArgoCD Application manifests + per-env Helm values
```

## Prerequisites

- AWS account + credentials with the permissions in `expense-tracker-infra/expense-tracker-terraform-policy.json`
- `terraform` >= 1.6, `aws` CLI, `kubectl`, `helm`
- Docker (for local dev)
- A fork/clone of both `expense-tracker` and `expense-tracker-infra`

## Running it

A managed EKS control plane bills by the hour even when idle, so this project is
meant to be brought **up** for a session and torn **down** afterward.

### Every morning

```bash
cd expense-tracker-infra/envs/dev
terraform apply                       # ~10-15 min: VPC, EKS, ECR, ArgoCD, monitoring

aws eks update-kubeconfig --name expense-tracker-dev --region eu-central-1
kubectl apply -f ../../gitops/dev/root-app.yaml   # bootstrap ArgoCD "app of apps"
```

ArgoCD then syncs the backend, frontend, and db Applications from this repo's
`charts/` using values from `expense-tracker-infra/gitops/dev/values-*.yaml`.
A `git push` to `master` (after this point) rebuilds images, pushes to ECR, and
updates those values files automatically — ArgoCD picks up the change.

### Every evening

```bash
cd expense-tracker-infra/envs/dev
terraform destroy
```

This tears down the EKS cluster, NAT gateway, load balancer, and everything else —
running it before bed instead of leaving the cluster up overnight saves roughly
$3-4/day in EKS control plane, NAT gateway, and NLB charges alone.

### Verify everything is destroyed

```bash
aws eks list-clusters --region eu-central-1                 # []
aws ec2 describe-instances --region eu-central-1 \
  --filters "Name=instance-state-name,Values=running,pending" \
  --query 'Reservations[*].Instances[*].InstanceId'          # []
aws ec2 describe-addresses --region eu-central-1             # []
aws ecr describe-repositories --region eu-central-1 \
  --query 'repositories[*].repositoryName'                   # []
```

If any of these come back non-empty, something didn't get cleaned up and is
still billing.

## Security notes (auth feature)

> State these back before shipping to real users:

- **Passwords** are hashed with bcrypt via `passlib`. Plain-text passwords are never stored, logged, or transmitted beyond the initial login request.
- **Data isolation is the #1 correctness requirement.** Every query filters by `user_id == me OR household_id == my_household`. A user can never read, edit, or delete another household's data. The `can_access()` helper enforces this on every write; violations return HTTP 403.
- **JWT secret:** set `JWT_SECRET_KEY` as an environment variable — never hardcode it. `docker-compose.yml` now sets a local-dev placeholder; replace it with a strong secret (e.g. `openssl rand -hex 32`) before any real deployment. For Kubernetes, put it in a Secret and reference it via Helm values.
- **HTTPS:** passwords are sent in the login request body. Without TLS, they travel in clear text. Use HTTPS/TLS (via cert-manager + Let's Encrypt or an AWS ACM certificate on the NLB) before real users log in.

---

## Testing auth + i18n + shared household (local docker-compose)

### Setup

```bash
docker compose up --build
# Frontend: http://localhost:80
# Backend API docs: http://localhost:8000/docs
```

The backend auto-runs migrations on startup. A demo user (`demo@example.com` / `demo1234`) is seeded on first boot.

---

### Test 1 — Register, login, "Remember me"

1. Open `http://localhost:80` → you are redirected to `/login` (not logged in).
2. Click "Register" → create **User A**: `usera@test.com` / `password123`.
3. Log in as User A. Check "Remember me". Add a **personal** expense (toggle = Personal). Call it "A's private expense".
4. Close the browser tab, reopen `http://localhost:80` → you are still logged in (token was in `localStorage`).
5. Log out.
6. Log in again WITHOUT checking "Remember me". Close and reopen the tab → you are sent back to `/login` (token was in `sessionStorage`, cleared on tab close). ✓

---

### Test 2 — Data isolation between users

1. Register **User B**: `userb@test.com` / `password123`.
2. Log in as User B.
3. Confirm the Transactions, Income, Dashboard pages are **empty** — User B sees none of User A's data. ✓
4. Add a personal expense as User B. Log out, log in as User A — User A cannot see User B's expense. ✓

---

### Test 3 — Shared household (husband & wife)

1. Log in as **User A** → Settings → "Shared Account" section → click **Create shared account**. Note the invite code (e.g. `xK9mPq2T`).
2. Log out. Log in as **User B** → Settings → **Join with code** → enter the invite code → join.
3. Log in as **User A** → add a **shared** expense (Visibility = "Shared (Household)"). Call it "Joint groceries".
4. Log out. Log in as **User B** → open Transactions → "Joint groceries" appears with the `👥` icon. ✓
5. Log in as **User A** → confirm "A's private expense" (from Test 1, created as Personal) is **still visible to A** but NOT to B. Log in as User B to verify B cannot see it. ✓

---

### Test 4 — Different household, complete isolation

1. Register **User C**: `userc@test.com` / `password123`.
2. Log in as User C → Settings → Create a **different** shared account.
3. Add a shared expense as User C.
4. Log in as User A or B → confirm **zero** of User C's entries appear anywhere. ✓
5. Log in as User C → confirm **zero** of A/B's entries appear. ✓

---

### Test 5 — i18n and RTL

1. Log in. In the top bar, switch to **עברית (Hebrew)** → entire app flips to RTL: sidebar moves to the right, text is right-aligned, all labels are in Hebrew. ✓
2. Switch to **العربية (Arabic)** → same RTL layout, Arabic text. ✓
3. Switch to **Français**, **Русский**, **中文** — layout returns to LTR, text in respective language, no English strings visible. ✓
4. Refresh the page → language persists (stored in `localStorage`). ✓

---

## Two environments

| | Local | AWS (dev cluster) |
| --- | --- | --- |
| How | `docker compose up --build` | `terraform apply` in `expense-tracker-infra/envs/dev` |
| Frontend | http://localhost:80 | via ingress-nginx NLB, host `expense-tracker.local` |
| Backend | http://localhost:8000/docs | via NLB, host `api.expense-tracker.local` |
| Database | local Postgres container | Bitnami `postgresql` StatefulSet + EBS PVC |
| Deploys | manual rebuild | GitHub Actions → ECR → ArgoCD GitOps |

A `git push` to `master` deploys to the AWS dev cluster (staging-style); pushing a
`v*.*.*` tag re-builds and promotes that exact image as a "production" release —
this project runs a single budget-friendly environment, with the production
workflow as the pattern to extend once a second environment exists.

## The demo

With the cluster up:

1. **ArgoCD** — `terraform output -raw argocd_ingress_hostname_command | bash` for the
   URL, `terraform output -raw argocd_admin_password_command | bash` for the password.
   All four Applications (`expense-tracker-dev`, `-backend-dev`, `-frontend-dev`,
   `-db-dev`) should show **Synced / Healthy**.
2. **The app** — open `http://expense-tracker.local` (via the NLB hostname + `Host`
   header, or add it to `/etc/hosts`) for the React frontend, and
   `http://api.expense-tracker.local/docs` for the FastAPI Swagger UI.
3. **Grafana** — `kubectl port-forward -n monitoring svc/kube-prometheus-stack-grafana 3000:80`,
   open `http://localhost:3000` and check the cluster/node/pod dashboards plus the
   backend's custom `/metrics`.
4. **CI/CD** — push a small change to `master` and watch GitHub Actions build, push to
   ECR, and commit the new image tag to `expense-tracker-infra`; ArgoCD self-heals the
   running Deployment within a couple of minutes.
5. **Alerts** — crash-loop a pod (e.g. scale the backend to an image tag that doesn't
   exist) and watch Alertmanager fire `KubePodCrashLooping` to Slack.

## Cost (just for my own project)

Rough hourly cost while the cluster is up (`eu-central-1`, on-demand pricing):

| Resource | Approx. cost |
| --- | --- |
| EKS control plane | $0.10 / hour |
| NAT gateway | $0.045 / hour + data |
| 2x `t3.medium` spot worker nodes | ~$0.01-0.02 / hour each |
| Network Load Balancer (ingress) | ~$0.025 / hour + usage |
| ECR storage | negligible (few hundred MB) |
| S3 + DynamoDB (Terraform state) | negligible (always on) |

A few hours of `apply` → demo → `destroy` costs **well under $1**. Don't leave the
cluster running overnight unless you mean to.

---

Built by David — DevOps Final Project, 2026
