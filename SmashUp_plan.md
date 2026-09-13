# SmashUp — Backend-First Project Specification & Roadmap

## 1. Project Vision

SmashUp is a Django-based issue management system for small software teams.

The core idea is NOT to build a generic to-do app or a simple AI wrapper.

A developer submits a messy bug report. SmashUp helps turn it into a structured, actionable issue by:

1. Extracting useful information.
2. Identifying missing information.
3. Suggesting category and priority.
4. Finding potentially similar/duplicate issues.
5. Showing evidence/supporting text.
6. Letting a human review, edit, approve, or reject the AI suggestions.
7. Recording what the AI suggested and what the human finally decided.

Core principle:

> AI suggests. Human verifies. SmashUp records the decision.

The project should prioritize backend engineering, reliability, security, database design, testing, APIs, asynchronous processing, and production practices.

The frontend should remain minimal. Do not spend significant time on visual design.

---

# 2. Product Example

A developer enters:

> "When I try to pay from my phone, sometimes nothing happens. It happened twice today on Chrome."

SmashUp should eventually produce something similar to:

- Title: Payment failure on mobile Chrome
- Category: Payment
- Environment: Mobile + Chrome
- Symptoms: Payment fails intermittently
- Missing information:
  - OS/version
  - Exact error message
  - Steps to reproduce
- Possible duplicate:
  - #142 — Mobile payment timeout
- Suggested priority: Medium
- Reason: Critical workflow is affected, but impact/frequency is unclear
- Confidence: an appropriate confidence value if supported by the AI workflow

The human reviews the result and can modify it before approval.

Do NOT allow the AI to silently overwrite the authoritative issue data.

---

# 3. Technology Stack

## Core

- Python
- Django
- Django REST Framework
- PostgreSQL
- Django ORM
- Git/GitHub
- pytest and/or Django TestCase

## Backend Infrastructure

- Redis
- Celery
- Docker / Docker Compose
- Gunicorn
- Nginx only if genuinely useful for deployment
- Django sessions and/or JWT depending on API architecture

## AI

- An LLM API through a dedicated service layer.
- Structured JSON/structured output.
- Strong validation of AI responses.
- Prompt versioning.
- Timeouts and retries.
- AI failures must not corrupt the application.
- Track model/cost/latency where practical.

## Search

Start with PostgreSQL search.

Potential future option:
- embeddings/vector search only if PostgreSQL text search proves insufficient.

Do NOT introduce Elasticsearch, a vector database, or microservices just for complexity.

---

# 4. Architecture

Use a modular Django monolith initially.

High-level architecture:

Client / minimal UI
        |
        v
Django + Django REST Framework
        |
        +---- Accounts
        +---- Projects
        +---- Issues
        +---- AI
        +---- Notifications (only when needed)
        |
        v
PostgreSQL

Django
   |
   v
Redis
   |
   v
Celery Worker
   |
   v
AI Service
   |
   v
LLM API

Do NOT start with microservices.

---

# 5. Proposed Django Structure

Use this as a target structure, but create files/apps progressively rather than all at once.

smashup/
|
├── backend/
│   |
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── development.py
│   │   │   └── production.py
│   │   ├── urls.py
│   │   ├── asgi.py
│   │   ├── wsgi.py
│   │   └── celery.py
│   |
│   ├── accounts/
│   ├── projects/
│   ├── issues/
│   ├── ai/
│   ├── notifications/
│   └── common/
|
├── tests/
├── requirements/
│   ├── base.txt
│   ├── development.txt
│   └── production.txt
|
├── Dockerfile
├── docker-compose.yml
├── .env
├── .env.example
├── .gitignore
└── README.md

Each major app should eventually separate concerns into:
- models.py
- serializers.py
- views.py
- urls.py
- permissions.py
- services.py
- tests/

Use service layers when business logic becomes substantial. Do not force unnecessary abstractions.

---

# 6. Database Design

Core relationships:

