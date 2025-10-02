# Captify Platform - Architecture Refactor TODO

## Context
Building new @captify-io/platform application from scratch to separate app code from library code.
Source: C:\Users\anaut\OneDrive\Documents\GitHub\captify

## Tasks

### Phase 1: Repository Setup
- [x] Create directory structure
- [x] Create package.json with @captify-io/core dependency
- [x] Create TODO.md for context management
- [ ] Copy next.config.ts from captify
- [ ] Copy tsconfig.json from captify
- [ ] Copy tailwind.config.ts from captify
- [ ] Create .gitignore
- [ ] Copy .env.example (NOT .env)

### Phase 2: Copy Application Code
- [ ] Copy src/app directory (all app routes, layouts, pages)
- [ ] Copy src/app/api/captify/route.ts (critical API proxy)
- [ ] Copy src/app/api/auth/[...nextauth]/route.ts (auth endpoint)
- [ ] Copy src/lib/auth.ts (NextAuth configuration)
- [ ] Copy public directory (if any static assets)

### Phase 3: Copy Scripts & Tools
- [ ] Copy bin/captify-deploy.js
- [ ] Copy scripts/installer.ts
- [ ] Copy scripts/deploy-eb.sh and deploy-eb.ps1
- [ ] Copy deploy.sh (if exists)

### Phase 4: Update Imports
- [ ] Update all imports from local paths to @captify-io/core
  - Change `from "../components"` to `from "@captify-io/core/components"`
  - Change `from "../lib"` to `from "@captify-io/core/lib"`
  - Change `from "../hooks"` to `from "@captify-io/core/hooks"`
  - Change `from "../types"` to `from "@captify-io/core/types"`

### Phase 5: Build & Test
- [ ] Run npm install (will fail until @captify-io/core is built)
- [ ] Link @captify-io/core locally for testing
- [ ] Run build script
- [ ] Verify API routes work
- [ ] Test authentication flow
- [ ] Verify .next output size (should be reasonable)

### Phase 6: Documentation
- [ ] Create README.md with deployment instructions
- [ ] Document environment variables
- [ ] Document API routes (/api/captify, /api/auth)
- [ ] Create migration guide for external apps

## Notes
- This is an APPLICATION - contains API routes, auth endpoints, app UI
- Depends on @captify-io/core for all library code
- Must NOT include .env file in git
- API routes are critical for external apps (pmbook, admin)
