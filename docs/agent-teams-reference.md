# Agent Teams — Master Reference Guide

> **Source:** https://code.claude.com/docs/en/agent-teams  
> **Requires:** Claude Code v2.1.32+  
> **Status:** Experimental — disabled by default  
> **Last reviewed:** May 2026

---

## Table of Contents

1. [What Are Agent Teams?](#1-what-are-agent-teams)
2. [Agent Teams vs. Subagents](#2-agent-teams-vs-subagents)
3. [Enabling Agent Teams](#3-enabling-agent-teams)
4. [Architecture](#4-architecture)
5. [Starting a Team](#5-starting-a-team)
6. [Controlling Your Team](#6-controlling-your-team)
7. [Best Practices](#7-best-practices)
8. [Use Case Playbook](#8-use-case-playbook)
9. [Hooks & Quality Gates](#9-hooks--quality-gates)
10. [Permissions](#10-permissions)
11. [Token Costs](#11-token-costs)
12. [Troubleshooting](#12-troubleshooting)
13. [Known Limitations](#13-known-limitations)
14. [Quick-Reference Cheat Sheet](#14-quick-reference-cheat-sheet)

---

## 1. What Are Agent Teams?

Agent teams let you coordinate **multiple independent Claude Code sessions** on a single task. One session acts as the **team lead**; the rest are **teammates**. Each teammate has its own full context window, can message peers directly, and claims work from a shared task list.

### When to use them

Agent teams shine when **parallel exploration adds real value**:

| Scenario | Why teams help |
|---|---|
| Research & review | Multiple teammates investigate different aspects simultaneously |
| New modules / features | Each teammate owns a separate piece without file conflicts |
| Debugging with competing hypotheses | Teammates test different theories in parallel |
| Cross-layer changes (frontend + backend + tests) | Each layer is owned by a dedicated teammate |

**Avoid agent teams for:** sequential tasks, same-file edits, simple single-concern tasks, or work with many tight dependencies. In those cases a single session or subagents are more cost-effective.

---

## 2. Agent Teams vs. Subagents

| | Subagents | Agent Teams |
|---|---|---|
| **Context** | Own window; results return to caller | Own window; fully independent |
| **Communication** | Report to main agent only | Teammates message each other directly |
| **Coordination** | Main agent manages all work | Shared task list + self-coordination |
| **Best for** | Focused tasks where only the result matters | Complex work requiring discussion & collaboration |
| **Token cost** | Lower — results summarized back | Higher — each teammate is a full Claude instance |

**Decision rule:** use subagents when you only need the result. Use agent teams when teammates need to share findings, challenge each other, and coordinate independently.

---

## 3. Enabling Agent Teams

### Project-level (recommended for this repo)

`.vscode/settings.json` (already configured):

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

### User-level (`~/.claude/settings.json`)

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

### Shell environment

```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

---

## 4. Architecture

```
┌─────────────────────────────────────────────────────┐
│                     TEAM LEAD                        │
│  (main Claude Code session — creates & coordinates)  │
│                                                      │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐    │
│   │ Teammate A │  │ Teammate B │  │ Teammate C │    │
│   │            │◄─┤  Mailbox   ├─►│            │    │
│   └────────────┘  └────────────┘  └────────────┘    │
│              ▲          │              ▲             │
│              └──────────▼──────────────┘             │
│                   Shared Task List                   │
└─────────────────────────────────────────────────────┘
```

| Component | Role |
|---|---|
| **Team lead** | Creates the team, spawns teammates, synthesizes results |
| **Teammates** | Independent Claude Code instances; each claims and completes tasks |
| **Task list** | Shared work items with `pending → in-progress → completed` states; supports dependencies |
| **Mailbox** | Direct messaging between any two agents by name |

### Storage locations

| Resource | Path |
|---|---|
| Team config | `~/.claude/teams/{team-name}/config.json` |
| Task list | `~/.claude/tasks/{team-name}/` |

> **Do not hand-edit these files.** They are overwritten on every state update. Define reusable roles using subagent definitions instead.

### How teams start

- **You request a team** — describe the task and structure in natural language.
- **Claude proposes a team** — Claude suggests one if the task warrants it; you confirm before it proceeds.

---

## 5. Starting a Team

### Minimal prompt

```
Create an agent team to [describe task]. Spawn [N] teammates:
- One for [role/area A]
- One for [role/area B]
- One for [role/area C]
```

### Example — exploration / research

```
I'm designing a CLI tool that helps developers track TODO comments across
their codebase. Create an agent team to explore this from different angles:
one teammate on UX, one on technical architecture, one playing devil's advocate.
```

### Specifying teammates and models

```
Create a team with 4 teammates to refactor these modules in parallel.
Use Sonnet for each teammate.
```

### Using reusable subagent definitions

```
Spawn a teammate using the security-reviewer agent type to audit the auth module.
```

The teammate inherits that definition's `tools` allowlist and `model`. Team coordination tools (`SendMessage`, task management) are always available even when `tools` restricts others.

> **Note:** `skills` and `mcpServers` frontmatter from a subagent definition are **not** applied when running as a teammate. Teammates load skills and MCP servers from project/user settings.

---

## 6. Controlling Your Team

### Display modes

| Mode | Description | Requirements |
|---|---|---|
| `auto` (default) | Split panes if inside tmux, otherwise in-process | — |
| `in-process` | All teammates run inside your main terminal | Any terminal |
| `tmux` | Each teammate gets its own pane | tmux or iTerm2 |

Set in `~/.claude/settings.json`:

```json
{
  "teammateMode": "in-process"
}
```

Override per session:

```bash
claude --teammate-mode in-process
```

### Keyboard shortcuts (in-process mode)

| Action | Shortcut |
|---|---|
| Cycle through teammates | `Shift+Down` |
| View a teammate's session | `Enter` |
| Interrupt a teammate's turn | `Escape` |
| Toggle task list | `Ctrl+T` |

### Require plan approval before implementation

```
Spawn an architect teammate to refactor the authentication module.
Require plan approval before they make any changes.
```

- Teammate works in **read-only plan mode** until the lead approves.
- Lead can approve or reject with feedback.
- Influence the lead's criteria: *"only approve plans that include test coverage"* or *"reject plans that modify the database schema."*

### Talking to teammates directly

- **In-process:** `Shift+Down` to cycle → type your message.
- **Split-pane:** click into the teammate's pane.

Give teammates predictable names by specifying them in your spawn instruction so you can reference them in later prompts.

### Task management

```
# Lead assigns a task to a specific teammate
Tell the security-reviewer teammate to also check the payment module.

# Force the lead to wait for teammates
Wait for your teammates to complete their tasks before proceeding.

# Nudge a stuck task
The auth-refactor task appears stuck — check if the work is done and mark it complete.
```

Tasks support dependencies. A pending task with unresolved dependencies cannot be claimed until those dependencies are completed. Task claiming uses file locking to prevent race conditions.

### Shutting down teammates

```
Ask the researcher teammate to shut down.
```

The lead sends a shutdown request. The teammate can approve (graceful exit) or reject with an explanation.

### Cleaning up the team

```
Clean up the team.
```

Always use the **lead** to clean up. Teammates should not run cleanup — their team context may not resolve correctly, leaving resources in an inconsistent state. The lead checks for active teammates and fails if any are still running, so shut them down first.

---

## 7. Best Practices

### Give teammates enough context

Teammates load `CLAUDE.md`, MCP servers, and skills automatically but **do not inherit the lead's conversation history**. Put all task-specific details in the spawn prompt:

```
Spawn a security reviewer teammate with the prompt: "Review the authentication
module at src/auth/ for security vulnerabilities. Focus on token handling,
session management, and input validation. The app uses JWT tokens stored in
httpOnly cookies. Report any issues with severity ratings."
```

### Team size guidelines

| Team size | Use when |
|---|---|
| 2–3 teammates | Well-defined, low-coordination work |
| 3–5 teammates | Most workflows; best balance of parallelism and coordination |
| 5+ teammates | Only when work genuinely scales with more simultaneous workers |

- **Token costs scale linearly** with teammate count.
- **5–6 tasks per teammate** is the sweet spot — keeps everyone productive without excessive context switching.
- Three focused teammates often outperform five scattered ones.

### Size tasks appropriately

| Task size | Problem |
|---|---|
| Too small | Coordination overhead exceeds benefit |
| Too large | Teammates work too long without check-ins; risk of wasted effort |
| Just right | Self-contained unit with a clear deliverable (function, test file, review) |

If the lead isn't creating enough tasks, tell it: *"Split the work into smaller pieces."*

### Avoid file conflicts

Two teammates editing the same file leads to overwrites. **Break work so each teammate owns a distinct set of files.**

### Monitor and steer

Check in on progress, redirect approaches that aren't working, and synthesize findings as they come in. Don't let a team run unattended for too long.

### Start with research, not implementation

If new to agent teams, start with tasks that have clear boundaries and don't require writing code: reviewing a PR, researching a library, investigating a bug. These show the value of parallel exploration without the coordination challenges of parallel implementation.

### Use `CLAUDE.md` for shared guidance

`CLAUDE.md` is read by every teammate from their working directory. Use it to provide project-specific instructions that apply to all agents.

---

## 8. Use Case Playbook

### Parallel code review

```
Create an agent team to review PR #142. Spawn three reviewers:
- One focused on security implications
- One checking performance impact
- One validating test coverage
Have them each review and report findings.
```

Each reviewer works from the same PR but applies a different filter. The lead synthesizes findings after all three finish.

### Competing-hypotheses debugging

```
Users report the app exits after one message instead of staying connected.
Spawn 5 agent teammates to investigate different hypotheses. Have them talk to
each other to try to disprove each other's theories, like a scientific
debate. Update the findings doc with whatever consensus emerges.
```

The adversarial debate structure prevents anchoring on the first plausible theory. The theory that survives cross-examination is far more likely to be the actual root cause.

### Cross-layer feature implementation

```
Implement the new notifications feature. Spawn three teammates:
- One to build the backend API endpoints (src/api/)
- One to build the frontend components (src/components/notifications/)
- One to write integration tests (tests/notifications/)
Each teammate owns their layer entirely. Do not modify files outside your layer.
```

### Security audit with subagent definition

```
Spawn a teammate using the security-reviewer agent type to audit the auth module.
Require plan approval before they make any changes.
```

---

## 9. Hooks & Quality Gates

Use hooks to enforce rules at key lifecycle events:

| Hook | Trigger | Use case |
|---|---|---|
| `TeammateIdle` | Teammate is about to go idle | Exit code 2 → send feedback, keep teammate working |
| `TaskCreated` | A task is being created | Exit code 2 → prevent creation, send feedback |
| `TaskCompleted` | A task is being marked complete | Exit code 2 → prevent completion, send feedback |

Example: enforce test coverage before any task is marked complete by adding a `TaskCompleted` hook that runs your test suite and exits with code 2 if coverage drops.

---

## 10. Permissions

- Teammates **start with the lead's permission settings**.
- If the lead runs with `--dangerously-skip-permissions`, all teammates do too.
- You can change individual teammate modes after spawning, but **cannot set per-teammate modes at spawn time**.
- Pre-approve common operations in your permission settings **before** spawning teammates to reduce permission-prompt interruptions.

---

## 11. Token Costs

- Each teammate is a **full, independent Claude instance** with its own context window.
- **Token usage scales linearly** with the number of active teammates.
- The extra cost is usually worthwhile for research, review, and new feature work.
- For routine or sequential tasks, a single session is more cost-effective.

---

## 12. Troubleshooting

| Problem | Fix |
|---|---|
| Teammates not appearing | Press `Shift+Down` to cycle; confirm task was complex enough; verify tmux is in `PATH` |
| Too many permission prompts | Pre-approve common operations in permission settings before spawning |
| Teammate stopped on an error | Use `Shift+Down` to check output; give direct instructions or spawn a replacement |
| Lead shuts down before work is done | Tell it: *"Keep going — not all tasks are complete"* |
| Lead doing work instead of delegating | Tell it: *"Wait for your teammates to complete their tasks before proceeding"* |
| Orphaned tmux session | `tmux ls` then `tmux kill-session -t <session-name>` |
| Task status stuck / not updating | Tell the lead to nudge the teammate or update the task status manually |
| `/resume` doesn't restore teammates | Tell the lead to spawn new teammates after resuming |

---

## 13. Known Limitations

| Limitation | Detail |
|---|---|
| No session resumption with in-process teammates | `/resume` and `/rewind` don't restore in-process teammates |
| Task status can lag | Teammates sometimes fail to mark tasks complete, blocking dependents |
| Slow shutdown | Teammates finish their current request/tool call before stopping |
| One team per session | Lead can only manage one team at a time; clean up before starting another |
| No nested teams | Teammates cannot spawn their own teams; only the lead can |
| Lead is fixed | Cannot promote a teammate to lead or transfer leadership |
| Permissions fixed at spawn | Cannot set per-teammate permission modes at spawn time |
| Split panes: limited terminal support | Works with tmux or iTerm2 only; not in VS Code integrated terminal, Windows Terminal, or Ghostty |

---

## 14. Quick-Reference Cheat Sheet

```
# Enable (project settings.json)
{ "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" } }

# Start a team
"Create an agent team with 3 teammates: [A], [B], [C]."

# Cycle teammates (in-process)
Shift+Down

# Require plan approval
"Require plan approval before [teammate] makes any changes."

# Wait for teammates
"Wait for your teammates to complete their tasks before proceeding."

# Shut down a teammate
"Ask the [name] teammate to shut down."

# Clean up
"Clean up the team."

# Optimal team size:    3–5 teammates
# Optimal tasks/mate:   5–6 tasks
# Token cost:           scales linearly — use only when parallelism adds value
# File conflicts:       each teammate must own distinct files
# Context:              teammates do NOT inherit lead's conversation history
# CLAUDE.md:            read by all teammates — use for shared project guidance
```

---

*This guide is derived from the official Claude Code documentation. Re-fetch and update whenever the agent teams feature exits experimental status or the API changes.*
