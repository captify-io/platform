Captify Materiel Insights — Product & Data Specification (Copy/Paste Ready). BOM360 is a 150%, 360 degree view of the Bill of Material (BOM) across all technical domains who use the BOM.

Purpose
Deliver a lightweight application that:

Manages a 150% BOM as a graph (aircraft ↔ systems ↔ assemblies ↔ parts ↔ suppliers),

Connects structured enterprise data (PLM/ERP/MRO) and unstructured technical orders to that BOM,

Exposes a multi-view BOM360 (engineering, supply, manufacturing, sustainment, SPO, weapon system),

Prioritizes an Advanced Forecast page to predict and resolve issues before MICAP,

Provides a clean Workbench for collaborative problem resolution.

Out of scope: auth, users, sessions, roles, IL-levels. Those are handled by Captify.

1) Top-Level Navigation (clean, minimal)
📊 Advanced Forecast (primary landing)

🧩 BOM Explorer (Configurations & Variants)

🧰 Workbench (Problem Resolution)

📦 Supply Chain Insights

📈 Analytics & Reports

📚 Document Library (references to TOs/attachments)

⚙️ App Settings (app-local settings only; no auth/tenancy)

2) Page Specs — What each page looks like
2.1 📊 Advanced Forecast (primary)
Goal: Show the Air Force how we predict and resolve problems early (pre-MICAP).
Layout:

Header bar: System filter (e.g., B-52H), time window (30/60/90d), “as-of date”, model version.

Key KPI strip:

Predicted MICAPs (30d)

Readiness lift (projected)

High-risk suppliers

Top DMSMS threats

Forecast Panels (cards; clean, 2-column):

Top MICAP Risks (table or bar) — streamId=micap:/forecast;scope={tail|system}…

Reliability Hot Spots (MTBF trend) — streamId=rel:/trend;nodeId=…

Supplier Risk (OTD, lead, escapes) — streamId=supp:/scorecard;supplierId=…

DMSMS/Obsolescence Watch — streamId=dmsms:/watch;…

One-click actions on any row:

“Open in Workbench” → creates/opens an Issue with linked BOM nodes, tails, suppliers, and prepopulates content blocks.

“Open in BOM Explorer” → jumps to selected node/subtree with current filters.

Notes: All visuals are content blocks that carry only metadata & streamId. Heavy data is fetched by stream endpoints.

2.2 🧩 BOM Explorer (Configurations & Variants)
Goal: Manage and browse the 150% BOM with alternates, supersession, and effectivity; pivot by discipline and weapon system/tail.
Layout:

Left panel (filters):

View selector: Engineering | Manufacturing | Supply Chain | Sustainment | SPO

Context: Weapon System (e.g., B-52), System/WBS, Tail/Block, As-of date, Depth (1–5)

Center: Tree/Graph viewer of BOM360 (collapsible; crisp minimal styling).

Right panel (node details; tabs):

Overview (name, NSN/PN, WBS, qty, risk badges)

Variants (Alternate group with ranked members)

Supersession (old→new chain)

Effectivity (tail/block/date windows, TCTOs)

Suppliers (current metrics)

Docs (TO references; links only)

Actions: “Open node subtree as stream”, “Create Issue in Workbench”, “Copy streamId for chart.”

2.3 🧰 Workbench (Problem Resolution)
Goal: Triage → analyze → qualify → field fixes with policy-style gates (but keep UI simple).
Layout:

Board (kanban): Intake → Analyze → Validate Solution → Qualify → Field → Monitor

Issue drawer (when clicked):

Header: title, status, criticality, created/updated, quick buttons: “Open node” (Explorer), “Open supplier” (Insights)

Context section: linked nodes/tails/suppliers, top risk drivers (badges), streamId chips

Tabs:

Discuss (comments + AI suggestions, reference content blocks)

Tasks (assignee, due, status)

Decisions (gates with decision, basis, effective date)

Artifacts (links to TOs, drawings, test)

Create Issue form: from Advanced Forecast (auto-prepopulated) or from Explorer (manual).

2.4 📦 Supply Chain Insights
Goal: Supplier health and part availability from the BOM’s point of view.
Layout:

Top filters: supplier, system, as-of date

Supplier Scorecards (OTD%, lead time, escapes, cost trend) — table/cards via stream

Alternates Availability for high-risk parts — table via stream

“Open in Workbench” action to start mitigations.

