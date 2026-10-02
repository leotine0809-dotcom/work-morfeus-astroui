# Graphiti — temporal memory for the astrobot fleet

**Status:** spec / not built · **Owner:** Alex · **Date:** 2026-09-03
**Layer:** daemon memory (NOT astro-ui). This does not ship inside `@shercode/ui`.

---

## 1. The problem, in one line

The fleet hand-merges its own memory. Every run an agent re-reads
"Referto consolidato #1 … #2 … #4," decides by eye which defects are now
closed, and rewrites the pile. Graphiti is the machine that does that merge.

**Evidence it's real (from your own memory today):**
- Referto #4 literally says *"il codice E' STATO CORRETTO … NON relayare piu' i vecchi aperti"* — a human instruction to dedup by hand.
- D5 was "open" in #2, "CHIUSO" in #4. Nothing in the store knows that; a reader has to diff four documents.
- One defect (D10 resume route) stays open across #2→#3→#4 and gets re-typed every time.

That re-typing and re-diffing is the cost. It grows with every run.

---

## 2. What graphiti changes (3 things)

1. **A fact is a node with a time, not a line in a file.**
   "Routine ON-switch is broken" becomes an entity with `valid_from`, not text appended to a Referto.

2. **It supersedes instead of appending.**
   When a new run says "D5 is fixed," graphiti marks the old fact
   `invalid_at = <that date>` and links the replacement. History is kept; "what's true now" is a clean query.

3. **You query it, you don't re-read it.**
   "Which defects are still open?" returns nodes — instead of a human diffing four Referti.

---

## 3. The catch (decide with open eyes)

- Graphiti is a **Python** library/service backed by **Neo4j** (a graph DB).
- Your daemon is **Go**. This is **not a drop-in** — it's a sidecar service the daemon talks to over HTTP.
- It uses an LLM to extract entities on write. That means: an API cost per memory write, and write latency (seconds, not milliseconds).

**So the honest framing:** graphiti is the right *idea* for your dedup pain, but it's
a **new small service to run**, not a library you import into `engine.go`.

---

## 4. Scope — what's in, what's out

**In scope (v1):**
- One sidecar service (`memory-svc`) wrapping graphiti.
- Ingest fleet facts (the `memory.write` path) as temporal nodes.
- One query the daemon can call: "open defects" / "current facts for topic X."

**Out of scope (v1) — say no on purpose:**
- Replacing the existing `memory.write` three-scope model. Graphiti runs *alongside* it first, mirrored, read-only for consumers. Cut over only after it proves out.
- Any astro-ui / React work. This never touches the UI repo.
- Agent-to-agent memory sharing beyond what the fleet already does.

---

## 5. Architecture (the whole picture)

```
  Go daemon (engine.go, agents/store.go)
        │
        │  HTTP (localhost)
        ▼
  memory-svc  ── Python, FastAPI ──►  graphiti (lib)
        │                                  │
        │                                  ▼
        └──────────────────────────►   Neo4j (graph DB)
```

- **memory-svc**: thin FastAPI app. 3 endpoints (below). Runs as a local container.
- **graphiti**: does entity extraction + temporal bi-linking on write.
- **Neo4j**: stores the graph. One local container.

---

## 6. The contract (3 endpoints)

| Method | Path | Does |
|---|---|---|
| `POST` | `/facts` | Ingest one fact. Body: `{text, agent, scope, source_run, observed_at}`. Graphiti extracts entities + supersedes conflicting older facts. |
| `GET` | `/facts?topic=<x>&status=open` | Return **currently-valid** nodes for a topic. This is the "which defects are still open" query. |
| `GET` | `/timeline?entity=<id>` | Full history of one fact: every version, valid_from → invalid_at. For audit ("when did D5 flip to fixed?"). |

That's the entire surface. If v1 needs a 4th endpoint, v1 is too big.

---

## 7. Build path (5 steps, ~1 day of work)

1. **Stand up Neo4j + graphiti locally** (docker compose, 2 containers). ~1 hr.
2. **Write `memory-svc`** — FastAPI, the 3 endpoints above, graphiti wired to Neo4j. ~3 hrs.
3. **Backfill** — feed the existing Referti (#1, #2, #4) + the Collaudatore report through `POST /facts`. This is the proof: does it correctly mark D5 closed and D10 still open? ~1 hr.
4. **Verify the query** — `GET /facts?topic=routines&status=open` must return D10 (resume route) and NOT return D5. If it doesn't, graphiti isn't earning its keep — stop here. ~1 hr.
5. **Wire one daemon read** — have the daemon call `GET /facts` when an agent asks "what's open," instead of dumping raw memory. Keep the old path as fallback. ~2 hrs.

**Gate between step 4 and 5:** if the backfill query is wrong, do not integrate. The whole bet is that the temporal merge is *correct*. Prove it on real data before spending daemon changes.

---

## 8. Decision triggers (when to kill it)

- **Kill if:** step 4 query is wrong on the backfilled Referti → the merge isn't trustworthy, and untrustworthy memory is worse than an honest pile.
- **Kill if:** write latency or LLM cost per fact makes `memory.write` feel slow to agents.
- **Keep if:** step 4 returns the right open/closed set with zero hand-editing. That's the win, measured.

---

## 9. Open questions for you (Alex)

1. **Where does memory-svc run?** Same box as the daemon (local docker), or a separate host?
2. **LLM for extraction** — graphiti defaults to OpenAI. Point it at Claude instead, or accept OpenAI for the extraction step only?
3. **Backfill scope** — just the Referti, or the whole current memory store?

---

## 10. Sources

- Graphiti (Zep): https://github.com/getzep/graphiti
- Long-memory eval (Graphiti ~64% vs Mem0 ~49%): https://vectorize.io/articles/best-ai-agent-memory-systems
