Discovery Phase

1. Application Scope & Requirements

- What are the core functionalities of the Commons Fabric application? (e.g., data management, collaboration, APIs, real-time features, etc.)
  - Core functionalities for:
    - Community organizers: hosting a calendar, hosting announcements, hosting a community info page, and hosting a resource repository that's easy to navigate to. These are generally one-to-many communication functions with the exception of responding to comments added by verified community members (cannot be anonymous to interact). Community organizers will also lay out the governance policies for their community. Although 2-way communication will be very limited initially, it's foreseeable that eventually this is a built in feature and so, each community should have the capacity to set up their own governance and moderation abilities as this application will follow a federated model of governance.
    - Community members: viewing and subscribing to communities, syncing calendars to their subscribed calendar, viewing an aggregated announcement feed for their subscribed communities, commenting on existing community initiatives, creating an account or optionally only subscribing their email as a replacement for account creation, RSVP-ing to community events, and finally choosing how they'd like to be informed (ie through email, whatsapp, messenger, signal, etc. and having those functionalities automatically embedded in the application so organizers when they dispatch a message, the user is notified in the appropriate way). User views should be minimalistic but highly customizable to avoid the trap of too much noise.
    - Outsiders: geographic exploration page allowing a view of existing communities which can self-aggregate as one zooms out (if they are of similar themes (ie. small running communities aggregate into a larger city wide running community)), or break into smaller community units if there are multiple organizations representing a common community. Outsiders can subscribe to communities and what aspect of it theyd like to be informed on (events, announcements, both, other). They can also search for communities which the backend will perform tag and similarity matching to present related communities in a gallery view which they can navigate and explore.

- Is this a web application, mobile app, API-first platform, or hybrid?
  - This is a web application, accessed through a browser on computers and on mobile. An app might be considered if it gains users and becomes more socialized. It will NOT be an API-first platform. We are really focusing on the user experience and interface before developing APIs.

- What's the primary purpose—is it a demonstration of capabilities, proof of concept for stakeholders, or a foundation for production?
  - It's a demonstration of capabilities and a foundation for production which with feedback and iteration could be developed into a more complex application for communities to leverage in their growth, activity, and maintenance.

2. Scale & Performance

- What's your expected user base for this PoC? (Dozens? Hundreds? Thousands?)
  - For the PoC we are targeting roughly 30 small non-profit communities centered at a shared community hub which hosts them geographically speaking. This would extend to their members and non-members putting the number of users anywhere from about 30 for testing to hundreds.

- Are there any real-time requirements or latency constraints?
  - Not particularly

- What's your data volume estimate?
  - Very light. Our goal is to keep the data load as light as possible.

3. Team & Expertise

- How many developers will be working on this?
  - 2-3 backend developers, 3-4 UX/UI designers, and 1-2 frontend developers though the backend devs might also be serving as frontend devs thanks to Claude code capabilities.

- What's the team's experience level with cloud platforms (AWS, GCP, Azure, etc.)?
  - primarily with AWS

- Are there specific tech stacks the team is already comfortable with (e.g., Node.js, Python, Go, Java)?
  - None particularly. We can be flexible in our language approach, prioritizing technical feasibility over what we would consider a comfortable language. The goal may one day be to open-source the code, to keep it modular, maintainable, lightweight, and have the data-model and infra-as-code publicly accessible for replication though we will not open source it yet until we know what vulnerabilities the application might have.

- Who will be responsible for deployment and operations?
  - We will be responsible for deployment and operations, though eventually, we would like communities to be able to host it themselves in a distributed fashion. For now however with the PoC, we will deploy using the cheapest possible centralized services and maintain it as we build out the targeted features.

4. Constraints & Infrastructure

- Do you have cloud budget constraints, or is budget flexible for the PoC?
  - We do not have a budget, but the goal is to try and deploy everything for under $200. Vercel, SUpabase, AWS database free tier, are the types of resources we might consider to keep development free through and through.

- Are there any compliance requirements (data residency, security standards)?
  - Not currently. Our goal is to not keep any personal / private information in order to minimize security risks. All data should reside in Canada.

- Does the infrastructure need to be managed by your team or can you rely on managed services?
  - I don't know if I fully understand what constitutes a managed service but we intend to manage it as code, and then through a service if we have specific management needs.

- Do you have existing infrastructure or are you starting fresh?
  - Starting fresh.

5. Timeline & Deliverables

- When do you need a working PoC?
  - Assume a 4 week development timeline
- Is the architecture document needed before implementation or alongside it?
  - Needed before in order to guide the development process, what stack to utilize, and what services to choose. It should help clarify our frontend, backend, database, and hosting.

---

Notification System

- For the PoC, do you need all notification channels (email, WhatsApp, Messenger, Signal) on day one, or should we start with email + one additional channel and architect for extensibility? --> We will start with just 1 notification channel which'll be email. The code however should be developed in a modularized way however so it's easy to add new channels as needed and as instructed by the technology's API documentation.
- Are notifications time-sensitive (real-time alerts) or is eventual delivery (within a few hours) acceptable? --> some should be near-time, but most will not be time-sensitive so within a few minutes or within the hour can be acceptable. Ideally, the user can decide if they want to receive real-time notifications or more like a daily/weekly notification that summarizes their feed. They should be able to pick the frequency and time of reception.

Real-time & Consistency

