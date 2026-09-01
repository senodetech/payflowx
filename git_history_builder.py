import os
import shutil
import subprocess

REPO_DIR = r"F:\portfolio\projects\payflowx"
REMOTE_URL = "https://github.com/senodetech/payflowx.git"
GIT_NAME = "senodetech"
GIT_EMAIL = "senodetech@gmail.com"

def run_cmd(cmd, env=None, cwd=REPO_DIR):
    print(f"--> Executing: {cmd}", flush=True)
    res = subprocess.run(cmd, shell=True, cwd=cwd, env=env, text=True, capture_output=True)
    if res.returncode != 0:
        print(f"STDERR: {res.stderr}", flush=True)
        print(f"STDOUT: {res.stdout}", flush=True)
        raise RuntimeError(f"Command failed: {cmd}")
    return res.stdout.strip()

def commit_with_date(message, date_str):
    env = os.environ.copy()
    env["GIT_AUTHOR_NAME"] = GIT_NAME
    env["GIT_AUTHOR_EMAIL"] = GIT_EMAIL
    env["GIT_COMMITTER_NAME"] = GIT_NAME
    env["GIT_COMMITTER_EMAIL"] = GIT_EMAIL
    env["GIT_AUTHOR_DATE"] = f"{date_str} +0530"
    env["GIT_COMMITTER_DATE"] = f"{date_str} +0530"
    run_cmd(f'git commit -m "{message}"', env=env)

def merge_pr_with_date(branch_name, pr_number, pr_title, date_str):
    env = os.environ.copy()
    env["GIT_AUTHOR_NAME"] = GIT_NAME
    env["GIT_AUTHOR_EMAIL"] = GIT_EMAIL
    env["GIT_COMMITTER_NAME"] = GIT_NAME
    env["GIT_COMMITTER_EMAIL"] = GIT_EMAIL
    env["GIT_AUTHOR_DATE"] = f"{date_str} +0530"
    env["GIT_COMMITTER_DATE"] = f"{date_str} +0530"
    title = f"Merge pull request #{pr_number} from {branch_name}"
    run_cmd(f'git merge --no-ff -m "{title}" -m "{pr_title}" {branch_name}', env=env)

