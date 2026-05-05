# Development Philosophy

## 1. The Database is the Ground Truth
The database is the absolute authority on the state of the application. The frontend and intermediate logic layers are mere reflections of this truth.
* **Direct Sourcing:** Avoid hardcoding permissions or assumptions about user states (subscriptions, roles, etc.) in the frontend. Always fetch current authorization data directly from the source of truth.
* **No Loose Ends:** When modifying user data, every implication must be accounted for. Transactions must be atomic; a change in the user's role or status is only "real" once it is successfully committed to the database.
* **Sync over Assumption:** Never assume a frontend state is valid without a backend handshake. If the database says a user is expired, the UI must immediately reflect that, regardless of local state.

## 2. Ruthless Minimalist Engineering
Complexity is a cost, not an asset. Every line of code and every dependency must justify its existence.
* **Avoid Bloat:** Prioritize native functionality over external libraries. If a problem can be solved with clean, standard code, do not add a package.
* **Slim Architecture:** Maintain a "just enough" approach. Build for the current requirement with enough flexibility for the future, but avoid over-engineering for hypothetical scenarios.
* **Readable Logic:** Code should be self-documenting through clarity. Succinct logic is easier to audit, debug, and maintain over the long term.

## 3. Logical Transparency & Integrity

Build systems that are predictable and robust.
* **Defensive Design:** Anticipate failure points. Handle edge cases at the logic level to ensure the database remains untainted by partial or corrupt data.
* **Separation of Concerns:** Keep business logic distinct from presentation. This ensures that the "source of truth" remains isolated and protected from UI-related bugs.
* **Outcome-Focused Development:** Every feature should serve a direct, verifiable purpose. If a feature adds more noise than value, it should be removed rather than refined.
