# Implementation Plan: Open Source Readiness & Documentation Cleanup

**Branch**: `011-update-readme-and` | **Date**: 2025-12-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/home/agentx/github-repos/zakapp/specs/011-update-readme-and/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → Loaded successfully
2. Fill Technical Context
   → Project Type: Web application (frontend + backend)
   → Structure Decision: Option 2 (Web application)
3. Fill the Constitution Check section
   → Checked against constitution.md
4. Evaluate Constitution Check section
   → No violations found
5. Execute Phase 0 → research.md
   → Research completed (see below)
6. Execute Phase 1 → contracts, data-model.md, quickstart.md
   → Design completed (see below)
7. Re-evaluate Constitution Check section
   → Still compliant
8. Plan Phase 2 → Describe task generation approach
   → Ready for /tasks
9. STOP - Ready for /tasks command
```

## Summary
The goal is to clean up the repository root, reorganize documentation, and rewrite the README.md to be more user-friendly and "open source ready". This involves moving unconfirmed metrics (Performance, Accessibility) to dedicated files in `docs/`, organizing loose markdown files and scripts into appropriate subdirectories, and ensuring historical phase files are preserved in a structured archive.

## Technical Context
**Language/Version**: Markdown, Bash, Python (for scripts)
**Primary Dependencies**: N/A (Documentation only)
**Storage**: File system
**Testing**: Manual verification of file structure and links
**Target Platform**: Linux/Cross-platform (Documentation)
**Project Type**: Web application (frontend + backend)
**Performance Goals**: N/A
**Constraints**: Must preserve all historical context for agents.
**Scale/Scope**: Repository-wide cleanup.

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Professional & Modern User Experience
- **Check**: Does the README update improve the "user experience" for developers/users visiting the repo?
- **Result**: Yes. A cleaner README and organized docs improve the onboarding experience.

### II. Privacy & Security First
- **Check**: Does moving files expose any sensitive data?
- **Result**: No. We are only moving documentation and scripts. We must ensure no secrets are in the moved files (standard check).

### III. Spec-Driven & Clear Development
- **Check**: Is this change spec-driven?
- **Result**: Yes, based on `specs/011-update-readme-and/spec.md`.

### IV. Quality & Performance
- **Check**: Does this affect app performance?
- **Result**: No, this is a repository organization task.

### V. Foundational Islamic Guidance
- **Check**: Does this affect Islamic compliance?
- **Result**: No.

## Project Structure

### Documentation (this feature)
```
specs/011-update-readme-and/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (N/A for this task)
├── quickstart.md        # Phase 1 output (N/A for this task)
├── contracts/           # Phase 1 output (N/A for this task)
└── tasks.md             # Phase 2 output (to be created)
```

### Source Code (repository root)
```
# Root Directory Cleanup Target State
/
├── README.md                  # Rewritten user-friendly README
├── client/                    # Existing frontend
├── server/                    # Existing backend
├── docker/                    # Docker config
├── docs/                      # Documentation root
│   ├── api/                   # API specs
│   ├── reports/               # Historical reports & phase outputs
│   ├── guides/                # User & Dev guides
│   ├── archive/               # Archived/Old docs
│   ├── performance.md         # Moved performance metrics
│   └── accessibility.md       # Moved accessibility metrics
├── scripts/                   # Utility scripts
│   ├── maintenance/           # Maintenance scripts
│   └── ...
├── specs/                     # Feature specs
└── ... (config files like package.json, docker-compose.yml)
```

## Phase 0: Research & Analysis
*Output: [research.md](./research.md)*

### Goals
1. Identify all loose files in the root directory that need moving.
2. Identify the target location for each file category.
3. Determine the structure of the new README.md.

### Findings
- **Root Files to Move**:
    - , , etc. -> 
    - , , etc. -> 
    -  -> 
    - , , ,  -> 
- **README Structure**:
    - Title & Badges
    - Project Overview (High level)
    - Quick Start (Docker based)
    - Key Features (Bullet points)
    - Documentation Links (Pointing to )
    - Contributing
    - License

## Phase 1: Design & Specification
*Output: [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)*

### Data Model
N/A - No database changes.

### API Contracts
N/A - No API changes.

### Quickstart
The new Quickstart section in README.md will be:
1. Clone repo
2. Run [0;32m🚀 ZakApp Docker Bootstrap[0m
================================
[0;32m✅ Using existing .env.docker[0m
[1;33m📦 Stopping existing containers...[0m
[1;33m🔨 Building images (using cache)...[0m
#1 [internal] load local bake definitions
#1 reading from stdin 986B done
#1 DONE 0.0s

#2 [backend internal] load build definition from Dockerfile.backend
#2 transferring dockerfile: 1.21kB 0.0s done
#2 DONE 0.0s

#3 [frontend internal] load build definition from Dockerfile.frontend
#3 transferring dockerfile: 742B 0.0s done
#3 DONE 0.0s

#4 [frontend internal] load metadata for docker.io/library/node:20-alpine
#4 ...

#5 [auth] library/node:pull token for registry-1.docker.io
#5 DONE 0.0s

#4 [frontend internal] load metadata for docker.io/library/node:20-alpine
#4 DONE 1.1s

#6 [frontend internal] load .dockerignore
#6 transferring context: 2B done
#6 DONE 0.0s

#7 [frontend  1/11] FROM docker.io/library/node:20-alpine@sha256:643e7036aa985317ebfee460005e322aa550c6b6883000d01daefb58689a58e2
#7 resolve docker.io/library/node:20-alpine@sha256:643e7036aa985317ebfee460005e322aa550c6b6883000d01daefb58689a58e2 0.0s done
#7 DONE 0.0s

#8 [frontend internal] load build context
#8 transferring context: 5.80MB 0.3s done
#8 DONE 0.3s

#9 [frontend  8/11] COPY client/package*.json ./client/
#9 CACHED

#10 [frontend  5/11] RUN cd shared && npm ci
#10 CACHED

#11 [frontend  7/11] RUN cd shared && npm run build
#11 CACHED

#12 [frontend  3/11] COPY .npmrc ./
#12 CACHED

#13 [frontend  6/11] COPY shared/ ./shared/
#13 CACHED

#14 [frontend  4/11] COPY shared/package*.json ./shared/
#14 CACHED

#15 [frontend  9/11] RUN cd client && npm ci
#15 CACHED

#16 [backend internal] load build context
#16 transferring context: 5.97MB 0.4s done
#16 DONE 0.4s

#17 [backend  8/16] RUN cd shared && npm run build
#17 CACHED

#18 [backend  2/11] WORKDIR /app
#18 CACHED

#19 [backend  9/16] COPY server/package*.json ./server/
#19 CACHED

#20 [backend  6/16] RUN cd shared && npm ci
#20 CACHED

#21 [backend  7/16] COPY shared/ ./shared/
#21 CACHED

#22 [backend  3/16] RUN apk add --no-cache python3 make g++
#22 CACHED

#23 [backend  5/16] COPY shared/package*.json ./shared/
#23 CACHED

#24 [backend  4/16] COPY .npmrc ./
#24 CACHED

#25 [backend 10/16] RUN cd server && npm ci
#25 CACHED

#26 [backend 11/16] COPY server/ ./server/
#26 ...

#27 [frontend 10/11] COPY client/ ./client/
#27 DONE 0.4s

#26 [backend 11/16] COPY server/ ./server/
#26 DONE 0.4s

#28 [frontend 11/11] WORKDIR /app/client
#28 DONE 0.1s

#29 [frontend] exporting to image
#29 exporting layers
#29 exporting layers 0.4s done
#29 ...

#30 [backend 12/16] RUN mkdir -p /app/server/prisma/data && chmod 777 /app/server/prisma/data
#30 DONE 0.6s

#29 [frontend] exporting to image
#29 exporting manifest sha256:26efe6cf609b0fe8aa434555e0d888939b75c8cec82989b410f1de4f98aceb3c 0.0s done
#29 exporting config sha256:2b936ebaf32da52b17d14abd826651e65b0053ef85dd633cbf89fce923a1e850 0.0s done
#29 exporting attestation manifest sha256:50d0d53cd9536e4b634caed63d45ffbe2bbaef91e7a08d339d10db308fdd794d 0.0s done
#29 exporting manifest list sha256:3c54e5120258e12bcbc413f34b8a1119754f95521564b5fb4c5d6b95fbb0af04 0.0s done
#29 naming to docker.io/library/zakapp-frontend:latest
#29 naming to docker.io/library/zakapp-frontend:latest done
#29 unpacking to docker.io/library/zakapp-frontend:latest
#29 unpacking to docker.io/library/zakapp-frontend:latest 0.2s done
#29 DONE 0.9s

#31 [backend 13/16] RUN cd server && npx prisma generate
#31 ...

#32 [frontend] resolving provenance for metadata file
#32 DONE 0.0s

#31 [backend 13/16] RUN cd server && npx prisma generate
#31 4.109 Prisma schema loaded from prisma/schema.prisma
#31 5.748 
#31 5.748 ✔ Generated Prisma Client (v6.16.2) to ./node_modules/@prisma/client in 931ms
#31 5.748 
#31 5.748 Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)
#31 5.748 
#31 5.748 Tip: Interested in query caching in just a few lines of code? Try Accelerate today! https://pris.ly/tip-3-accelerate
#31 5.748 
#31 DONE 5.9s

#33 [backend 14/16] COPY docker/entrypoint.sh /entrypoint.sh
#33 DONE 0.1s

#34 [backend 15/16] RUN chmod +x /entrypoint.sh
#34 DONE 0.3s

#35 [backend 16/16] WORKDIR /app/server
#35 DONE 0.0s

#36 [backend] exporting to image
#36 exporting layers
#36 exporting layers 4.9s done
#36 exporting manifest sha256:f4ac22c7af7fab1cf00e01d7af2c014853b1c5b4a2176d5761144e2aa8d831cf 0.0s done
#36 exporting config sha256:c8eb3c0b411a7fc71f548b6dff8cd10fb7f37e90070c342c92520dac9da1acad 0.0s done
#36 exporting attestation manifest sha256:df1b9d45340347823616d130ddfd7dc789884fd9184c65dbee47f994493aa1a1 0.0s done
#36 exporting manifest list sha256:ee17e8d0ebe6c72d644d28ca45c5adcf33f3cd7d50a613db64c8c5977e09b056 0.0s done
#36 naming to docker.io/library/zakapp-backend:latest done
#36 unpacking to docker.io/library/zakapp-backend:latest
#36 unpacking to docker.io/library/zakapp-backend:latest 0.8s done
#36 DONE 5.8s

#37 [backend] resolving provenance for metadata file
#37 DONE 0.0s
[1;33m▶️  Starting services...[0m
[1;33m⏳ Waiting for backend to initialize...[0m
..........

================================
[0;32m✅ ZakApp Started![0m

[0;32m✅ Backend:  http://localhost:3001[0m
[0;32m✅ Frontend: http://localhost:3000[0m

Commands:
  View logs:     docker compose logs -f
  Backend logs:  docker compose logs -f backend
  Stop:          docker compose down
  Rebuild:       ./docker-start.sh --rebuild
  Reset DB:      ./docker-start.sh --reset-db

[0;32mOpen http://localhost:3000 in your browser[0m
3. Access at localhost:3000

## Phase 2: Task Planning
*Output: [tasks.md](./tasks.md)*

### Strategy
1. **Move Files**: Execute  commands to organize files into  and .
2. **Update Links**: Search and replace relative links in moved markdown files.
3. **Rewrite README**: Create the new  content.
4. **Verify**: Check that the app still starts and docs are accessible.

### Task List (Preview)
1. Create directories: , , .
2. Move documentation files to  and .
3. Move script files to  and .
4. Update  with new content.
5. Verify file links and project startup.