User
 |
 +---- Profile
 |
 +---- Project
         |
         +---- ProjectMember
         |
         +---- Issue
                 |
                 +---- IssueComment
                 +---- IssueAssignment / assigned user
                 +---- IssueLabel
                 +---- IssueHistory
                 +---- AITriage

## User

Use a proper custom user model.

Possible fields:
- id
- email
- password
- name
- created_at

Reuse the existing account foundation where appropriate.

## Project

Fields:
- id
- name
- description
- owner
- created_at
- updated_at

## ProjectMember

Fields:
- project
- user
- role
- joined_at

Roles:
- OWNER
- ADMIN
- DEVELOPER
- VIEWER

Add appropriate database constraints, especially uniqueness for project + user.

## Issue

Fields should include:
- id
- project
- title
- description
- status
- priority
- category
- created_by
- assigned_to
- created_at
- updated_at
- resolved_at

Possible status:
- OPEN
- IN_PROGRESS
- RESOLVED
- CLOSED

Possible priority:
- LOW
- MEDIUM
- HIGH
- CRITICAL

Use Django choices/enums where appropriate.

## IssueComment

Fields:
- issue
- author
- content
- created_at
- updated_at if needed

## IssueLabel

Design a reusable label system rather than hard-coding labels into issues.

## IssueHistory

Fields:
- issue
- user
- action
- old_value
- new_value
- created_at

Purpose:
Maintain an audit trail.

Example:
- Habib created issue
- AI suggested HIGH priority
- Habib changed priority HIGH -> MEDIUM
- Ahmed assigned issue
- Niyas changed status OPEN -> IN_PROGRESS

## AITriage

Keep AI output separate from authoritative Issue fields.

Possible fields:
- issue
- status
- suggested_title
- suggested_category
- suggested_priority
- summary
- extracted_environment
- missing_information
- similar_issues
- confidence
- model_name
- prompt_version
- created_at
- completed_at
- latency/cost where practical

Consider separate fields or related models for human review decisions if that produces a cleaner design.

Important:
AI output is a suggestion, not automatically the source of truth.

---

# 7. Core Backend Workflow

Build the normal issue system BEFORE AI.

Initial workflow:

User
  |
  v
Create Project
  |
  v
Add Project Members
  |
  v
Create Issue
  |
  v
View Issue
  |
  +--> Edit
  +--> Assign
  +--> Change status
  +--> Change priority
  +--> Comment
  +--> Add labels
  +--> View history

Once this works reliably, introduce AI.

---

# 8. REST API

Eventually expose the main workflows through DRF.

Possible endpoints:

GET    /api/projects/
POST   /api/projects/

GET    /api/projects/<id>/
PATCH  /api/projects/<id>/

GET    /api/projects/<id>/issues/
POST   /api/projects/<id>/issues/

GET    /api/issues/<id>/
PATCH  /api/issues/<id>/

POST   /api/issues/<id>/triage/

GET    /api/issues/<id>/triage/
GET    /api/issues/<id>/history/
POST   /api/issues/<id>/comments/

Do not blindly follow these URLs if another REST design is more appropriate. Keep the API consistent and idiomatic.

Learn and apply:
- serializers
- validation
- ViewSets / GenericAPIView / APIView where appropriate
- routers
- authentication
- permissions
- pagination
- filtering
- throttling
- error handling

---

# 9. Authorization and Security

Security is a major part of the project.

Critical requirement:

A user belonging to Project A must not be able to access or modify Project B's issues simply by changing an object ID in the URL.

Implement and test:
- authentication
- project membership
- role-based permissions
- object-level authorization
- input validation
- API throttling/rate limiting where appropriate
- secure configuration
- environment variables for secrets
- production settings
- safe error responses

Test authorization boundaries explicitly.

Examples:
- Viewer cannot modify issues.
- Non-member cannot read project issues.
- Project member cannot modify another project's data.
- Unauthenticated user cannot access protected endpoints.

---

# 10. AI Triage Architecture

Desired workflow:

POST /api/issues/
        |
        v
Issue saved
        |
        v