2.5 📈 Analytics & Reports
Goal: Access reusable analyses (reliability, readiness impact, should-cost).
Layout:

Card list of analyses; each card is a content block with streamId; export CSV options.

2.6 📚 Document Library
Goal: Reference unstructured technical orders and attachments that are linked to BOM nodes.
Layout:

Search & filters (node/supplier/system)

List of documents with tags (e.g., “TO-1234, Section 5, relates to NSN…”)

Clicking a doc shows metadata + which BOM nodes it relates to; open in external viewer.

2.7 ⚙️ App Settings (local)
Goal: App-scoped configuration only (no user/role).
Layout:

Stream query templates registry, page presets, column defaults, saved views.

3) Data Product: BOM360 (connect structured & unstructured)
Source Types

Structured (enterprise): PLM/ERP/MRO tables for parts, assemblies, EBOM/MBOM edges, suppliers, inventory, pricing, TCTOs.

Unstructured: Technical Orders, drawings, PDFs; extracted references (PN/NSN, WBS, procedures, effectivity) via parsing/NLP.

Linking Model

Parse & normalize identifiers (NSN/PN formats, CAGE).

Extract WBS/system terms from TOs; map to node IDs.

Store document references as edges (doc ↔ node) with section/page anchors.

Directional Views
BOM360 must be navigable from any direction:

System → assemblies → parts (HAS_PART)

Part → parents (reverse)

Part ↔ alternates (grouped & ranked)

Supersession old→new

Part ↔ suppliers

Part ↔ tails (effectivity / installed)

Weapon system pivot: start at Aircraft/System root or Tail and traverse.

4) Graph-First Data Model in DynamoDB (single-table + GSIs)
Primary table: app_graph (graph + workflows + references)

