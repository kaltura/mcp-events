# New API Services Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the monolithic MCP server into per-service domain folders and add 11 new tools for Team Members, Event Users, and Session Participants from the Kaltura Events Public API.

**Architecture:** Move existing event/session code into `domains/<service>/` folders (schemas + tools co-located), expose a single barrel `domains/index.ts` that both entry points (`mcp.service.ts` and `server.ts`) call. Three new domain folders are added (team-members, event-users, session-participants) — each with a `schemas.ts` and `tools.ts`. The single `PublicApiClient` grows new sections for each service.

**Tech Stack:** TypeScript, Zod (schema validation), `@modelcontextprotocol/sdk`, NestJS (HTTP mode), native `fetch`.

---

## File Map

### Files to CREATE
| Path | Responsibility |
|------|---------------|
| `apps/mcp-server/src/domains/index.ts` | Barrel: exports `registerAllDomainTools()` and `registerAllDomainResources()` |
| `apps/mcp-server/src/domains/events/schemas.ts` | Event Zod schemas (moved from `schemas/eventSchemas.ts`) |
| `apps/mcp-server/src/domains/events/tools.ts` | Event tool registrations (moved from `tools/eventTools.ts`) |
| `apps/mcp-server/src/domains/events/resources.ts` | Event resources (moved from `resources/eventResources.ts`) |
| `apps/mcp-server/src/domains/sessions/schemas.ts` | Session Zod schemas (moved from `schemas/eventSchemas.ts`) |
| `apps/mcp-server/src/domains/sessions/tools.ts` | Session tool registrations (moved from `tools/eventTools.ts`) |
| `apps/mcp-server/src/domains/team-members/schemas.ts` | Team member Zod schemas |
| `apps/mcp-server/src/domains/team-members/tools.ts` | Team member tool registrations |
| `apps/mcp-server/src/domains/event-users/schemas.ts` | Event user Zod schemas |
| `apps/mcp-server/src/domains/event-users/tools.ts` | Event user tool registrations |
| `apps/mcp-server/src/domains/session-participants/schemas.ts` | Session participant Zod schemas |
| `apps/mcp-server/src/domains/session-participants/tools.ts` | Session participant tool registrations |

### Files to MODIFY
| Path | What changes |
|------|-------------|
| `apps/mcp-server/src/api/publicApiClient.ts` | Add import path updates + 11 new API methods + expanded `paths` object |
| `apps/mcp-server/src/mcp.service.ts` | Swap old imports for `registerAllDomainTools` / `registerAllDomainResources` from `./domains` |
| `apps/mcp-server/src/server.ts` | Same swap as `mcp.service.ts` |

### Files to DELETE
| Path | Why |
|------|-----|
| `apps/mcp-server/src/schemas/eventSchemas.ts` | Replaced by domain schemas |
| `apps/mcp-server/src/tools/eventTools.ts` | Replaced by domain tools |
| `apps/mcp-server/src/resources/eventResources.ts` | Replaced by `domains/events/resources.ts` |

---

## Task 1: Create the domains folder and move Event schemas

**Files:**
- Create: `apps/mcp-server/src/domains/events/schemas.ts`

- [ ] **Step 1: Create the file with all event-only schemas**

  This is a direct move of the event-related portion of `schemas/eventSchemas.ts` — everything except session schemas. Session schemas (`SessionType`, `SessionVisibility`, `ListSessionDto`, `ListSessionSpeakersDto`, `CreateSessionDto`, `TCreateSessionDto`) move in Task 2.

  Create `apps/mcp-server/src/domains/events/schemas.ts`:

  ```typescript
  import { z } from 'zod'
  import { PresetTemplates } from '../../resources/presetTemplates'
  import { SupportedTimeZones } from '../../resources/timeZones'

  const templateIdEnum = z
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    .enum(PresetTemplates.map((template) => template.templateId))
    .describe(
      'default ids: no session: tm0000, with interactive room: tm1000, with Live Webcast: tm2000, simulated live session: tm3000, room broadcasting to live webcast: tm4000',
    )
  const ObjectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId')

  export const CreateEventDto = z.object({
    templateId: z
      .union([templateIdEnum, ObjectId])
      .describe("Kaltura Event Template ID. Example: '507f1f77bcf86cd799439011'"),
    name: z.string().describe("Event Name. Example: 'Virtual Town hall 2025'"),
    description: z.string().optional().describe("Event Description. Example: 'Annual company-wide update'"),
    startDate: z.string().datetime().describe("Event Start Date (ISO 8601). Example: '2025-05-01T14:00:00Z'"),
    endDate: z.string().datetime().describe("Event End Date (ISO 8601). Example: '2025-05-01T16:00:00Z'"),
    timezone: z
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .enum(SupportedTimeZones)
      .describe(
        "Event Timezone. Example: 'America/New_York'. Accepting the Official time zone database version 2022f",
      ),
  })

  export const DeleteEventDto = z.object({
    id: z.number().describe('Event ID. Example: 98765'),
  })

  export const ListEventFilterDto = z.object({
    idIn: z.array(z.number()).optional().describe('Filter for events with ids in the provided array.'),
    templateIdIn: z
      .array(z.union([templateIdEnum, ObjectId]))
      .optional()
      .describe('Filter for events with template ids in the provided array.'),
    searchTerm: z
      .string()
      .optional()
      .describe("Filter for events including the search term provided (by Name). Example: 'Town hall'"),
    startDateGreaterThanOrEqual: z
      .string()
      .datetime()
      .optional()
      .describe("Filter for events with start date >= the provided value. Example: '2025-01-01T00:00:00Z'"),
    startDateLessOrEqualThan: z
      .string()
      .datetime()
      .optional()
      .describe('Filter for events with start date <= the provided value.'),
    endDateGreaterThanOrEqual: z
      .string()
      .datetime()
      .optional()
      .describe('Filter for events with end date >= the provided value.'),
    endDateLessOrEqualThan: z
      .string()
      .datetime()
      .optional()
      .describe("Filter for events with end date <= the provided value. Example: '2025-12-31T23:59:59Z'"),
    labels: z
      .array(z.string())
      .optional()
      .describe(
        "Filter for events with labels matching any of the provided array items. Example: ['all-hands', 'q2']",
      ),
  })
  export type TListEventFilterDto = z.infer<typeof ListEventFilterDto>

  export const PagerDto = z.object({
    offset: z.number().default(0).describe('Page index. Default: 0. Example: 0'),
    limit: z.number().min(1).max(15).default(15).describe('Page size. Default: 30. Example: 10'),
  })

  export const EventOrderBy = z.enum(['+name', '-name', '+createdAt', '-createdAt', '+startDate', '-startDate'])

  export const ListEventDto = z.object({
    filter: ListEventFilterDto.optional().describe('Filter information.'),
    pager: PagerDto.optional().describe('Pagination information.'),
    orderBy: EventOrderBy.optional().describe(
      "Order by field and direction. Example: '+name' for ascending, '-name' for descending",
    ),
  })

  export const UpdateEventDto = z.object({
    id: z.number().describe('Event ID. Example: 98765'),
    name: z.string().optional().describe("Event name. Example: 'Updated Virtual Town hall'"),
    description: z.string().optional().describe("Event description. Example: 'Updated description'"),
    startDate: z
      .string()
      .datetime()
      .optional()
      .describe("Event start date (ISO 8601). Example: '2025-05-01T14:00:00Z'"),
    endDate: z
      .string()
      .datetime()
      .optional()
      .describe("Event end date (ISO 8601). Example: '2025-05-01T16:00:00Z'"),
    doorsOpenDate: z
      .string()
      .datetime()
      .optional()
      .describe("Event doors open date (ISO 8601). Example: '2025-05-01T13:30:00Z'"),
    timezone: z.string().optional().describe("Event timezone. Example: 'America/New_York'"),
    labels: z.array(z.string()).optional().describe("Event labels. Example: ['all-hands', 'q2']"),
    logoEntryId: z.string().optional().describe("Event logo entry id. Example: '1_xextzqk8'"),
    bannerEntryId: z.string().optional().describe("Event banner id. Example: '1_p3im68oa'"),
  })
  ```