Celery task queued
        |
        v
Redis
        |
        v
Celery worker
        |
        v
AI service
        |
        v
LLM API
        |
        v
Structured response
        |
        v
Validate response
        |
        v
AITriage saved
        |
        v
Human review

Do NOT make the HTTP request wait unnecessarily for the LLM.

AI service should be isolated from views so it can be tested independently.

Suggested conceptual modules:

ai/
├── services.py
├── prompts.py
├── schemas.py
├── tasks.py
└── tests/

---

# 11. AI Reliability Requirements

The AI workflow must handle:
- timeout
- API failure
- malformed output
- invalid fields
- missing fields
- rate limits
- retries
- duplicate task execution where relevant
- partial failure

Never allow invalid AI output to silently corrupt the Issue model.

Use validation before saving AI results.

Keep enough information to answer:
- Which model generated this?
- Which prompt version was used?
- When did it run?
- How long did it take?
- What did it suggest?
- What did the human change?

---

# 12. Similar Issue Detection

Start simple.

New issue
    |
    v
PostgreSQL search
    |
    v
Potentially similar issues
    |
    v
Top results shown to human

Use PostgreSQL full-text search and proper indexing first.

Only add embeddings/vector search later if there is a demonstrated need.

Goal:
Find potentially related/duplicate issues, not make an unsupported claim that two issues are definitely duplicates.

---

# 13. Testing Strategy

Testing should be a major part of SmashUp.

Test categories:

## Authentication
- registration
- login
- logout
- protected endpoints

## Projects
- project creation
- membership
- roles

## Permissions
- cross-project access blocked
- viewer restrictions
- admin permissions
- owner permissions

## Issues
- creation
- editing
- assignment
- status changes
- priority changes
- comments
- labels
- history

## AI
- valid response
- malformed response
- timeout
- API failure
- retry
- validation
- human correction

## API
- status codes
- validation errors
- authentication
- authorization
- pagination
- filtering

Tests should prove behavior, not merely increase coverage numbers.

---

# 14. PostgreSQL Skills to Demonstrate

Use PostgreSQL beyond basic CRUD.

Learn and apply:
- foreign keys
- unique constraints
- check constraints where appropriate
- indexes
- transactions
- select_related
- prefetch_related
- annotations
- aggregations
- query optimization
- PostgreSQL full-text search

Use query inspection/debugging tools to detect N+1 queries.

Do not optimize blindly. Measure first.

---

# 15. Celery + Redis

First learn Celery with a simple non-AI task.

Example:

Issue created
   |
   v
Background task
   |
   v
Simple processing
   |
   v
Database update

Then replace the simple task with AI processing.

Redis will initially serve as the Celery broker.

Later, use Redis caching only when there is a real caching requirement.

---

# 16. Docker

Add Docker after the core Django application is working.

Eventually Docker Compose should provide:

- Django
- PostgreSQL
- Redis
- Celery worker

Goal:

docker compose up

should start the development environment reproducibly.

Do not let Docker become a distraction while learning Django fundamentals.

---

# 17. Production

Eventually prepare:
- production settings
- DEBUG=False
- environment variables
- secure secret handling
- allowed hosts
- database configuration
- Gunicorn
- static/media handling
- logging
- error handling
- health checks
- deployment
- CI/CD

Nginx can be introduced if the deployment architecture benefits from it.

---

# 18. CI/CD

Use GitHub Actions eventually:

git push
   |
   v
GitHub Actions
   |
   +--> lint/check
   |
   +--> tests
   |
   +--> build
   |
   +--> deploy

Do not add CI/CD before the project has meaningful automated tests.

---

# 19. Three-Month Development Plan

## Phase 1 — Django foundation
Duration: 1–2 weeks

Strengthen:
- Django models
- relationships
- QuerySets
- transactions
- managers
- signals
- settings
- authentication
- permissions

Build:
- User
- Project
- ProjectMember
- Issue

No AI yet.

## Phase 2 — Issue management
Duration: 1–2 weeks