4.1 Keys & Types
pk: partition root (e.g., NODE#nsn:…, TAIL#60-0020, SUPPLIER#cage:1AB23, ISSUE#…, CONTENT#…, DOC#…, FORECAST#…)

sk: typed row id (e.g., META, EDGE#HAS_PART#{childId}, ALTGROUP#{gid}#MEMBER#{id}, SUPERSESSION#{newId}, EFFECTIVITY#TAIL#{tail}#{from}, SUPPLY#SUPPLIER#{id}, INSTALL#{part}#{date}, DOCREF#{nodeId}, TASK#{seq}, DECISION#{gate})

type: META|EDGE|ALT|SUPERSESSION|EFFECTIVITY|SUPPLY|INSTALL|DOC|ISSUE|TASK|DECISION|FORECAST|CONTENT_REF

Versioning/effectivity on items: valid_from, valid_to, is_current.

Attributes are JSON blobs for extensibility (keep them small; large analytics stay in streams).

4.2 Node Metadata
json
Copy
Edit
{
  "pk": "NODE#nsn:2840-00-123-4567",
  "sk": "META",
  "type": "META",
  "entity": "Part|Assembly|System|Aircraft|Supplier|Tail|Document",
  "name": "Combustion Module",
  "wbs": "1.1.2.3",
  "level": 4,
  "attrs": { "nsn":"…", "mfrPno":"…", "uom":"EA" },
  "version": "bom-YYYY.MM.DD",
  "valid_from": "2025-08-01",
  "valid_to": null,
  "is_current": true,
  "hash": "sha256…"
}
4.3 Structure Edge — HAS_PART
json
Copy
Edit
{
  "pk": "NODE#part:TF33-ENGINE",
  "sk": "EDGE#HAS_PART#nsn:2840-00-123-4567",
  "type": "EDGE",
  "edge": "HAS_PART",
  "parentId": "part:TF33-ENGINE",
  "childId": "nsn:2840-00-123-4567",
  "qtyPerParent": 1,
  "valid_from": "2024-01-01",
  "is_current": true,
  "version": "bom-YYYY.MM.DD"
}
4.4 Alternates (150% variants)
json
Copy
Edit
{
  "pk": "ALTGROUP#7842",
  "sk": "MEMBER#nsn:2840-00-123-4567",
  "type": "ALT",
  "groupId": "7842",
  "memberId": "nsn:2840-00-123-4567",
  "rank": 1,
  "constraints": { "form":"=", "fit":"±", "function":"=" },
  "valid_from": "2024-01-01",
  "is_current": true
}
4.5 Supersession
json
Copy
Edit
{
  "pk": "NODE#nsn:OLD-111-2222",
  "sk": "SUPERSESSION#nsn:NEW-333-4444",
  "type": "SUPERSESSION",
  "oldId": "nsn:OLD-111-2222",
  "newId": "nsn:NEW-333-4444",
  "reason": "DMSMS",
  "valid_from": "2023-11-01",
  "is_current": true
}
4.6 Effectivity (tail/block/date)
json
Copy
Edit
{
  "pk": "NODE#nsn:2840-00-123-4567",
  "sk": "EFFECTIVITY#TAIL#60-0020#2024-01-01",
  "type": "EFFECTIVITY",
  "scope": "TAIL",
  "tail": "60-0020",
  "effectiveFrom": "2024-01-01",
  "effectiveTo": null,
  "tctoRefs": ["TCTO-1234","TCTO-5678"]
}
4.7 Installation (tail history)
json
Copy
Edit
{
  "pk": "TAIL#60-0020",
  "sk": "INSTALL#nsn:2840-00-123-4567#2025-02-11",
  "type": "INSTALL",
  "tail": "60-0020",
  "partId": "nsn:2840-00-123-4567",
  "installedOn": "2025-02-11",
  "removedOn": null,
  "source": "maintenance_record_id"
}
4.8 Supplier Link & Metrics
json
Copy
Edit
{
  "pk": "NODE#nsn:2840-00-123-4567",
  "sk": "SUPPLY#SUPPLIER#cage:1AB23",
  "type": "SUPPLY",
  "supplierId": "cage:1AB23",
  "metrics": { "leadDays": 62, "otifPct": 0.82, "escapes12m": 3, "unitCost": 18420.00 },
  "valid_from": "2025-06-01",
  "is_current": true
}
4.9 Document References (unstructured → node links)
json
Copy
Edit
{
  "pk": "DOC#TO-1234",
  "sk": "META",
  "type": "DOC",
  "title": "Technical Order 1234",
  "uri": "s3://…/TO-1234.pdf",
  "tags": ["combustion","inspection","B-52"]
}
json
Copy
Edit
{
  "pk": "DOC#TO-1234",
  "sk": "DOCREF#NODE#nsn:2840-00-123-4567",
  "type": "DOC",
  "nodeId": "nsn:2840-00-123-4567",
  "section": "Sec 5.2",
  "page": 48
}
4.10 Forecast (lightweight index)
json
Copy
Edit
{
  "pk": "FORECAST#MICAP#tail:60-0020",
  "sk": "2025-08-09#model:v1.3",
  "type": "FORECAST",
  "scope": "tail",
  "id": "60-0020",
  "windowDays": 30,
  "modelVersion": "v1.3",
  "top": [ { "entityId":"nsn:…","score":0.86 }, { "entityId":"nsn:…","score":0.79 } ]
}
4.11 Workbench (Issues/Tasks/Decisions)
json
Copy
Edit
{
  "pk": "ISSUE#iss_8r2",
  "sk": "META",
  "type": "ISSUE",
  "title": "Combustion Module MICAP risk",
  "status": "Analyze",
  "criticality": "Critical",
  "links": { "nodes": ["nsn:2840-00-123-4567"], "tails":["60-0020"], "suppliers":["cage:1AB23"] },
  "risk": { "micap30d": 0.86 },
  "streamIds": ["micap:/forecast;scope=tail;id=60-0020;window=30;model=v1.3;asof=2025-08-09"]
}
json
Copy
Edit
{
  "pk": "ISSUE#iss_8r2",
  "sk": "TASK#0001",
  "type": "TASK",
  "taskId": "0001",
  "title": "Evaluate alternates",
  "assignee": "SCM_Analyst",
  "due": "2025-08-28",
  "status": "InProgress"
}
json
Copy
Edit
{
  "pk": "ISSUE#iss_8r2",
  "sk": "DECISION#G1_SELECT_PATH",
  "type": "DECISION",
  "gate": "G1_SELECT_PATH",
  "decision": "AM_MAKE",
  "basis": ["Lead>60d","No approved alternates","High readiness impact"],
  "effectiveFrom": "2025-08-12"
}
4.12 Content Reference (for cards/charts)
json
Copy
Edit
{
  "pk": "CONTENT#c_91f",
  "sk": "META",
  "type": "CONTENT_REF",
  "content": {
    "type": "chart",
    "title": "Top MICAP Risks – Next 30d",
    "visual": "bar",
    "streamId": "micap:/forecast;scope=tail;id=60-0020;window=30;model=v1.3;asof=2025-08-09"
  }
}
4.13 Global Secondary Indexes (GSIs)
GSI1 (reverse & groups): gsi1pk, gsi1sk

child→parents: gsi1pk="NODE#nsn:child", gsi1sk="PARENT#part:parent"

node→alt group: gsi1pk="NODE#nsn:child", gsi1sk="ALTGROUP#gid#RANK#n"

supersession forward/back: gsi1pk="NODE#old", gsi1sk="SUPER#FOR#new" / gsi1pk="NODE#new", gsi1sk="SUPER#BACK#old"

GSI2 (tail & effectivity):

tail→installs: gsi2pk="TAIL#60-0020", gsi2sk="INSTALL#nsn:…#date"

tail→applicability: gsi2pk="TAIL#60-0020", gsi2sk="APPLIES#nsn:…#from"

GSI3 (supplier centric):

supplier→parts: gsi3pk="SUPPLIER#cage:1AB23", gsi3sk="PART#nsn:…#curr"

GSI4 (workbench ops):

issues by status: gsi4pk="ISSUE#status:Analyze", gsi4sk="2025-08-09T15:42:11Z#iss_8r2"

tasks by assignee/due: gsi4pk="TASK#assignee:SCM_Analyst", gsi4sk="due#2025-08-28#0001"

5) Streams API (read-heavy via streamId)
Routes (HTTP GET; app-local):

/stream/bom.children?nodeId={id}&depth={n}&asOf={date}

/stream/bom.parents?nodeId={id}&asOf={date}

/stream/bom.alternates?nodeId={id}&asOf={date}

/stream/bom.supersession?nodeId={id}&asOf={date}

/stream/config.installations?tail={tail}&asOf={date}

/stream/forecast.micap?scope={system|tail}&id={val}&window={30|60|90}&model={v}

/stream/analytics.reliability?nodeId={id}&window={days}

/stream/supplier.scorecard?supplierId={id}&asOf={date}

/stream/docs.forNode?nodeId={id}

streamId convention:
{domain}:{route};k1=v1;k2=v2;asof=YYYY-MM-DD;model=vX.Y
Example: micap:/forecast;scope=tail;id=60-0020;window=30;model=v1.3;asof=2025-08-09

Content Block JSON (stored in CONTENT#…)

json
Copy
Edit
{ "type":"chart|table|text|panel", "title":"…", "visual":"bar|line|donut|table|md", "streamId":"…", "filters":{}, "insight":"…" }
6) Core App Behaviors
Advanced Forecast loads a default set of content blocks (cards) scoped by filters; rows offer Open in Workbench and Open in Explorer.

BOM Explorer drives tree/graph reads only (no heavy write UI in MVP); Variants tab edits alternate ranking (optional MVP+1).

Workbench creates/updates Issues; Issues link to nodes/tails/suppliers and carry content blocks; transitions add Decision records.

Supply Chain Insights reads supplier-linked items and metrics; offers “Create Issue” from any high-risk finding.

Document Library references TOs (docs) and their node links; no inline editing; open externally.

7) Data Validations (app-side guards)
No cycles in EDGE#HAS_PART.