- For features like comments, RSVPs, and announcement updates—do organizers and members need to see changes immediately, or is eventual consistency (updates within seconds/minutes) acceptable? --> Ideally within a few seconds. I'm not well-versed on the architectural implications for either root.
- This significantly impacts whether we need WebSockets or can use simpler polling/refresh patterns. --> Can you explain these and their significance in development?

Community Organizer Dashboard

- Do community organizers need a customizable dashboard where they can configure their community's appearance, settings, governance rules, and moderation policies through the UI? --> Yes, we want there to be a lot of control if the organizers desire it. Though, this is more of a nice-to-have for the time being and can be built out in smaller features. For the PoC, I think we just want organizers to be able to control who else can be a member, which will issue that member a community specific RBAC badge for the tier of control that is given. We can start with some default tiers with RBACs but later give organizers more control over them. Everything else (appearance/theme, settings, governance, policies) can be done later.
- Or are these configurations handled during initial setup/onboarding only? --> Onboarding should be effortless. We would like to use an AI-api to potentially scrape happenings from the community website to self-populate their information where needed as a way to onboard them easily.

Frontend Framework

- Given you have a strong UX/UI design team, do they have preferences for a framework? (React is most common, but Vue/Svelte are lighter) --> no preference. How does Node.js and Next.js compare to React/Typescript as a framework?
- Should the frontend be a single-page app (SPA) or a more traditional server-rendered approach? --> What is the difference between these? What are the implications of each?

Calendar Integration

- For calendar sync, which platforms do you need to support? (Google Calendar, Outlook, iCal standards, all of the above?) -> I'd like to support all of these. There could be a "download .ics" button, or a full sync ability to connect your calendar.
- Is this a one-way export (community → user's calendar) or bidirectional? --> it's one way, intended to help members stay informed in a simple, minimalistic way. Just the information they need to know what's happening, when, and where.

Data Residency & Infrastructure

- You mentioned data must be in Canada—are you aware of Supabase's region limitations? (They have CA regions, but not all free-tier features are available everywhere) --> Yes, if not we can be flexible with location for the PoC, but for a production ready app will be open to paying as we'd seek funding at that point
- Would you prefer: a managed service (Supabase, RDS), or a more DIY approach with EC2 + manual DB setup? --> We want to have the database schema and model stored as code. Is that something that works on Supabase? Also, GraphQL is something we are considering to use since it's standardized, auto-docs, and allows us to avoid iterating REST APIs tht will likely evolve very frequently. Does that integrate more easily with Supabase or another service? i saw some options previously with express-graphql, hostinger, apollo, AWS graphql apis, etc. It would be good to better understand how these are hosted, and what security measures are involved in requesting data from them (like jwt roles and identities). TO BE EXPLORED

Community Matching/Geographic Features

- How sophisticated should the "self-aggregating communities" algorithm be? (Simple theme-matching, geographic clustering, or ML-based similarity?) --> It should be a weighted combination of geographic clustering and tag similarity matching. For each community, a series of identifying descriptor tags will be generated and stored in the backend based on what knowledge we have of the community. These will be editable by community builders if they wish to populate their own. The semantic/theme, geographic information, as well as SIZE of the community will all play a role in knowing what to aggregate or not. These groups are really just for convenience sake as users explore a certain theme on the map and zoom in / out. I think these similarity based measures will be used to auto-generate parent "community hubs" or "implied communities" at different pre-determined scales. These scale levels will be used to generate a hierarchical agglomeration of what exists and stored in an Adjacency List for later reference due to its simplicity and ease of implementation. If we have algorithms optimized enough to do this on the fly in the frontend by non-deterministically organizing information on the front end, then we only need to store the "implied communities" that users choose to keep and subscribe to. TO be explored as a later "nice-to-have" feature but not something to include in the PoC.

Monitoring & Observability

- For a PoC, do you need logging, error tracking, and monitoring from the start, or is basic app logging sufficient? --> Logging would be excellent as it'll allow us to debug issues and create transparency in the app processes. How this is done will depend on the language and services chosen, but yes logging, some form of error tracking, and monitoring will be useful to have from the start, or at least a module for stremlining these processes.

---

Remaining Clarifications Before I Draft the Architecture:

Monorepo vs Separate Repos? --> Single Next.js repo (frontend + backend together). Does this come with an option to also use Node/Python/Go in the backend? Is it possible to later created a new backend-services repo that uses these if we needed an additional layer of backend services?

Authentication Scope --> No account is required for unidentified users to browse, explore. Only an email is required if they'd like to subscribe via email directly. Otherwise, to interact with matter like subscribing, RSVPing, commenting, etc they need a basic email and password for login. THey should be able to sign in using another social like Google and Github. Later we can implement additional socials if desired. Any account which is created will require email verification, otherwise info will be deleted after some amount of time. Maybe this could be stored in a tentative_user table which lifespan on each row added -> deleted automatically if no action after x amount of time, deleted automatically if email becomes registered in the official user table.

Community Matching Algorithm --> Hard to know if this should be pre-computed or run in batches once per day. I think we'll need to do more research to know what's most efficient, requires the least maintenance, least code, and that's cheapest. The feature has not been fully defined so we can do some preliminary research on how it's been implemented elsewhere and then put this on the nice-to-have backlog

File/Resource Repository --> I don't expect organizers to upload any files so we won't consider file-storage a feature yet. They'll be encouraged to provide links instead which guide users to their source of information (ie. their website, etc.)

-
