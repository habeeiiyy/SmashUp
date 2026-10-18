# SmashUp — Start here when you return

Snapshot: 16 September 2026 | Branch: `main` | Latest commit: `b625cab` (15 September 2026)

## 1. The one-minute reminder

SmashUp is your **backend-focused project and issue tracker**. A team creates a project, adds members, and records bugs or tasks as issues. Later, AI will suggest how to organise messy bug reports, and a human will approve or change those suggestions.

**Where you stopped:** you had built the account foundation, project membership services, ownership transfer, and the first issue-creation service. Your latest commit added issue-creation tests.

**Your next small milestone:** build and test a service for editing an existing issue's title, description, and category, with clear permission rules. This is a suggested next step based on the current code, not an unfinished function already in the repository.

You do not need to restart the project or remember the whole roadmap. Read sections 2 and 4, run the commands in section 5, and work on one small feature.

## 2. What you have already built

“Implemented” below means the code exists. It does not mean every feature has a browser screen or every possible case has been tested.

| Area | What is already there | Current limit |
| --- | --- | --- |
| Accounts | Registration, login, logout, protected home and profile pages | Automated account tests currently cover registration without email only |
| Profiles | Automatically created profile with bio and avatar fields; profile registered in Django admin | Profile page displays username and bio; an edit form exists but is not connected to an update view |
| Database | PostgreSQL configuration, models, and saved migrations | Keep the local database and environment settings available when returning |
| Projects | Project name, description, owner, and timestamps | No project pages or API yet |
| Membership | Owner, admin, developer, and viewer roles; duplicate membership blocked | General role-changing workflow is still pending |
| Project services | Create a project, add/remove members, transfer ownership | These are Python functions, not browser actions yet |
| Issues | Issue fields, status/priority choices, optional assignee, timestamps | Only creation has a service so far |
| Comments and labels | Database models and relationships exist | No complete comment/label workflows yet |
| Tests | Account registration, project services, issue creation | More feature and HTTP/API tests remain |

### Project rules you already implemented

In `backend/projects/services.py`:

- `create_project()` saves the project and gives its creator an OWNER membership.
- `add_member()` allows the owner or an admin to add a member. It rejects invalid roles and direct additions of another OWNER.
- `remove_member()` allows the owner or an admin to remove a member. The current owner must transfer ownership before being removed.
- `transfer_ownership()` allows only the current owner to transfer ownership. The old owner becomes an ADMIN. The new owner becomes OWNER, with a membership created if needed.

The database prevents the same user joining a project twice and prevents more than one OWNER membership for a project. Creating the required owner membership is handled by the service; the uniqueness rule alone does not guarantee that one exists.

These functions use a **transaction**: related changes succeed together or are rolled back together. Membership changes also reload and lock the project row before checking permissions.

### The bug you recently fixed

Commit `f888e0b` is called “solved my stale auth bug.” The code reloads the project before checking who owns it. This stops an old in-memory copy of a project from giving a former owner outdated permissions. A regression test checks that a removed former owner cannot add a member using that stale copy.

Here, “stale” means “an old copy that no longer matches the database.”

### Issue creation already works at the service level

In `backend/issues/services.py`, `create_issue()`:

- Allows the project owner, an admin, or a developer to create an issue.
- Rejects viewers, outsiders, and removed members.
- Allows an optional assignee, but that person must belong to the project.
- Validates the issue before saving it.
- Starts the issue with status `OPEN` and priority `MEDIUM`.

The status choices are `OPEN`, `IN_PROGRESS`, `IN_REVIEW`, `RESOLVED`, and `CLOSED`. Priority choices are `LOW`, `MEDIUM`, `HIGH`, and `CRITICAL`.

Having these fields does not yet provide actions for changing status, changing priority, or reassigning an issue later.

## 3. What is pending, in a sensible order

### Next: finish the ordinary issue workflow