- [ ] **Step 2: Verify the file looks correct (no compile check yet — dependencies not wired)**

  ```bash
  cat apps/mcp-server/src/domains/events/schemas.ts | head -5
  ```
  Expected: `import { z } from 'zod'`

---

## Task 2: Move Session schemas

**Files:**
- Create: `apps/mcp-server/src/domains/sessions/schemas.ts`

- [ ] **Step 1: Create the session schemas file**

  Create `apps/mcp-server/src/domains/sessions/schemas.ts`:

  ```typescript
  import { z } from 'zod'

  export enum SessionType {
    InteractiveRoom = 'MeetingEntry',
    SimuLive = 'SimuLive',
    LiveWebcast = 'LiveWebcast',
    DiyLiveWebcast = 'LiveKME',
    VirtualLearningRoom = 'VirtualLearningRoom',
    Invalid = 'Invalid',
  }

  export enum SessionVisibility {
    /**
     * In sites, if in related media.
     */
    published = 'published',
    /**
     * Only KMS.
     */
    unlisted = 'unlisted',
    /**
     * In Sites, if not in related media.
     */
    private = 'private',
  }

  export const ListSessionDto = z.object({
    eventId: z.number().describe('Event ID. Example: 98765'),
  })

  export const ListSessionSpeakersDto = z.object({
    eventId: z.number().describe('Event ID. Example: 98765'),
    sessionId: z
      .string()
      .describe("Session Entry ID (Belonging to the specified event). Example: '1_abcd1234'"),
  })

  export const CreateSessionDto = z.object({
    id: z.number().describe('Event ID. Example: 98765'),
    session: z.object({
      name: z.string().describe("Session Name. Example: 'Virtual Town hall 2025 - Session 1'"),
      type: z
        .nativeEnum(SessionType)
        .describe(
          "Session Type. Example: 'MeetingEntry' for Interactive Room, 'LiveWebcast' for Live Webcast, 'SimuLive' for Simulated Live",
        ),
      description: z.string().optional().describe("Session Description. Example: 'Session 1 description'"),
      startDate: z
        .string()
        .datetime()
        .describe("Session Start Date (ISO 8601). Example: '2025-05-01T14:00:00Z'")
        .optional(),
      endDate: z
        .string()
        .datetime()
        .describe("Session End Date (ISO 8601). Example: '2025-05-01T16:00:00Z'")
        .optional(),
      tags: z.array(z.string()).describe('Session tags. Example: ["tag1", "tag2"]').optional(),
      visibility: z.nativeEnum(SessionVisibility).describe('Entry visibility. Example: "published"').optional(),
      isManualLive: z.boolean().optional(),
      imageUrlEntryId: z
        .string()
        .describe('Kaltura entry id for the session thumbnail image, example: 1_abcd1234')
        .optional(),
      sourceEntryId: z
        .string()
        .describe('For Simulive session types, the VOD entry, example: 1_abcd1234')
        .optional(),
    }),
  })
  export type TCreateSessionDto = z.infer<typeof CreateSessionDto>
  ```

---

## Task 3: Move Event tools into domain folder

**Files:**
- Create: `apps/mcp-server/src/domains/events/tools.ts`

- [ ] **Step 1: Create the event tools file**

  This is an exact move of the event-only tools from `tools/eventTools.ts` (create, list, update, delete). The session tools move in Task 4.

  Create `apps/mcp-server/src/domains/events/tools.ts`:

  ```typescript
  import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
  import { CreateEventDto, ListEventDto, UpdateEventDto, DeleteEventDto } from './schemas'
  import { PublicApiClient } from '../../api/publicApiClient'

  /**
   * Register event-related tools with the MCP server
   * @param server MCP Server instance
   * @param ks Kaltura Session for this connection (captured in closure)
   * @param publicApiClient Public API client instance
   */
  export function registerEventTools(server: McpServer, ks: string, publicApiClient: PublicApiClient): void {
    // Tool for creating events
    server.tool(
      'create-event',
      'Creates a new virtual event with provided configuration including name, start/end dates, templates, and timezone settings',
      CreateEventDto.shape,
      {
        title: 'Create a Kaltura Event',
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        readOnlyHint: false,
      },
      async ({ name, templateId, startDate, endDate, timezone, description }) => {
        try {
          const result = await publicApiClient.createEvent(ks, {
            name,
            templateId,
            startDate,
            endDate,
            timezone,
            description,
          })
          return { content: [{ type: 'text', text: result }] }
        } catch (error) {
          return {
            content: [
              { type: 'text', text: `Error creating event: ${error instanceof Error ? error.message : String(error)}` },
            ],
          }
        }
      },
    )

    // Tool for listing events
    server.tool(
      'list-events',
      'get a list of available events',
      ListEventDto.shape,
      {
        title: 'List Events',
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
        readOnlyHint: true,
      },
      async ({ filter, pager }) => {
        try {
          const result = await publicApiClient.listEvents(ks, { filter, pager })
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
        } catch (error) {
          return {
            content: [
              { type: 'text', text: `Error listing events: ${error instanceof Error ? error.message : String(error)}` },
            ],
          }
        }
      },
    )

    // Tool for updating events
    server.tool(
      'update-event',
      "Modifies an existing event's properties such as name, dates, banner, logo, and other configuration settings",
      UpdateEventDto.shape,
      {
        title: 'Update an Event',
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        readOnlyHint: false,
      },
      async ({ id, name, description, startDate, endDate, doorsOpenDate, timezone, labels, logoEntryId, bannerEntryId }) => {
        try {
          const result = await publicApiClient.updateEvent(ks, {
            id, name, description, startDate, endDate, doorsOpenDate, timezone, labels, logoEntryId, bannerEntryId,
          })
          return { content: [{ type: 'text', text: result }] }
        } catch (error) {
          return {
            content: [
              { type: 'text', text: `Error updating event: ${error instanceof Error ? error.message : String(error)}` },
            ],
          }
        }
      },
    )

    // Tool for deleting events
    server.tool(
      'delete-event',
      'Permanently removes an event by its ID, including all associated resources and configurations',
      DeleteEventDto.shape,
      {
        title: 'Delete an Event',
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
        readOnlyHint: false,
      },
      async ({ id }) => {
        try {
          const result = await publicApiClient.deleteEvent(ks, id)
          return { content: [{ type: 'text', text: result }] }
        } catch (error) {
          return {
            content: [
              { type: 'text', text: `Error deleting event: ${error instanceof Error ? error.message : String(error)}` },
            ],
          }
        }
      },
    )
  }
  ```

