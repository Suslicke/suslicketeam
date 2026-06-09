# Twenty — "Leads" object + Kanban pipeline (setup guide)

Set up a custom **Leads** object in Twenty (https://crm.suslicketeam.com), import the
seed CSV, and run your outreach as a drag-and-drop **Kanban pipeline**. Everything in
English on purpose — so you learn the CRM terminology.

Import file: `leads-twenty-import.csv` (in this `docs/` folder — upload it from your Mac).

---

## CRM glossary (learn these terms)

| Term | Meaning |
|---|---|
| **Object** | A type of thing you track (People, Companies, **Leads**). Like a table. |
| **Record** | One row / one card — a single lead. |
| **Field** | A column on the object (Stage, City, Source…). |
| **Pipeline** | The sequence of **Stages** a lead moves through to a sale. |
| **Stage** | One step in the pipeline (To contact → … → Won). A **Select** field. |
| **Kanban / Board view** | Visual columns = stages, cards = records; drag to change stage. |
| **Lead** | A prospect you're working. (**Opportunity / Deal** = a qualified lead with money attached — Twenty's built-in pipeline object.) |
| **Source** | Where the lead came from (attribution): 2GIS, Instagram… |
| **Won / Lost** | Closed outcomes — deal made / didn't. |

---

## Step 1 — Create the object

**Settings → Data Model → Objects → + New object**
- Singular name: `Lead`
- Plural name: `Leads`
- Pick an icon. Save.

Twenty creates the object with a default **Name** text field (we'll use it for the
business name).

## Step 2 — Add the fields

**Settings → Data Model → Leads → Fields → + New Field** for each row below.
The field **labels must match the CSV headers** so import auto-maps them.

| Field label | Type | Options (for Select) |
|---|---|---|
| `Stage` | **Select** | `To contact`, `Contacted`, `Replied`, `Qualified`, `Proposal`, `Won`, `Lost` |
| `Niche` | Select | `Cafe`, `Beauty`, `Gaming club`, `Dental`, `Detailing`, `Other` |
| `City` | Text | — |
| `Contact` | Text | — |
| `Link` | **Links** | — (if import balks, make it Text) |
| `Has website` | Select | `No`, `Weak`, `Yes` |
| `Source` | Select | `2GIS`, `Site`, `Instagram`, `Referral`, `Event`, `Shirt` |
| `Deal value` | Number | — (amount when Won) |
| `Lost reason` | Select | `No reply`, `Too expensive`, `Has site`, `Not now`, `Other` |
| `Next step` | Text | — |
| `Next step date` | Date | — |
| `Notes` | Text | — |

> The exact **Stage** option labels matter most — Kanban columns and the CSV both
> rely on them. Keep them identical.

## Step 3 — Import the CSV

1. `Cmd/Ctrl + K` → type **Import** → choose **Leads**.
2. Upload `leads-twenty-import.csv`.
3. Twenty matches columns to fields by header — check the mapping, fix any mismatch.
4. Import. (Limit 10k rows; dedupe before importing.)
5. The 5 rows are **samples** — open each and delete once you've seen the board work.

## Step 4 — Create the Kanban view

1. Open **Leads**.
2. Top-left **view switcher** → **+ Add view** → **Kanban**.
3. **Group by → Stage**.
4. Name it `Pipeline`, save.
5. Drag a card between columns → its **Stage** updates instantly.

That's your outreach board: each business is a card, you drag it
`To contact → Contacted → Replied → Qualified → Proposal → Won` (or → `Lost`).

---

## Workflow — you found a prospect → capture it

The moment you find a business on 2GIS and want to log it:

1. Open **Leads** → on the **Kanban**, click **+** at the top of the **"To contact"**
   column (the card is born in the right stage). Or `Cmd/Ctrl + K → Create → Lead`.
2. Type the **business name** (that's the record's **Name**).
3. Open the card and fill fields, most important first:
   - **Source** = `2GIS` — attribution, never skip it (this is how you'll later see
     which channel converts).
   - **Niche** + **City** — for stats and filters.
   - **Has website** = `No / Weak / Yes` — your ICP signal.
   - **Contact** = their `wa.me` / Instagram / phone.
   - **Link** = the 2GIS card URL, so you can reopen it later.
   - **Notes** = the **qualification hook** you'll open with ("300 reviews, no site,
     not on Yandex"). This is the seed of your first message.
   - **Next step** = `First message — <angle>`; **Next step date** = today/tomorrow.
4. Done — the card sits in **To contact** with a due date.

Then **work it** by dragging across stages:
`Contacted` (wrote them, set next step +3d) → `Replied` → `Qualified` (brief + budget)
→ `Proposal` (price sent) → `Won` (fill **Deal value**) or `Lost` (fill **Lost reason**).

## What to use inside Twenty (feature → when)

| Feature | Use it for |
|---|---|
| **Kanban view** (Pipeline) | daily picture; drag a card = update its Stage |
| **Table view** | bulk edits, scanning all fields at once |
| **Sort / Filter** | build a "Due today" view: filter `Next step date` ≤ today = your call list |
| **Notes** (on a record) | log what was said, paste the message you sent, keep context |
| **Tasks** (on a record) | a real to-do with a due date that shows in a cross-lead task list — stronger than the `Next step date` field once you have many leads |
| **Command menu** `Cmd/Ctrl+K` | quick-create a Lead, search, import — the fastest entry point |
| **Bulk CSV import** | add many 2GIS prospects at once (`leads-twenty-import.csv` format) |
| **Workflows** (later) | automate, e.g. when Stage → `Won`, auto-create a follow-up task |

> **Field vs Task for "next step".** Start with the `Next step` + `Next step date`
> fields — simplest, one place, sortable. When you juggle many leads and want one
> cross-lead "what do I do today" list, switch to native **Tasks** linked to each Lead.

## Daily workflow (in Twenty now, no spreadsheet)

1. **Add prospects:** open Leads, `+`-add a card per 2GIS business (or bulk-import a CSV).
   Fill `Niche`, `Has website`, `Source`, set `Stage = To contact`.
2. **Write them** (templates in `outreach-niche-kits.md`) → move card to `Contacted`,
   set `Next step` + `Next step date`.
3. **Follow-ups:** sort/filter by `Next step date` ≤ today → act → move the card.
4. **Outcomes:** reply → `Replied`; brief done → `Qualified`; price sent → `Proposal`;
   closed → `Won` (fill `Deal value`) or `Lost` (fill `Lost reason`).

## Later (optional)

- Add a **Filter** view "Due today" = `Next step date` is on/before today.
- Group a second Kanban by `Source` or `Niche` to see which channel converts.
- When you outgrow a flat Leads object → graduate to built-in **Companies +
  Opportunities** for real deal/revenue reporting.
