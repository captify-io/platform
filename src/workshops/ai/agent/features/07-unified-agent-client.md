# Feature: Unified AgentClient Class

## Overview
Create a single `AgentClient` class that provides the same API for all 3 agent types (assistant, captify-agent, aws-agent).

## Key Requirements
- Same interface: `sendMessage()`, `streamMessage()`, `loadTools()`
- Mode adapters for each agent type
- Settings manager with type-safe validation
- Unified streaming and error handling

## User Story
**As a** developer **I want** one API for all agent types **So that** I can switch modes without code changes