---

## Task 4: Move Session tools into domain folder

**Files:**
- Create: `apps/mcp-server/src/domains/sessions/tools.ts`

- [ ] **Step 1: Create the session tools file**

  Create `apps/mcp-server/src/domains/sessions/tools.ts`:

  ```typescript
  import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
  import { ListSessionDto, CreateSessionDto } from './schemas'
  import { PublicApiClient } from '../../api/publicApiClient'

  /**
   * Register session-related tools with the MCP server
   * @param server MCP Server instance
   * @param ks Kaltura Session for this connection (captured in closure)
   * @param publicApiClient Public API client instance
   */
  export function registerSessionTools(server: McpServer, ks: string, publicApiClient: PublicApiClient): void {
    // Tool for creating an event session
    server.tool(
      'create-event-session',
      'Creates a new session for a specific event with provided configuration including name, description, start/end dates, and visibility settings',
      CreateSessionDto.shape,
      {
        title: 'Create an Event Session',
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        readOnlyHint: false,
      },
      async ({ id, session }) => {
        try {
          const result = await publicApiClient.createSession(ks, id, session)
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
        } catch (error) {
          return {
            content: [
              { type: 'text', text: `Error creating event session: ${error instanceof Error ? error.message : String(error)}` },
            ],
          }
        }
      },
    )

    // Tool for listing event sessions
    server.tool(
      'list-event-sessions',
      'Retrieves a list of sessions for a specific event',
      ListSessionDto.shape,
      {
        title: 'List Event Sessions',
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
        readOnlyHint: true,
      },
      async ({ eventId }) => {
        try {
          const result = await publicApiClient.listSessions(ks, eventId)
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
        } catch (error) {
          return {
            content: [
              { type: 'text', text: `Error listing event sessions: ${error instanceof Error ? error.message : String(error)}` },
            ],
          }
        }
      },
    )
  }
  ```

---

## Task 5: Move Event resources into domain folder

**Files:**
- Create: `apps/mcp-server/src/domains/events/resources.ts`