qtyPerParent > 0.

Supersession edges form a DAG (no loops).

Effectivity windows for the same node/tail do not overlap.

Alternate group members are unique; rank is positive integer.

Document refs must point to existing DOC#… and NODE#… items.

8) Seed Data (generator hint)
Create:

NODE#AIRCRAFT#B-52H (META) + 3 system children

2 assemblies per system; 3 parts per assembly

1 alt group with 2 ranked members

1 supersession pair (old→new)

1 tail with 3 install entries

2 suppliers + SUPPLY#SUPPLIER#… links

2 TO docs + 3 DOCREF#NODE#… links

1 FORECAST record for a tail (top 5 parts)

1 ISSUE with 1 TASK and 1 DECISION

9) Acceptance Criteria (MVP)
Advanced Forecast page renders forecast, reliability, supplier, DMSMS cards; Open in Workbench/Explorer actions work.

BOM Explorer shows subtree, alternates, supersession, effectivity, suppliers, docs; filters (view, system, tail, as-of, depth) work.

Workbench supports issue CRUD, tasking, decisions, and displays content blocks.

Supply Chain Insights renders supplier scorecards and alternates availability; can create issues.

Document Library shows TOs and node links.

All heavy data comes through Streams API; content blocks store only streamId + metadata.

DynamoDB schema supports all query patterns above.