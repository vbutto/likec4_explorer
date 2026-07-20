# Sandbox Proposals — Design

Status: **Draft / for discussion**
Scope: `likec4_explorer` fork (tool layer)

## 1. Problem

Architecture discussions need a place to put a *proposed* solution for a specific
point of the architecture — at any level (context, container, component) — where:

- the proposal can freely change elements **without affecting the main model**;
- there may be **several competing variants** of the same proposal, i.e. several
  copies of the same elements;
- there is still **traceability** back to the main model ("this proposed service
  replaces that existing one");
- proposals are **clearly separated** from the main view hierarchy in the UI;
- there is basic support for **discussion**.

## 2. Two layers (important)

This feature spans two different repositories, and the split must stay explicit:

| Layer | Where it lives | What it is |
| --- | --- | --- |
| **Tool** | this repo (`likec4_explorer`) | Code: a separate "Proposals" navigation section, diff rendering, the trace layer. The tool learns to *recognise and display* sandboxes. |
| **Model** | a user's own architecture repo | Data: the proposals themselves — sandbox projects written in `.c4` that import the baseline. Authored by an architect/engineer. |

The two layers are connected by a **convention** (§6): a sandbox project marks
itself in a known way, and the tool renders it accordingly. This document
describes the **tool** layer and fixes the convention the tool relies on.

## 3. Domain model

```
Proposal            the question being discussed; has status, no elements of its own
 ├── Variant[]      a candidate answer; each owns exactly one Sandbox
 │    └── Sandbox   an isolated model: imported baseline + local elements + views
 ├── Discussion     threads (deferred, see §9)
 └── Decision       chosen variant + rationale
```

Lifecycle of a Proposal: `Draft → In Review → Accepted | Rejected | Superseded`.

Multiple variants are why copies exist: copies belong to a **Variant**, not to a
Proposal, so there are exactly as many copies as there are variants.

## 4. Sandbox mechanism

A **Variant is a LikeC4 project of its own** that `import`s the baseline project.
Isolation comes for free from the project boundary — nothing a sandbox does can
affect the baseline.

The naive form of this ("import the baseline and `extend` what changes") **does not
work**. A probe against `examples/multi-project` established the real constraints:

| Capability | Result |
| --- | --- |
| Import baseline, reference it in relations | ✅ works |
| **Element view** mixing imported baseline + sandbox-local elements | ✅ works; imported nodes carry a `GlobalFqn` |
| Sandbox-local element with `metadata { … }` | ✅ metadata survives into the computed model |
| Cross-project `extend` on an imported element | ❌ does not resolve (parse error) |
| **Dynamic view** referencing imported elements | ❌ fails at compute, view is silently dropped |
| Dynamic view using only sandbox-local elements | ✅ works |
| **Deployment view** referencing imported elements | ❓ **untested** (see §11) |

Two consequences drive the design:

1. Because cross-project `extend` does not resolve, "this element is *changed*"
   cannot be expressed in the DSL. **Trace and diff are our own layer**, keyed on
   element metadata rather than on a DSL mechanism.
2. Because dynamic views cannot reference imported elements, any element that
   participates in a dynamic view must be **sandbox-local**.

### Hybrid sandbox (the resulting rule)

- **Import the baseline** for context and for static (element/container) views —
  anything the proposal does *not* change stays a cheap reference to the original.
- **Make a sandbox-local copy** for anything the proposal *changes*, and for
  anything that must appear in a dynamic view. Each copy carries a trace pointer.

The failure point for dynamic views is `elementsFromSteps` in
`packages/core/src/compute-view/dynamic-view/utils.ts`, which resolves step
participants through `LikeC4Model.element()` and does not consider imported
elements. Fixing that upstream would remove constraint (2) — see §11.

## 5. Trace and diff semantics

The trace key is the baseline element's **`GlobalFqn`**, whose format is
`@<projectId>.<elementFqn>` (e.g. `@boutique.boutique.frontend`). See
`GlobalFqn` / `splitGlobalFqn` in `packages/core/src/types/scalar.ts`.

Classification of every element in a variant, used to colour the diff:

| Class | How it is recognised |
| --- | --- |
| `unchanged` | an imported baseline element with no local counterpart |
| `changed` | a sandbox-local element carrying `tracesTo` pointing at a baseline `GlobalFqn` |
| `added` | a sandbox-local element with no `tracesTo` |
| `removed` | a baseline element explicitly marked as dropped by the proposal |

This classification is computed by the tool and is the basis for the
"as-is → to-be" diff view, which is the single most valuable artefact for a
discussion.

## 6. Convention (the tool ⇄ model contract)

A sandbox project declares itself through project config and element metadata:

```c4
import { boutique } from 'boutique'

model {
  // proposed addition — no baseline counterpart
  recommender = service 'Recommender Service' {
    metadata {
      proposal 'added'
    }
  }

  // proposed change — local copy tracing to the baseline element
  frontendV2 = service 'Frontend (proposed)' {
    metadata {
      proposal 'changed'
      tracesTo '@boutique.boutique.frontend'
    }
  }
}
```

Open point: whether the Proposal/Variant identity and status live in the project
config (`likec4.config.json`) or in a sidecar file. Both are git-native; the
config is tidier, a sidecar is easier to extend with discussion data later.

## 7. UI design

Proposals must **not** be another folder in the existing view tree.

- **Separate navigation section** — "Proposals", parallel to the views tree, with
  its own list of cards: title, status badge, variant count, author, date.
- **Distinct visual language** for sandbox elements (dashed borders, muted
  baseline, a "draft" affordance) so a proposal can never be mistaken for reality.
- **Diff colouring** on the canvas, per the classification in §5.
- **Variant comparison** — tabs or side-by-side canvases within one Proposal.
- **Cross-links** — from a baseline element, "referenced in N proposals"; from a
  sandbox element, "traces to `@…`".

## 8. Integration points

| Concern | File |
| --- | --- |
| View tree construction | `packages/likec4-spa/src/components/sidebar/data.ts` (`buildDiagramTreeData`, `useDiagramsTreeData`) |
| Tree rendering / per-kind icons | `packages/likec4-spa/src/components/sidebar/DiagramsTree.tsx` |
| Overview grid | `packages/likec4-spa/src/routes/_single/single-index.tsx` |
| Model access (read-only) | `packages/likec4-spa/src/context/LikeC4ModelContext.tsx` |
| Cross-process data | a new `likec4:*` virtual module in `packages/vite-plugin` |
| Element metadata / tags | `packages/core/src/model/ElementModel.ts` |
| Imported elements, `GlobalFqn` | `packages/core/src/model/LikeC4Model.ts`, `packages/core/src/types/scalar.ts` |
| View kinds (`element` / `dynamic` / `deployment`) | `packages/core/src/types/view-common.ts` |

Note the SPA is currently **read-only** over a statically generated model; the only
persisted client state is UI preference. Nothing here changes that contract.

## 9. Persistence and discussion

Decided: **as-code, git-native, no backend.**

- Variant structure lives in git as LikeC4 sources and is reviewed via PR — a
  "proposal for discussion" maps naturally onto a pull request.
- Discussion happens **on the PR** for now. In-app comments are deferred.
- Later, element-anchored threads can be added as git-stored artefacts
  (a `discussion.json` keyed by `GlobalFqn` / view id) rendered on the canvas —
  still no backend, still flowing through the same PR.
- Live multi-user collaboration would require a backend and a shared deployment;
  it is an optional upgrade, not part of this foundation.

Because all state lives in git, the design is **deployment-agnostic**: it works
identically for a locally run explorer and a shared hosted instance.

## 10. Phasing

- **Phase 0 (MVP)** — Proposals as a separate navigation section; variants authored
  as-code; read-only; status; discussion on the PR.
- **Phase 1** — trace links + diff colouring against the baseline.
- **Phase 2** — multiple variants + side-by-side comparison.
- **Phase 3** — element-anchored git-stored threads; decision lifecycle;
  (optional) sandbox editing in the UI.

## 11. Open questions and risks

1. **Deployment views + imported elements are untested.** By analogy with dynamic
   views they may also require sandbox-local copies. Needs a probe before any
   deployment-oriented proposal scenario.
2. **Upstream fix for dynamic views.** Teaching `elementsFromSteps` to resolve
   imported elements would remove the "local copies for dynamic views" constraint
   and simplify the sandbox rule. Worth raising upstream.
3. **Proposal identity location** — project config vs sidecar file (§6).
4. **Copy drift.** A sandbox-local copy does not track later baseline changes; the
   diff will show drift as if proposed. May need a "rebase against baseline" hint.

## Appendix — reproducing the probe

Create a project under `examples/multi-project/` that imports `boutique`, then:

```
pnpm --filter likec4 cli validate <ABSOLUTE path to examples/multi-project> --project <name>
pnpm --filter likec4 cli export json <ABSOLUTE path to examples/multi-project> --project <name> -o <out.json>
```

The path must be absolute (it is resolved relative to `packages/likec4`), and
`--project` is required in a multi-project workspace.