- [ ] **Step 1: Create the event resources file**

  Create `apps/mcp-server/src/domains/events/resources.ts`:

  ```typescript
  import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
  import { PublicApiClient } from '../../api/publicApiClient'
  import assert from 'node:assert'
  import { PresetTemplates } from '../../resources/presetTemplates'

  /**
   * Register event-related resources with the MCP server
   * @param server MCP Server instance
   * @param ks Kaltura Session for this connection (captured in closure)
   * @param publicApiClient Public API client instance
   */
  export function registerEventResources(
    server: McpServer,
    ks: string,
    publicApiClient: PublicApiClient,
  ): void {
    server.registerResource(
      'events',
      new ResourceTemplate('events://{eventId}/info', { list: undefined }),
      {
        title: 'Kaltura Event Information',
        description: 'Provides information about a specific Kaltura event',
      },
      async (uri, { eventId }) => {
        try {
          assert(typeof Number(eventId) === 'number', `eventId must be a number, received: ${typeof eventId}`)
          const result = await publicApiClient.listEvents(ks, {
            filter: { idIn: [Number(eventId)] },
            pager: { limit: 1, offset: 0 },
          })
          assert((result as { totalCount?: number }).totalCount, `event ${eventId} not found!`)
          return {
            contents: [
              {
                uri: uri.href,
                text: JSON.stringify((result as { events: [unknown] }).events[0], null, 2),
              },
            ],
          }
        } catch (error) {
          return {
            contents: [
              {
                uri: uri.href,
                text: `Error getting event: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          }
        }
      },
    )

    server.registerResource(
      'preset-templates',
      'preset-templates://all',
      {
        title: 'Kaltura Preset Templates',
        description: 'Provides a list of all available Kaltura preset templates',
        mimeType: 'text/plain',
      },
      async (uri) => {
        return {
          contents: [{ uri: uri.href, text: JSON.stringify(PresetTemplates, null, 2) }],
        }
      },
    )
  }
  ```

---

## Task 6: Create the domains barrel (index.ts)

**Files:**
- Create: `apps/mcp-server/src/domains/index.ts`

- [ ] **Step 1: Create the barrel file**

  This imports all domain register functions and re-exports two composite functions that both entry points will call.

  Create `apps/mcp-server/src/domains/index.ts`:

  ```typescript
  import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
  import { PublicApiClient } from '../api/publicApiClient'
  import { registerEventTools } from './events/tools'
  import { registerEventResources } from './events/resources'
  import { registerSessionTools } from './sessions/tools'
  import { registerTeamMemberTools } from './team-members/tools'
  import { registerEventUserTools } from './event-users/tools'
  import { registerSessionParticipantTools } from './session-participants/tools'

  export function registerAllDomainTools(server: McpServer, ks: string, publicApiClient: PublicApiClient): void {
    registerEventTools(server, ks, publicApiClient)
    registerSessionTools(server, ks, publicApiClient)
    registerTeamMemberTools(server, ks, publicApiClient)
    registerEventUserTools(server, ks, publicApiClient)
    registerSessionParticipantTools(server, ks, publicApiClient)
  }

  export function registerAllDomainResources(server: McpServer, ks: string, publicApiClient: PublicApiClient): void {
    registerEventResources(server, ks, publicApiClient)
  }
  ```

  > Note: The team-members, event-users, and session-participants files will be created in later tasks. The barrel will fail to compile until those files exist — that's fine.

---

## Task 7: Update entry points to use the domains barrel

**Files:**
- Modify: `apps/mcp-server/src/mcp.service.ts`
- Modify: `apps/mcp-server/src/server.ts`

- [ ] **Step 1: Update `mcp.service.ts`**

  Replace lines 5-6 in `apps/mcp-server/src/mcp.service.ts`:

  Old:
  ```typescript
  import { registerEventTools } from './tools/eventTools'
  import { registerEventResources } from './resources/eventResources'
  ```

  New:
  ```typescript
  import { registerAllDomainTools, registerAllDomainResources } from './domains'
  ```

  Replace lines 30-31 in `mcp.service.ts` (inside `handleRequest`):

  Old:
  ```typescript
  registerEventTools(mcpServer, ks, this.publicApiClient)
  registerEventResources(mcpServer, ks, this.publicApiClient)
  ```

  New:
  ```typescript
  registerAllDomainTools(mcpServer, ks, this.publicApiClient)
  registerAllDomainResources(mcpServer, ks, this.publicApiClient)
  ```

- [ ] **Step 2: Update `server.ts`**

  Replace lines 4-5 in `apps/mcp-server/src/server.ts`:

  Old:
  ```typescript
  import { registerEventTools } from './tools/eventTools'
  import { registerEventResources } from './resources/eventResources'
  ```

  New:
  ```typescript
  import { registerAllDomainTools, registerAllDomainResources } from './domains'
  ```

  Replace lines 33-35 in `server.ts`:

  Old:
  ```typescript
  // Register all tools with KS from environment
  registerEventTools(server, ks, publicApiClient)
  // Register all resources with KS from environment
  registerEventResources(server, ks, publicApiClient)
  ```

  New:
  ```typescript
  // Register all tools and resources with KS from environment
  registerAllDomainTools(server, ks, publicApiClient)
  registerAllDomainResources(server, ks, publicApiClient)
  ```

---

## Task 8: Update PublicApiClient imports

**Files:**
- Modify: `apps/mcp-server/src/api/publicApiClient.ts`

- [ ] **Step 1: Update the import on line 3 of `publicApiClient.ts`**

  Old:
  ```typescript
  import { SessionType, SessionVisibility, TListEventFilterDto } from '../schemas/eventSchemas'
  ```

  New:
  ```typescript
  import { SessionType, SessionVisibility } from '../domains/sessions/schemas'
  import { TListEventFilterDto } from '../domains/events/schemas'
  ```

---

## Task 9: Delete old monolithic files

**Files:**
- Delete: `apps/mcp-server/src/schemas/eventSchemas.ts`
- Delete: `apps/mcp-server/src/tools/eventTools.ts`
- Delete: `apps/mcp-server/src/resources/eventResources.ts`

- [ ] **Step 1: Delete the three obsolete files**

  ```bash
  rm apps/mcp-server/src/schemas/eventSchemas.ts
  rm apps/mcp-server/src/tools/eventTools.ts
  rm apps/mcp-server/src/resources/eventResources.ts
  ```

- [ ] **Step 2: Verify the build compiles cleanly (this validates the refactor)**

  ```bash
  cd /Users/tomgabay/Desktop/kaltura/mcp-events && npm run build
  ```

  Expected: zero errors. The domains barrel will fail on missing team-members/event-users/session-participants files — so those stubs need to exist first. If the build fails because of those missing imports, create temporary stub files:

  ```bash
  # Create directories and temporary stubs so build passes before the new domains are implemented
  mkdir -p apps/mcp-server/src/domains/team-members
  mkdir -p apps/mcp-server/src/domains/event-users
  mkdir -p apps/mcp-server/src/domains/session-participants
  echo 'import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"; import { PublicApiClient } from "../../api/publicApiClient"; export function registerTeamMemberTools(_s: McpServer, _k: string, _c: PublicApiClient): void {}' > apps/mcp-server/src/domains/team-members/tools.ts
  echo 'import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"; import { PublicApiClient } from "../../api/publicApiClient"; export function registerEventUserTools(_s: McpServer, _k: string, _c: PublicApiClient): void {}' > apps/mcp-server/src/domains/event-users/tools.ts
  echo 'import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"; import { PublicApiClient } from "../../api/publicApiClient"; export function registerSessionParticipantTools(_s: McpServer, _k: string, _c: PublicApiClient): void {}' > apps/mcp-server/src/domains/session-participants/tools.ts
  npm run build
  ```

  Expected after stubs: zero TypeScript errors.

- [ ] **Step 3: Commit the refactor**

  ```bash
  git add apps/mcp-server/src/domains/ apps/mcp-server/src/api/publicApiClient.ts apps/mcp-server/src/mcp.service.ts apps/mcp-server/src/server.ts
  git rm apps/mcp-server/src/schemas/eventSchemas.ts apps/mcp-server/src/tools/eventTools.ts apps/mcp-server/src/resources/eventResources.ts
  git commit -m "refactor: move tools/schemas into per-service domain folders"
  ```

---

## Task 10: Add Team Member schemas

**Files:**
- Create: `apps/mcp-server/src/domains/team-members/schemas.ts`

- [ ] **Step 1: Create the team member schemas file**

  All enums and descriptions come directly from the swagger `CreateTeamRequestDto`, `UpdateTeamRequestDto`, `DeleteTeamRequestDto`, `ListTeamRequestDto`.

  Create `apps/mcp-server/src/domains/team-members/schemas.ts`:

  ```typescript
  import { z } from 'zod'

  export const TeamMemberRole = z
    .enum(['Admin', 'Organizer', 'ContentManager'])
    .describe("Team member Event Platform role. Example: 'Organizer'")

  export const CreateTeamMemberDto = z.object({
    email: z.string().email().describe("Team member email. Example: 'john@company.com'"),
    role: TeamMemberRole,
    firstName: z.string().describe("Team member first name. Example: 'John'"),
    lastName: z.string().describe("Team member last name. Example: 'Doe'"),
  })

  export const UpdateTeamMemberDto = z.object({
    id: z.string().describe("Team member Kaltura id. Example: 'e3b0c44298fc1c149'"),
    firstName: z.string().optional().describe("Team member first name. Example: 'John'"),
    lastName: z.string().optional().describe("Team member last name. Example: 'Doe'"),
    role: TeamMemberRole.optional(),
    disabled: z
      .boolean()
      .optional()
      .describe('Whether the team member is disabled for Event Platform login. Example: false'),
  })

  export const DeleteTeamMemberDto = z.object({
    id: z.string().describe("Team member Kaltura id. Example: 'e3b0c44298fc1c149'"),
  })

  export const ListTeamMembersDto = z.object({
    pager: z
      .object({
        offset: z.number().default(0).describe('Page index. Default: 0. Example: 0'),
        limit: z.number().default(30).describe('Page size. Default: 30. Example: 10'),
      })
      .optional()
      .describe('Pagination information.'),
  })
  ```

---

## Task 11: Add Team Member API client methods

**Files:**
- Modify: `apps/mcp-server/src/api/publicApiClient.ts`

- [ ] **Step 1: Expand the `paths` object with team-member paths**

  In `publicApiClient.ts`, replace the existing `paths` object:

  Old:
  ```typescript
  private readonly paths = Object.freeze({
    event: {
      create: 'events/create',
      list: 'events/list',
      update: 'events/update',
      delete: 'events/delete',
    },
    session: {
      create: 'sessions/create',
      list: 'sessions/list',
      speakerList: 'sessions/speakerList',
    },
  })
  ```

  New:
  ```typescript
  private readonly paths = Object.freeze({
    event: {
      create: 'events/create',
      list: 'events/list',
      update: 'events/update',
      delete: 'events/delete',
    },
    session: {
      create: 'sessions/create',
      list: 'sessions/list',
      speakerList: 'sessions/speakerList',
    },
    teamMember: {
      create: 'team-members/create',
      update: 'team-members/update',
      delete: 'team-members/delete',
      list: 'team-members/list',
    },
    eventUser: {
      invite: 'event-users/invite',
      list: 'event-users/list',
      update: 'event-users/update',
      delete: 'event-users/delete',
    },
    sessionParticipant: {
      add: 'session-participants/add',
      remove: 'session-participants/remove',
      list: 'session-participants/list',
    },
  })
  ```

- [ ] **Step 2: Add team member methods to `PublicApiClient`**

  Append these methods before the `handleResponseError` private method in `publicApiClient.ts`:

  ```typescript
  // ─── Team Members ────────────────────────────────────────────────────────────

  /**
   * Create a new Event Platform team member
   * @param ks Kaltura Session for this request
   */
  async createTeamMember(
    ks: string,
    params: { email: string; role: string; firstName: string; lastName: string },
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.teamMember.create}`, {
      method: 'POST',
      headers: this.getHeaders(ks),
      body: JSON.stringify(params),
    })
    if (!response.ok) { await this.handleResponseError(response, 'createTeamMember') }
    return await response.text()
  }

  /**
   * Update an Event Platform team member
   * @param ks Kaltura Session for this request
   */
  async updateTeamMember(
    ks: string,
    params: { id: string; firstName?: string; lastName?: string; role?: string; disabled?: boolean },
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.teamMember.update}`, {
      method: 'POST',
      headers: this.getHeaders(ks),
      body: JSON.stringify(params),
    })
    if (!response.ok) { await this.handleResponseError(response, 'updateTeamMember') }
    return await response.text()
  }

  /**
   * Delete an Event Platform team member
   * @param ks Kaltura Session for this request
   */
  async deleteTeamMember(ks: string, params: { id: string }): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.teamMember.delete}`, {
      method: 'POST',
      headers: this.getHeaders(ks),
      body: JSON.stringify(params),
    })
    if (!response.ok) { await this.handleResponseError(response, 'deleteTeamMember') }
    return await response.text()
  }

  /**
   * List Event Platform team members
   * @param ks Kaltura Session for this request
   */
  async listTeamMembers(
    ks: string,
    params: { pager?: { offset?: number; limit?: number } },
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.teamMember.list}`, {
      method: 'POST',
      headers: this.getHeaders(ks),
      body: JSON.stringify(params),
    })
    if (!response.ok) { await this.handleResponseError(response, 'listTeamMembers') }
    return await response.text()
  }
  ```

---

## Task 12: Add Team Member tools

**Files:**
- Create (overwrite stub): `apps/mcp-server/src/domains/team-members/tools.ts`

- [ ] **Step 1: Create the team member tools file**

  Create `apps/mcp-server/src/domains/team-members/tools.ts`:

  ```typescript
  import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
  import { CreateTeamMemberDto, UpdateTeamMemberDto, DeleteTeamMemberDto, ListTeamMembersDto } from './schemas'
  import { PublicApiClient } from '../../api/publicApiClient'

  /**
   * Register team member tools with the MCP server
   * @param server MCP Server instance
   * @param ks Kaltura Session for this connection (captured in closure)
   * @param publicApiClient Public API client instance
   */
  export function registerTeamMemberTools(server: McpServer, ks: string, publicApiClient: PublicApiClient): void {
    server.tool(
      'create-team-member',
      'Creates a new Event Platform team member with the specified role',
      CreateTeamMemberDto.shape,
      {
        title: 'Create Team Member',
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        readOnlyHint: false,
      },
      async ({ email, role, firstName, lastName }) => {
        try {
          const result = await publicApiClient.createTeamMember(ks, { email, role, firstName, lastName })
          return { content: [{ type: 'text', text: result }] }
        } catch (error) {
          return {
            content: [
              { type: 'text', text: `Error creating team member: ${error instanceof Error ? error.message : String(error)}` },
            ],
          }
        }
      },
    )

    server.tool(
      'update-team-member',
      'Updates an Event Platform team member profile or role',
      UpdateTeamMemberDto.shape,
      {
        title: 'Update Team Member',
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        readOnlyHint: false,
      },
      async ({ id, firstName, lastName, role, disabled }) => {
        try {
          const result = await publicApiClient.updateTeamMember(ks, { id, firstName, lastName, role, disabled })
          return { content: [{ type: 'text', text: result }] }
        } catch (error) {
          return {
            content: [
              { type: 'text', text: `Error updating team member: ${error instanceof Error ? error.message : String(error)}` },
            ],
          }
        }
      },
    )

    server.tool(
      'delete-team-member',
      'Deletes an Event Platform team member',
      DeleteTeamMemberDto.shape,
      {
        title: 'Delete Team Member',
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
        readOnlyHint: false,
      },
      async ({ id }) => {
        try {
          const result = await publicApiClient.deleteTeamMember(ks, { id })
          return { content: [{ type: 'text', text: result }] }
        } catch (error) {
          return {
            content: [
              { type: 'text', text: `Error deleting team member: ${error instanceof Error ? error.message : String(error)}` },
            ],
          }
        }
      },
    )

    server.tool(
      'list-team-members',
      'Retrieves a list of Event Platform team members',
      ListTeamMembersDto.shape,
      {
        title: 'List Team Members',
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
        readOnlyHint: true,
      },
      async ({ pager }) => {
        try {
          const result = await publicApiClient.listTeamMembers(ks, { pager })
          return { content: [{ type: 'text', text: result }] }
        } catch (error) {
          return {
            content: [
              { type: 'text', text: `Error listing team members: ${error instanceof Error ? error.message : String(error)}` },
            ],
          }
        }
      },
    )
  }
  ```

- [ ] **Step 2: Verify build still passes**

  ```bash
  cd /Users/tomgabay/Desktop/kaltura/mcp-events && npm run build
  ```

  Expected: zero errors.

- [ ] **Step 3: Commit**

  ```bash
  git add apps/mcp-server/src/domains/team-members/ apps/mcp-server/src/api/publicApiClient.ts
  git commit -m "feat: add team-members domain (create, update, delete, list tools)"
  ```

---

## Task 13: Add Event User schemas

**Files:**
- Create: `apps/mcp-server/src/domains/event-users/schemas.ts`

- [ ] **Step 1: Create the event user schemas file**

  All field names, descriptions, and enums come from the swagger `InviteEventUserRequestDto`, `ListEventUserRequestDto`, `UpdateEventUserRequestDto`, `DeleteEventUserRequestDto`.

  Create `apps/mcp-server/src/domains/event-users/schemas.ts`:

  ```typescript
  import { z } from 'zod'

  export const EventUserRole = z
    .enum(['Attendees', 'Speaker', 'Moderator'])
    .describe("Event role. Example: 'Speaker'")

  export const InviteEventUserDto = z.object({
    eventId: z.number().describe('Kaltura event ID. Example: 98765'),
    firstName: z.string().describe("First name. Example: 'Jane'"),
    lastName: z.string().describe("Last name. Example: 'Doe'"),
    email: z.string().email().describe("Email address. Example: 'jane@example.com'"),
    title: z.string().optional().describe("Job title. Example: 'VP Engineering'"),
    company: z.string().optional().describe("Company name. Example: 'Acme Corp'"),
    bio: z.string().optional().describe('Bio / description'),
    roles: z
      .array(EventUserRole)
      .optional()
      .describe("Event roles to assign (default: ['Attendees']). Example: ['Speaker']"),
    imageUrlEntryId: z
      .string()
      .optional()
      .describe("Kaltura entry ID of uploaded profile image. Example: '1_p9ek1ngh'"),
    skipEmail: z.boolean().optional().default(false).describe('Skip sending invitation email'),
  })

  export const ListEventUsersDto = z.object({
    eventId: z.number().describe('Kaltura event ID. Example: 98765'),
    filter: z
      .object({
        searchTerm: z.string().optional().describe('Search across name and email'),
        roles: z.array(EventUserRole).optional().describe("Filter by roles. Example: ['Speaker']"),
        idIn: z.array(z.string()).optional().describe('Filter by user IDs'),
      })
      .optional()
      .describe('Filter options'),
    pager: z
      .object({
        offset: z.number().default(0).describe('Offset (0-based). Default: 0'),
        limit: z.number().default(30).describe('Page size. Default: 30'),
      })
      .optional()
      .describe('Pagination options'),
    orderBy: z
      .string()
      .optional()
      .describe("Sort order: +createdAt, -createdAt, +fullName, -fullName. Example: '-createdAt'"),
  })

  export const UpdateEventUserDto = z.object({
    eventId: z.number().describe('Kaltura event ID. Example: 98765'),
    userId: z.string().describe('User ID to update'),
    firstName: z.string().optional().describe('First name'),
    lastName: z.string().optional().describe('Last name'),
    title: z.string().optional().describe('Job title'),
    company: z.string().optional().describe('Company'),
    bio: z.string().optional().describe('Bio'),
    roles: z
      .array(EventUserRole)
      .optional()
      .describe(
        "Roles to assign. Replaces the user's current roles via diff — send all desired roles, not just new ones. Example: ['Speaker']",
      ),
    imageUrlEntryId: z.string().optional().describe("Profile image entry ID. Example: '1_p9ek1ngh'"),
  })

  export const DeleteEventUserDto = z.object({
    eventId: z.number().describe('Kaltura event ID. Example: 98765'),
    userId: z.string().describe('User ID to remove from event'),
  })
  ```

---

## Task 14: Add Event User API client methods

**Files:**
- Modify: `apps/mcp-server/src/api/publicApiClient.ts`

- [ ] **Step 1: Add event user methods to `PublicApiClient`**

  Append these methods before the `handleResponseError` private method (after the team member methods added in Task 11):

  ```typescript
  // ─── Event Users ─────────────────────────────────────────────────────────────

  /**
   * Invite a user to an event
   * @param ks Kaltura Session for this request
   */
  async inviteEventUser(
    ks: string,
    params: {
      eventId: number
      firstName: string
      lastName: string
      email: string
      title?: string
      company?: string
      bio?: string
      roles?: string[]
      imageUrlEntryId?: string
      skipEmail?: boolean
    },
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.eventUser.invite}`, {
      method: 'POST',
      headers: this.getHeaders(ks),
      body: JSON.stringify(params),
    })
    if (!response.ok) { await this.handleResponseError(response, 'inviteEventUser') }
    return await response.text()
  }

  /**
   * List users for a specific event
   * @param ks Kaltura Session for this request
   */
  async listEventUsers(
    ks: string,
    params: {
      eventId: number
      filter?: { searchTerm?: string; roles?: string[]; idIn?: string[] }
      pager?: { offset?: number; limit?: number }
      orderBy?: string
    },
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.eventUser.list}`, {
      method: 'POST',
      headers: this.getHeaders(ks),
      body: JSON.stringify(params),
    })
    if (!response.ok) { await this.handleResponseError(response, 'listEventUsers') }
    return await response.text()
  }

  /**
   * Update an event user
   * @param ks Kaltura Session for this request
   */
  async updateEventUser(
    ks: string,
    params: {
      eventId: number
      userId: string
      firstName?: string
      lastName?: string
      title?: string
      company?: string
      bio?: string
      roles?: string[]
      imageUrlEntryId?: string
    },
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.eventUser.update}`, {
      method: 'POST',
      headers: this.getHeaders(ks),
      body: JSON.stringify(params),
    })
    if (!response.ok) { await this.handleResponseError(response, 'updateEventUser') }
    return await response.text()
  }

  /**
   * Remove a user from an event
   * @param ks Kaltura Session for this request
   */
  async deleteEventUser(ks: string, params: { eventId: number; userId: string }): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.eventUser.delete}`, {
      method: 'POST',
      headers: this.getHeaders(ks),
      body: JSON.stringify(params),
    })
    if (!response.ok) { await this.handleResponseError(response, 'deleteEventUser') }
    return await response.text()
  }
  ```

---

## Task 15: Add Event User tools

**Files:**
- Create (overwrite stub): `apps/mcp-server/src/domains/event-users/tools.ts`

- [ ] **Step 1: Create the event user tools file**

  Create `apps/mcp-server/src/domains/event-users/tools.ts`:

  ```typescript
  import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
  import { InviteEventUserDto, ListEventUsersDto, UpdateEventUserDto, DeleteEventUserDto } from './schemas'
  import { PublicApiClient } from '../../api/publicApiClient'

  /**
   * Register event user tools with the MCP server
   * @param server MCP Server instance
   * @param ks Kaltura Session for this connection (captured in closure)
   * @param publicApiClient Public API client instance
   */
  export function registerEventUserTools(server: McpServer, ks: string, publicApiClient: PublicApiClient): void {
    server.tool(
      'invite-event-user',
      'Invites a user to the event with the specified roles and profile data',
      InviteEventUserDto.shape,
      {
        title: 'Invite Event User',
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        readOnlyHint: false,
      },
      async ({ eventId, firstName, lastName, email, title, company, bio, roles, imageUrlEntryId, skipEmail }) => {
        try {
          const result = await publicApiClient.inviteEventUser(ks, {
            eventId, firstName, lastName, email, title, company, bio, roles, imageUrlEntryId, skipEmail,
          })
          return { content: [{ type: 'text', text: result }] }
        } catch (error) {
          return {
            content: [
              { type: 'text', text: `Error inviting event user: ${error instanceof Error ? error.message : String(error)}` },
            ],
          }
        }
      },
    )

    server.tool(
      'list-event-users',
      'Returns a paginated list of event users with optional filtering and sorting',
      ListEventUsersDto.shape,
      {
        title: 'List Event Users',
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
        readOnlyHint: true,
      },
      async ({ eventId, filter, pager, orderBy }) => {
        try {
          const result = await publicApiClient.listEventUsers(ks, { eventId, filter, pager, orderBy })
          return { content: [{ type: 'text', text: result }] }
        } catch (error) {
          return {
            content: [
              { type: 'text', text: `Error listing event users: ${error instanceof Error ? error.message : String(error)}` },
            ],
          }
        }
      },
    )

    server.tool(
      'update-event-user',
      "Updates an event user profile and roles (role updates replace the user's current roles via diff)",
      UpdateEventUserDto.shape,
      {
        title: 'Update Event User',
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        readOnlyHint: false,
      },
      async ({ eventId, userId, firstName, lastName, title, company, bio, roles, imageUrlEntryId }) => {
        try {
          const result = await publicApiClient.updateEventUser(ks, {
            eventId, userId, firstName, lastName, title, company, bio, roles, imageUrlEntryId,
          })
          return { content: [{ type: 'text', text: result }] }
        } catch (error) {
          return {
            content: [
              { type: 'text', text: `Error updating event user: ${error instanceof Error ? error.message : String(error)}` },
            ],
          }
        }
      },
    )

    server.tool(
      'delete-event-user',
      'Removes a user from the event context including their session roles and groups',
      DeleteEventUserDto.shape,
      {
        title: 'Delete Event User',
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
        readOnlyHint: false,
      },
      async ({ eventId, userId }) => {
        try {
          const result = await publicApiClient.deleteEventUser(ks, { eventId, userId })
          return { content: [{ type: 'text', text: result }] }
        } catch (error) {
          return {
            content: [
              { type: 'text', text: `Error deleting event user: ${error instanceof Error ? error.message : String(error)}` },
            ],
          }
        }
      },
    )
  }
  ```

- [ ] **Step 2: Verify build passes**

  ```bash
  cd /Users/tomgabay/Desktop/kaltura/mcp-events && npm run build
  ```

  Expected: zero errors.

- [ ] **Step 3: Commit**

  ```bash
  git add apps/mcp-server/src/domains/event-users/ apps/mcp-server/src/api/publicApiClient.ts
  git commit -m "feat: add event-users domain (invite, list, update, delete tools)"
  ```

---

## Task 16: Add Session Participant schemas

**Files:**
- Create: `apps/mcp-server/src/domains/session-participants/schemas.ts`

- [ ] **Step 1: Create the session participant schemas file**

  All field names and constraints come from the swagger `AddSessionParticipantsRequestDto`, `RemoveSessionParticipantsRequestDto`, `ListSessionParticipantsRequestDto`, and `SpeakerInputDto`.

  Create `apps/mcp-server/src/domains/session-participants/schemas.ts`:

  ```typescript
  import { z } from 'zod'

  const SpeakerInputDto = z.object({
    userId: z.string().describe('Event user ID (from event-users/invite)'),
    order: z.number().default(0).optional().describe('Display order (default 0)'),
    isHidden: z.boolean().default(false).optional().describe('Whether speaker is hidden (default false)'),
    role: z
      .enum(['simpleSpeaker', 'advancedSpeaker'])
      .default('simpleSpeaker')
      .optional()
      .describe("Speaker sub-role (default: 'simpleSpeaker')"),
  })

  export const AddSessionParticipantsDto = z.object({
    eventId: z.number().describe('Kaltura event ID. Example: 98765'),
    sessionId: z.string().describe("Session entry ID. Example: '0_syswy6uj'"),
    speakers: z
      .array(SpeakerInputDto)
      .optional()
      .describe('Speakers to add (max 10)'),
    moderatorIds: z
      .array(z.string())
      .optional()
      .describe("Moderator user IDs to add (max 10). Example: ['def789abc012def789abc012def789abc012def789abc012def789abc012def7']"),
  })

  export const RemoveSessionParticipantsDto = z.object({
    eventId: z.number().describe('Kaltura event ID. Example: 98765'),
    sessionId: z.string().describe("Session entry ID. Example: '0_syswy6uj'"),
    speakerIds: z
      .array(z.string())
      .optional()
      .describe("Speaker user IDs to remove (max 10). Example: ['1ef91ea60970881d430d4c6658eb8dba12a25e6083037b594a1871d129dd32b9']"),
    moderatorIds: z
      .array(z.string())
      .optional()
      .describe("Moderator user IDs to remove (max 10). Example: ['abc123def456abc123def456abc123def456abc123def456abc123def456abc1']"),
  })

  export const ListSessionParticipantsDto = z.object({
    eventId: z.number().describe('Kaltura event ID. Example: 98765'),
    sessionId: z.string().describe("Session entry ID. Example: '0_syswy6uj'"),
  })
  ```

---

## Task 17: Add Session Participant API client methods

**Files:**
- Modify: `apps/mcp-server/src/api/publicApiClient.ts`

- [ ] **Step 1: Add session participant methods to `PublicApiClient`**

  Append these methods before the `handleResponseError` private method (after the event user methods added in Task 14):

  ```typescript
  // ─── Session Participants ─────────────────────────────────────────────────────

  /**
   * Add speakers and/or moderators to a session
   * @param ks Kaltura Session for this request
   */
  async addSessionParticipants(
    ks: string,
    params: {
      eventId: number
      sessionId: string
      speakers?: { userId: string; order?: number; isHidden?: boolean; role?: string }[]
      moderatorIds?: string[]
    },
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.sessionParticipant.add}`, {
      method: 'POST',
      headers: this.getHeaders(ks),
      body: JSON.stringify(params),
    })
    if (!response.ok) { await this.handleResponseError(response, 'addSessionParticipants') }
    return await response.text()
  }

  /**
   * Remove speakers and/or moderators from a session
   * @param ks Kaltura Session for this request
   */
  async removeSessionParticipants(
    ks: string,
    params: {
      eventId: number
      sessionId: string
      speakerIds?: string[]
      moderatorIds?: string[]
    },
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.sessionParticipant.remove}`, {
      method: 'POST',
      headers: this.getHeaders(ks),
      body: JSON.stringify(params),
    })
    if (!response.ok) { await this.handleResponseError(response, 'removeSessionParticipants') }
    return await response.text()
  }

  /**
   * List all speakers and moderators for a session
   * @param ks Kaltura Session for this request
   */
  async listSessionParticipants(
    ks: string,
    params: { eventId: number; sessionId: string },
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.sessionParticipant.list}`, {
      method: 'POST',
      headers: this.getHeaders(ks),
      body: JSON.stringify(params),
    })
    if (!response.ok) { await this.handleResponseError(response, 'listSessionParticipants') }
    return await response.text()
  }
  ```