- [ ] Edit an issue with permission checks.
- [ ] Assign, reassign, and unassign an existing issue.
- [ ] Change status and priority with clear rules.
- [ ] Decide when to set or clear `resolved_at` when resolving or reopening an issue.
- [ ] Add comment creation/editing/removal rules.
- [ ] Add label creation and attachment rules; prevent labels from another project being attached.
- [ ] Add `IssueHistory` so changes have a record of who changed what and when. This model does not exist yet.
- [ ] Decide what happens to existing assignments when a member leaves a project.
- [ ] Add tests alongside each important behaviour.

### Then: make these features usable through requests

- [ ] Add Django REST Framework and API endpoints for projects, membership, and issues.
- [ ] Connect endpoints to the existing services.
- [ ] Enforce membership for reading data as well as changing it.
- [ ] Test that someone from Project A cannot read or edit Project B by changing an ID in a URL.
- [ ] Add input validation, clear error responses, pagination, filtering, and appropriate throttling.
- [ ] Add a minimal interface when useful. The `frontend/` directory is currently empty; account templates live inside the backend.

Project and issue `views.py` files are placeholders, their `admin.py` files have no model registrations, and the main URL configuration currently exposes only account routes and Django admin. A missing project screen is therefore expected at this stage.

### Later: background jobs and AI

- [ ] Learn Celery and Redis with one simple background task.
- [ ] Add a separate AI service and an `AITriage` model.
- [ ] Validate AI output and handle failures, timeouts, and retries.
- [ ] Let a human approve, edit, or reject suggestions.
- [ ] Record the AI suggestion separately from the final issue data.
- [ ] Add similar-issue search, starting with PostgreSQL search.

The README describes the intended AI-powered product. There is currently no AI implementation in this checkout.

### Final preparation for deployment

- [ ] Add Docker, production settings, logging, and deployment configuration.
- [ ] Add automated checks and tests in GitHub Actions.
- [ ] Document setup fully and provide a safe `.env.example` containing placeholders.
- [ ] Review authentication and security behaviour, including login/logout tests and protected-route tests.

The current settings are for development (`DEBUG=True`). Deployment has not been verified in this report.

## 4. Your first session back — keep it small

1. **Read this page for five minutes.** You have a backend foundation and working service functions. You are continuing from there.
2. **Run the checks in section 5.** If something fails, restore the environment first.
3. **Open `backend/issues/services.py` and `backend/issues/tests.py`.** Read `create_issue()` and one allowed-user test and one rejected-user test.
4. **Choose the rules for editing an issue.** A simple proposal is: owner/admin/developer may edit; viewer/outsider/removed member may not. Treat this as a proposal to confirm, not an existing rule.
5. **Implement only title, description, and category editing.** Keep assignment and status changes for separate milestones.
6. **Test an allowed edit, a denied edit, invalid input, and unchanged data after rejection.** Then commit that small milestone.

Success for that session: you can explain who may edit an issue, the tests prove the rule, and you have one small completed change. You do not need to start AI or redesign the frontend.

### A ready-to-copy request for your next coding session

> Read START_HERE_AFTER_BREAK.md and inspect the current code before making changes. Help me continue SmashUp as a Django learner. The suggested next milestone is an issue-editing service for title, description, and category. First explain the permission rules and a small implementation plan, then help me implement and test that one milestone. Reuse the existing services and explain the important lines in simple language.

## 5. How to start the project again

Use an **Ubuntu / WSL terminal**, because the existing virtual environment is inside WSL. These commands are Bash commands, not PowerShell commands.

```bash
cd /home/habee/SmashUp/backend
source .venv/bin/activate
python --version
python -m django --version
python manage.py check
python manage.py showmigrations
python manage.py test --noinput
python manage.py runserver
```

`runserver` keeps running until you press `Ctrl+C`. Open `http://127.0.0.1:8000/` for registration, `/login/` for login, `/home/` for the protected home page, and `/profile/` for the protected profile page. `/admin/` requires a staff account.