Build:
- CRUD
- assignment
- status
- priority
- comments
- labels
- history

Frontend remains minimal.

## Phase 3 — DRF
Duration: 1–2 weeks

Build proper REST APIs.

Learn:
- serializers
- views
- ViewSets
- permissions
- authentication
- pagination
- filtering
- throttling
- validation
- error handling

## Phase 4 — PostgreSQL depth
Duration: ~1 week

Practice:
- indexes
- constraints
- transactions
- optimized queries
- annotations
- PostgreSQL search

## Phase 5 — Celery + Redis
Duration: ~1 week

First implement a simple background task.

Then connect it to AI processing.

## Phase 6 — AI triage
Duration: 1–2 weeks

Implement:
- AI service
- structured output
- validation
- retries
- timeout handling
- prompt versioning
- AITriage model
- human approval/edit/reject

## Phase 7 — Similar issue detection
Duration: ~1 week

Start with PostgreSQL search.

Measure quality.

Only then consider embeddings/vector search.

## Phase 8 — Security + testing
Duration: 1–2 weeks

Attack your own API.

Test:
- authorization
- data isolation
- invalid input
- AI failures
- concurrent updates where relevant
- API behavior

## Phase 9 — Production
Final stage

Add:
- Docker
- production configuration
- Gunicorn
- logging
- CI/CD
- deployment
- documentation

---

# 20. Rules for This Project

1. Backend > frontend design.
2. Correctness > feature count.
3. Understand every technology before adding another.
4. Do not add microservices.
5. Do not add a vector database just for resume keywords.
6. Do not make AI the entire application.
7. AI suggestions must be reviewable.
8. Security must be tested.
9. Database design must be intentional.
10. Measure performance before optimizing.
11. Write tests for important behavior.
12. Build incrementally.
13. Prefer simple architecture that can evolve.
14. Do not copy large blocks of AI-generated code without understanding them.
15. Every major technology must have a concrete reason to exist.

---

# 21. Current Starting Point

The existing SmashUp project already has:
- Django
- authentication
- registration
- login/logout
- profiles
- basic tests
- basic admin configuration

The following are not implemented yet and should be built next:
- projects
- project membership
- permissions
- issues
- issue workflow
- comments
- history
- DRF API
- Celery/Redis
- AI triage
- search
- production infrastructure

Do not rebuild existing authentication unnecessarily.

---

# 22. Immediate Next Step

DO NOT start implementing the entire project.

First:

1. Inspect the existing SmashUp repository.
2. Understand the existing accounts app.
3. Design the database relationships for:
   - Project
   - ProjectMember
   - Issue
4. Explain the design before making changes.
5. Get confirmation before implementing the models.

After models:
- migrations
- admin
- tests
- services
- API
- permissions

Build one layer at a time.

---

# 23. Instructions for Codex

You are working on a learning-focused backend project.

The developer is a Django learner and wants to understand the implementation rather than blindly receive a giant code dump.

Therefore:

- Inspect the existing repository before changing anything.
- Preserve working code unless there is a clear reason to modify it.
- Do not rewrite the project from scratch.
- Do not implement the entire roadmap in one operation.
- Work in small milestones.
- Before substantial architectural changes, explain what you intend to change and why.
- Prefer simple Django patterns first.
- Do not introduce technologies before their purpose is clear.
- Keep frontend work minimal.
- Prioritize backend correctness, security, testing, database design, APIs, asynchronous jobs, and reliability.
- When implementing a feature, explain the important concepts the developer should understand.
- Do not hide complexity behind unnecessary abstractions.
- Add tests with important backend behavior.
- After each milestone, report:
  1. What changed
  2. Why it was changed
  3. How it works
  4. What was tested
  5. What the developer should learn
  6. What the next milestone is

IMPORTANT:
The immediate milestone is ONLY database design for Project, ProjectMember, and Issue.

Do not implement Celery, Redis, AI, Docker, vector search, notifications, or microservices yet.

First inspect the current repository and propose the model design based on the existing code.