---

## Task 18: Add Session Participant tools

**Files:**
- Create (overwrite stub): `apps/mcp-server/src/domains/session-participants/tools.ts`

- [ ] **Step 1: Create the session participant tools file**

  Create `apps/mcp-server/src/domains/session-participants/tools.ts`:

  ```typescript
  import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
  import {
    AddSessionParticipantsDto,
    RemoveSessionParticipantsDto,
    ListSessionParticipantsDto,
  } from './schemas'
  import { PublicApiClient } from '../../api/publicApiClient'

  /**
   * Register session participant tools with the MCP server
   * @param server MCP Server instance
   * @param ks Kaltura Session for this connection (captured in closure)
   * @param publicApiClient Public API client instance
   */
  export function registerSessionParticipantTools(
    server: McpServer,
    ks: string,
    publicApiClient: PublicApiClient,
  ): void {
    server.tool(
      'add-session-participants',
      'Adds speakers and/or moderators to a session (users must have event-level Speaker/Moderator role)',
      AddSessionParticipantsDto.shape,
      {
        title: 'Add Session Participants',
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        readOnlyHint: false,
      },
      async ({ eventId, sessionId, speakers, moderatorIds }) => {
        try {
          const result = await publicApiClient.addSessionParticipants(ks, {
            eventId, sessionId, speakers, moderatorIds,
          })
          return { content: [{ type: 'text', text: result }] }
        } catch (error) {
          return {
            content: [
              { type: 'text', text: `Error adding session participants: ${error instanceof Error ? error.message : String(error)}` },
            ],
          }
        }
      },
    )

    server.tool(
      'remove-session-participants',
      'Removes speakers and/or moderators from a session',
      RemoveSessionParticipantsDto.shape,
      {
        title: 'Remove Session Participants',
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
        readOnlyHint: false,
      },
      async ({ eventId, sessionId, speakerIds, moderatorIds }) => {
        try {
          const result = await publicApiClient.removeSessionParticipants(ks, {
            eventId, sessionId, speakerIds, moderatorIds,
          })
          return { content: [{ type: 'text', text: result }] }
        } catch (error) {
          return {
            content: [
              { type: 'text', text: `Error removing session participants: ${error instanceof Error ? error.message : String(error)}` },
            ],
          }
        }
      },
    )

    server.tool(
      'list-session-participants',
      'Lists all speakers and moderators for a session',
      ListSessionParticipantsDto.shape,
      {
        title: 'List Session Participants',
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
        readOnlyHint: true,
      },
      async ({ eventId, sessionId }) => {
        try {
          const result = await publicApiClient.listSessionParticipants(ks, { eventId, sessionId })
          return { content: [{ type: 'text', text: result }] }
        } catch (error) {
          return {
            content: [
              { type: 'text', text: `Error listing session participants: ${error instanceof Error ? error.message : String(error)}` },
            ],
          }
        }
      },
    )
  }
  ```

- [ ] **Step 2: Final build verification**

  ```bash
  cd /Users/tomgabay/Desktop/kaltura/mcp-events && npm run build
  ```

  Expected: zero TypeScript errors.

- [ ] **Step 3: Final commit**

  ```bash
  git add apps/mcp-server/src/domains/session-participants/ apps/mcp-server/src/api/publicApiClient.ts
  git commit -m "feat: add session-participants domain (add, remove, list tools)"
  ```

---

## Verification

After all tasks are complete:

1. **Build check:** `npm run build` — zero errors

2. **MCP Inspector:** `npm run inspect:stdio` — open Inspector UI and verify:
   - Total tools listed: 17 (6 existing + 11 new)
   - All new tools appear with correct names: `create-team-member`, `update-team-member`, `delete-team-member`, `list-team-members`, `invite-event-user`, `list-event-users`, `update-event-user`, `delete-event-user`, `add-session-participants`, `remove-session-participants`, `list-session-participants`
   - Each tool's schema renders with descriptions and examples on all fields

3. **Lint:** `npm run lint` — zero errors