To run only the issue tests while working on issues:

```bash
python manage.py test issues --noinput
```

If `showmigrations` lists an unchecked migration, apply the existing migrations with `python manage.py migrate` before using the app. You do not need to create new migrations just because you took a break.

### If startup fails

| Message or symptom | What to check first |
| --- | --- |
| Django cannot be imported | Check that `.venv` is activated and you are in `backend/` |
| Database connection refused | Check that PostgreSQL is running and matches the connection settings in `backend/.env` |
| Password or database authentication error | Check the local database credentials privately; do not paste them into the report or Git |
| Tests cannot create a test database | The PostgreSQL user needs permission to create Django's separate test database |
| Missing secret key or environment setting | Confirm `backend/.env` still exists |
| A project/issue page is missing | Those routes have not been built yet |

The settings read these names from the environment: `SECRET_KEY`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, and `DB_PORT`. Their values are intentionally not included here. `.env` and `.venv` are ignored by Git, so a fresh clone will not restore them automatically.

The observed environment reports Python `3.12.3` and Django `6.0.7`. These are recorded observations, not a fresh-install compatibility recommendation. If rebuilding the environment, check the supported Python version for the pinned Django release before installing `backend/requirements.txt`.

## 6. Where to find things

All paths in this table are relative to the project root.

| File or folder | Simple explanation |
| --- | --- |
| `backend/manage.py` | Entry point for Django commands |
| `backend/config/settings.py` | Installed apps, database setup, and development settings |
| `backend/config/urls.py` | Main list of website routes |
| `backend/accounts/` | Registration, login, profiles, and account templates |
| `backend/projects/models.py` | What project and membership records store |
| `backend/projects/services.py` | Rules for creating projects and managing membership/ownership |
| `backend/projects/tests.py` | Tests for those project rules |
| `backend/issues/models.py` | Issue, comment, and label database structure |
| `backend/issues/services.py` | Issue creation rules; likely place for your next milestone |
| `backend/issues/tests.py` | Issue creation tests; useful examples for the next tests |
| Each app's `migrations/` | Saved instructions that create or change database tables |
| `backend/requirements.txt` | Pinned Python dependencies |
| `SmashUp_plan.md` | Long-term vision and learning roadmap |

A **model** describes stored data. A **service** performs an operation and checks its rules. A **view** handles a browser/API request. A **migration** updates database structure. A **test** checks that behaviour remains correct.

## 7. Important reminders so you do not redo work

- Sections 21–23 of `SmashUp_plan.md` describe an older starting point. Projects, memberships, issues, and several services now exist. Use that file for the vision and this report for this dated progress snapshot.
- The roadmap proposes a custom user model, but the current account code uses Django's built-in `User`. Do not assume a custom user is already implemented; changing it later needs deliberate migration planning.
- Comments and labels have models already. Extend their workflows rather than recreating the models.
- Use the project services for project creation and ownership changes. Direct database writes can bypass service rules, and bulk ORM operations can bypass model methods.
- The frontend is deliberately minimal. The learning priority remains backend correctness, permissions, database design, and meaningful tests.
- AI should suggest changes and a human should review them. Keep AI suggestions separate from the final issue values.

## 8. Verification of this snapshot

The report was prepared by reading tracked source code, existing tests, migrations, the roadmap, and recent Git history. The working tree was clean before this report was created. No application code was changed.

- `python manage.py check`: passed with no issues.
- `python manage.py showmigrations`: all listed migrations applied in the current local database.
- `python manage.py makemigrations --check --dry-run`: no changes detected.
- `python manage.py test --noinput`: all 29 tests passed in 60.414 seconds using the configured PostgreSQL connection and a separate test database (2 account tests, 20 project tests, 7 issue tests).

Browser behaviour, production deployment, and remote GitHub status were not verified. “Pending” items come from missing workflows in the current code and the existing roadmap; the proposed next milestone is a recommendation.