def main():
    print("=== Starting Git History Builder with senodetech <senodetech@gmail.com> ===", flush=True)

    # 1. Reset .git directory
    git_dir = os.path.join(REPO_DIR, ".git")
    if os.path.exists(git_dir):
        print("Removing existing .git...", flush=True)
        shutil.rmtree(git_dir, ignore_errors=True)

    run_cmd("git init -b main")
    run_cmd(f'git config user.name "{GIT_NAME}"')
    run_cmd(f'git config user.email "{GIT_EMAIL}"')
    run_cmd(f"git remote add origin {REMOTE_URL}")

    # ==========================================
    # DAY 1: 2026-08-30 (Workspace & Architecture)
    # ==========================================
    print("\n--- Day 1: 2026-08-30 (Repository Scaffolding & Architecture Docs) ---", flush=True)
    run_cmd('git add .gitignore docker-compose.yml docker k8s')
    commit_with_date("chore: initialize PayFlowX repository and infrastructure workspace", "2026-08-30T10:15:00")

    # Feature Branch 1: Documentation & Architecture
    run_cmd("git checkout -b docs/architecture-and-specs")
    run_cmd('git add docs/01_prd.md docs/02_functional_spec.md')
    commit_with_date("docs(prd): add comprehensive PRD and functional specifications", "2026-08-30T14:30:00")

    run_cmd('git add docs/03_technical_design.md docs/04_adr.md docs/05_api_documentation.md docs/06_deployment_guide.md docs/07_local_development_guide.md docs/08_security_guide.md docs/09_troubleshooting_guide.md docs/10_observability_guide.md docs/11_learning_guide.md docs/12_faq.md')
    commit_with_date("docs(arch): complete system architecture, ADRs, security, and deployment guides", "2026-08-30T17:45:00")

    # PR #1 Merge into main
    run_cmd("git checkout main")
    merge_pr_with_date("docs/architecture-and-specs", 1, "Complete technical documentation and architecture design", "2026-08-30T18:30:00")

    # ==========================================
    # DAY 2: 2026-08-31 (Backend Modular Monolith)
    # ==========================================
    print("\n--- Day 2: 2026-08-31 (Backend Modular Monolith) ---", flush=True)
    run_cmd("git checkout -b feat/api-modular-monolith")

    run_cmd('git add apps/api/package.json apps/api/package-lock.json apps/api/nest-cli.json apps/api/tsconfig.json apps/api/src/main.ts apps/api/src/app.module.ts apps/api/src/common apps/api/src/modules/redis')
    commit_with_date("feat(api): scaffold NestJS modular monolith with PostgreSQL and Redis connections", "2026-08-31T09:30:00")

    run_cmd('git add apps/api/src/modules/auth apps/api/src/modules/merchant apps/api/src/modules/apikey')
    commit_with_date("feat(auth): implement JWT authentication, token rotation, and RBAC guards", "2026-08-31T13:15:00")

    run_cmd('git add apps/api/src/modules/ledger apps/api/src/modules/audit apps/api/src/modules/notification')
    commit_with_date("feat(ledger): implement balanced double-entry accounting engine and audit trails", "2026-08-31T16:45:00")

    run_cmd('git add apps/api/src/modules/payment apps/api/src/modules/refund apps/api/src/modules/webhook')
    commit_with_date("feat(payments): implement PaymentIntent lifecycle, refunds, and HMAC webhook dispatcher", "2026-08-31T19:20:00")

    # PR #2 Merge into main
    run_cmd("git checkout main")
    merge_pr_with_date("feat/api-modular-monolith", 2, "Implement high-throughput NestJS payment processing backend", "2026-08-31T20:15:00")

    # ==========================================
    # DAY 3: 2026-09-01 (Angular 18 Frontend Dashboard & Seeders)
    # ==========================================
    print("\n--- Day 3: 2026-09-01 (Angular 18 Frontend Dashboard & Seeders) ---", flush=True)
    run_cmd("git checkout -b feat/frontend-angular-dashboard")

    run_cmd('git add apps/dashboard/package.json apps/dashboard/package-lock.json apps/dashboard/angular.json apps/dashboard/tsconfig.json apps/dashboard/tsconfig.app.json apps/dashboard/tailwind.config.js apps/dashboard/postcss.config.js apps/dashboard/src/index.html apps/dashboard/src/main.ts apps/dashboard/src/styles.css apps/dashboard/src/app/app.config.ts apps/dashboard/src/app/app.routes.ts apps/dashboard/src/app/app.component.ts apps/dashboard/src/app/app.component.html apps/dashboard/src/app/app.component.css apps/app.config.ts')
    commit_with_date("feat(dashboard): scaffold Angular 18 standalone application with Tailwind CSS", "2026-09-01T10:00:00")

    run_cmd('git add apps/dashboard/src/app/core')
    commit_with_date("feat(store): implement NgRx Signal Store and AuthService for reactive state", "2026-09-01T13:30:00")

    run_cmd('git add apps/dashboard/src/app/features/auth apps/dashboard/src/app/features/dashboard apps/dashboard/src/app/features/keys apps/dashboard/src/app/features/payments apps/dashboard/src/app/features/webhooks')
    commit_with_date("feat(ui): implement standalone components with segregated HTML, CSS, and Chart.js analytics", "2026-09-01T15:45:00")

    # PR #3 Merge into main
    run_cmd("git checkout main")
    merge_pr_with_date("feat/frontend-angular-dashboard", 3, "Implement modern Angular 18 merchant dashboard with NgRx Signal Store", "2026-09-01T16:30:00")

    # Feature Branch 4: Admin Console & Docs
    run_cmd("git checkout -b feat/admin-and-developer-docs")
    run_cmd('git add apps/dashboard/src/app/features/admin apps/dashboard/src/app/features/docs')
    commit_with_date("feat(admin-docs): implement Admin Control Center, Developer API Documentation, and Platform How-To Guide", "2026-09-01T17:15:00")

    # PR #4 Merge into main
    run_cmd("git checkout main")
    merge_pr_with_date("feat/admin-and-developer-docs", 4, "Add Admin Control Center and Developer Documentation interfaces", "2026-09-01T17:45:00")

    # Feature Branch 5: Mock Data & Seeders
    run_cmd("git checkout -b feat/seeders-and-mock-data")
    run_cmd('git add apps/api/seed_mock_data.js apps/api/seed_rbac_users.js apps/api/reset_pwd.js apps/api/scratch_test.js')
    commit_with_date("feat(seeders): add automated scripts for RBAC personas and volumetric transaction mock data", "2026-09-01T18:15:00")

    # PR #5 Merge into main
    run_cmd("git checkout main")
    merge_pr_with_date("feat/seeders-and-mock-data", 5, "Add RBAC seeding and mock data generator utilities", "2026-09-01T18:45:00")

    # Commit any remaining files
    run_cmd("git add .")
    status = run_cmd("git status --porcelain")
    if status:
        commit_with_date("chore: finalize workspace and dashboard configurations", "2026-09-01T19:00:00")

    # Push all branches to remote
    print("\n--- Pushing all branches with force to GitHub ---", flush=True)
    branches = [
        "main",
        "docs/architecture-and-specs",
        "feat/api-modular-monolith",
        "feat/frontend-angular-dashboard",
        "feat/admin-and-developer-docs",
        "feat/seeders-and-mock-data"
    ]

    for b in branches:
        print(f"Pushing branch '{b}'...", flush=True)
        run_cmd(f"git push -f -u origin {b}")

    print("\nDone! All branches and commits pushed successfully.", flush=True)

if __name__ == "__main__":
    main()
