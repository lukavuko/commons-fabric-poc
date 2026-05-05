# Next Steps Start Here


*Review this document to see the immediate next steps for project implementation.*

*This is maintained in parallel to help polish, refine, and direct additional progress following the implementation plan at @docs/notes/7_MVP_SLICE_PLAN.md*

---

## Immediate Low Hanging Fruit Checklist

*This list may have recurring tasks. In order to support reoccurrence, we strikeout the 'finished tasks' and unstrike them once we need to do them again. If they are one off tasks, leave it for manual review to remove them from the list permanently.*

- Read through the @docs/notes/documentation-sync-registry.md and initiate a full codebase <-> docs sync analysis.
- Once the documentation-sync-registry.md table is updated, confirm deviations and corrections prior to sync-update.
- Ensuring we review the [development philosophy](./dev-philosophy.md) document, and align frontend logic so that it is fully compatible with the approach. All user permissions, user subscription states, user roles, needs to be live and come from the backend so we can keep the fron lightweight. Little, but ideally no assumptions of inheritance should be done in the front. This might be a big so may have to plan around it (TO BE CONFIRMED).
- Zoning in on a final mockup - will allow for quicker HTML design iteration which can then be replicated into the frontend
- Addressing [Tester Comments](#tester-comments) below one at a time.
- Addressing the next development Slice (#3 or #4) in the [Slice plan document](./notes/7_MVP_SLICE_PLAN.md).

---

## Latest Code Review Results

*None Currently*

---

## Tester Comments

*A real person going into the application to test how it looks and functions. If any of these are detected as resolved, remove them from the list.*

#### Logic Problem: As a community steward (just created a new community page), I shouldn't be seeing the "Subscribe" button

Community stewards automatically inherit a subscription to their managed communities. Same applies for members.
The tiers inherit the subscription property -> Subscribe -> Member -> Steward

Fix: must ensure user is automatically subscribed when they create their own community. Requires an update to the frontend logic and display which detect the subscription.

#### UI Problem: Exploring communities should have interactive gallery card popups

When I explore communities, each card should be linked to a popup that comes open when I click on it.
The popup displays all the basic information of the community, including a map that points to where that community is located (the map feature can be implemented later tho).

Only when we arrive in the popup there will be three buttons: Subscribe | Join | Visit
The visit button is what links to the actual community page where the user will then see all their information including the calendar and announcements page for whatever info is public.

This means that on the explore page, the only button that should be visible on each card is the Subscribe button and nothing else. If they are already subscribed, then instead of a green subscribe button, it is a checked and grey subscribe button indicating you have already been subscribed to it.

#### DB Problem: Username & Display name are redundant

Username was initially suggested as a unique identifier, but since email will serve that purpose we can scrap it and instead
rely on a non-unique display name for those who do not wish to share their name.

Fix: Remove column from db schema, update the .dbml file (ensure it is synced to prisma schema), run a migration on build, and ensure all traces of username are either replaced with displayName or removed.


#### UI Problem: No email verification status in on the user settings page

Users should be able to see if their email is verified, and if it isn't, have a button to dispatch that email.

Fix: Combine the Profile + Account tabs into one (Account). It should have the verify email button display if user is not verified in the db.

#### UI Problem: The Account page is disordered

The Profile account page should present information in the following sequence:
Round Profile Photo (Optional) - top left
Session (Signed in as \<email\>)
Current display name
First name | Last name
Location : Postal Code / City / Province / Country
*For finding communities near me

CONTACT
Contact email | Verfied badge or Verify Email button
Contact phone | Verfied badge or Verify phone button (Grey out - this is a later feature)
Other Contact Methods (Whatsapp/Signal/Messenger) users can connect (future feature)

SECURITY
Change password
Danger zone (delete my account section)


#### UI Problem: Create an account / Sign in Page needs tweaking

Currently, there is a 'Sign In' and 'Create account' toggle at the bottom of the welcom back box. These however look like buttons rather than a toggle design. Needs to be updated to look like a switch that can slide left/right between each option. The colour also needs to be different from the actual "Sign In" button just above it because it looks identical currently.

As an extra for the create account page, the note under "Display name" could include (optional non-unique display name -- you can change this later or leave it blank). Under the first/last name we can include a note "Some communities require you to identify yourself prior to joining, though it remains optional for registration". Under the "Postal code/City" section, we'll write "This is used to better help you find communities in your area".

---

## Previously Addressed Code Reviews

---
🤖 Runner: Claude /code-reviewer plugin on Sonnet 4.6 Medium Effort
📝 Runtime: `8:50am EST 05.05.2026`
🟢 Resolved by Codex GPT-5.5 Medium Effort

Code Review found 5 issues:

1. Tokens stored in localStorage — XSS risk
Both the access and refresh tokens are written to localStorage. Any injected script can read them.
apps/web/src/lib/auth.ts:47-48, 75 — both setItem("access_token", ...) and setItem("access_token", ...) after refresh. Refresh token is also sent as JSON in the request body (line 58), not as an httpOnly cookie.

2. Vite proxy missing /auth route — broken in Docker
The proxy only maps /api → server:4000. Auth calls go directly to localhost:4001, which resolves on the host but not inside the container network or in any deployed environment.
apps/web/vite.config.ts:18-19:
    ```
    proxy: {
        "/api": "http://server:4000",
        // missing: "/auth": "http://auth:4001"
    },
    ```

3. Register route has no try/catch — unhandled rejections
prisma.user.create() (line 55) and sendVerificationEmail() (line 70) run without any error handling. If the DB write fails or SendGrid throws, Express receives an unhandled rejection. The client gets no response and the request hangs.
apps/auth/routes/auth.ts:55–71 — entire block is unguarded.

4. updateMe passes GraphQL input directly to Prisma — no field whitelist
data: args.input as object sends whatever the client sends straight to prisma.user.update. A user could include emailVerified: true, passwordHash: "...", or any other field in the input and it would be written to the DB.
apps/server/graphql/resolvers/mutation.ts:36:
data: args.input as object,  // no whitelist
Same pattern exists at mutation.ts:81 (updateCommunity) and mutation.ts:219 (updateSubscription).

5. GraphQL client has no 401 → token refresh path
apps/web/src/lib/graphql.ts sends the auth header but doesn't handle a 401/expired-token response. When the access token expires, all GraphQL calls silently fail with no refresh attempt and no re-auth prompt.
---
