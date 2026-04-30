# Feature Documentation

## The Value Proposition

*What does our web-app intend to solve?*

<u>a. For Community Stewards</u>

- Easily communicate across a fragmented communication landscape 
- Increase localized community discovery 
- Flexible governance and autonomy

<u>b. For Community Members</u>

- Simplify the member engagement process with a focus is on calendar and in person event/activity planning
- Autonomy over notification system of choice for subscribed and member communities
- Easy to use interface, free of ads, for staying locally informed

<u>c. Community Non-Members</u>

- A new way to explore for community groups
- A simple and easy way to host your own community

## The User Experience

There are 3 types of users this app intends to serve in some way: stewards, members, and non-members.

This means each will have a slightly different usage pattern. This usage pattern will generate the first raw set of functions we intend to develop. From that chain of user journey events, we'll model a particular set of pages that need to be implemented and all the different views a particular page may accommodate. Starting with the simplest of all three user types, the non-member.

### 1. The Non-Member Journey

---

> I don't have an account. My friend told me to check out this app for getting connected to my community. I just moved here and I'm new and hoping to develop a stronger sense of connection to those around me, though I'm not sure where to start.

---

1. Land on a welcome page that introduces the web-app and what it can be used for.
2. Provide an option to create an account for full features or to simply move on to the explore page.
3. Skip account creation and proceed to the **explore page** OR creates an account using basic email and city/postal code information and then proceed to the **explore page.**
4. View a map of the city and an array of unique pins representing registered and known communities.
   - Option to look for communities via a search function
   - Option to filter communities by list of TAGs
   - Option to filter communities by estimated size
   - Option to filter communities by particular region (circle radius - close to me)
   - Option to drag around on the map/zoom in/zoom out
5. As they come across a community they like, they click on the pin which queries that communities information.
6. A **community popup expands** to reveal basic community information. The user can either close the popup if it's not what they were looking for, or continue reading by visit the **complete community page** linked within the popup.
7. On the community page they can read more about the description, events, announcements, happenings that the community organizes, as well as their website links/social media pages, and wiki links.
8. If the user would like to stay informed, they can either "**subscribe**" or "**join**" which provide slightly different functions. Subscriptions are merely observant and do not provide a means to interact within the community (only keep users informed). Joining a community automatically subscribes you, but is also a little more committing and may require additional information from the user (like their name for instance) so the community can be protected from bad actors in case it requires that type of governance. Users who join and are approved or auto-approved can additionally **RSVP** and **Comment** on events and announcements created by the community and/or other community members. These subtle settings (subscribe/join) are saved as a **community-role-tag**  and are how users are provisioned the correct **role-based access controls** for interacting with communities.
9. Regardless of whether you join or subscribe, these community events will automatically populate your **calendar** and their community **announcements** will automatically populate your feed. At this point, the user can decide:
   - What **events** they'd like to keep in their calendar (filter by tag/type)
   - What **announcements** they'd like to keep in their feed (filter by tag/type)
   - What **method** of communication they'd like to receive (email, sms, web-app only, messenger, whatsapp, signal, etc. (api dependent))
   - What **frequency** of communication they'd like to receive (realtime, daily, weekly, biweekly, monthly, annual, never)
   - To automatically **download calendar events** or entirely **sync their personal calendar** to the one they've subscribed to.
10. Now, they can conveniently stay informed in a way that respects their autonomy while also being able to review relevant information on their **info-feed page** or their **calendar page** as a subscriber or member.

### 2. The Member Journey

---

> I've been a part of my local neighborhood community for months but the website is dead and the only way we get updates on local events are through printed pamphlets that the councilor has to go around and stick onto everyone's doors. Recently, a steward started a community group on Commons Fabric and set things up for members like myself to follow. 

---

1. I created an account and went to the explore page to try and find my neighbourhood. I was able to look it up with a search bar but I could also drag the map around to find the pin based on my current location.
2. I opened the community popup to make sure it was the right onw, and proceeded to request to join the group. I was prompted by my steward to answer some questions after the "request to join" where I provide some information about myself for them to validate. 
3. Upon entry (auto-approved or manually after a few days), I receive a member badge for being a part of my neighbourhood. I can now see all the events that are posted to the calendar as well as any announcements and any discussion threads taking place in the announcement forum. 
4. I can RSVP to events by clicking on the them in the calendar, on the calendar page, and also comment on them in case I need something clarified. 
5. I often forget to check the website so I opt to receive a monthly email and SMS text message on the happenings associated with the community group, like requests for volunteers or city hall meetings, and so forth. 
6. I like that the interface is simple, I can see other members, and can even see what roles they have (ie. volunteer member, co-steward, moderator, steward) who take on somewhat more responsibility to help make my community's activities become a reality.

### 3. The Steward Journey

---

> I run a non-profit community food bank at a hub that hosts dozens of other organizations that help the neighbouring areas. Our community hub website is bottle-necked because all our event requests have to go through one person in order to add them to the public calendar. This is annoying and feels like we aren't ultimately in control of how we propagate information and news regarding our activities. Not to mention, other communities feel the same so I barely know what's going on with them and if there is overlap in our memberships and activities that we might benefit from partnering when organizing them.

---

1. I create an account and find the community hub on the explore page.
1. Since I don't see my community registered yet, I go ahead and request to create a new community.
1. I fill in a bunch of information related to it, such as the name, the website link, a description, some tags, the community's contact information (I can either fill it out manually or check a checkbox that says "I am the main contact for this community", in which case all that information is pre-filled), the address, the city, maybe an image, and so forth. 
1. One thing required to ensure integrity, is the requirement to use a community contact email that has the same domain as the website it's hosted on. This way, only people who have access to the community email inbox can actually verify the creation and adoption of a new community group.
1. I then get presented a settings page on how I'd like to govern the community. This includes a section on membership requirements which can be custom questions related to why a person wants to join, if they are a member of the neighbouring areas, their name (users can be anonymous so for my community I want to ensure that only users who have chosen to share their name are permitted to join), and also what permissions are associated with each special "badge" a community member can have (volunteer, moderator, co-steward).
1. Once created, the group creation request is automatically and conditionally approved, but manual review will still take place within a day or two to ensure it's not spam or anything like that. Once it passes manual verification, and I verify my email as well as the community's email contact, I will see a verified badge appear on the community page.
1. I start by creating an event in our calendar to share a kickoff social 2 weeks from now. I fill in the event's information and click on a checkbox that allows me to post the event as an announcement. This will also create a post for it on the announcement page. In addition, I select all communication channels for dissemination (email, SMS, whatsapp, messenger, signal) and select the real-time publish button. This ensures that the notification is sent in real-time to all users who are subscribed and have notifications turned on for my community group. For users who have opted for a weekly/biweekly/monthly notification protocol, this announcement will sit in their "notification queue" until the cycle time is reached, then they will be notified. 
1. In the following days I see some members are RSVPing to the social event, some new subscribers are requesting to join to become members, and one member has asked for some clarifying information on the event page which I'll respond to to clarify.

## Pages, Features, Functions, Phases

Phase 1 is targeted for stewards only, testing and debugging, and all user-role permissions will be preset. Phase 2 will expand on the user functionality, add an additional page (settings and dashboard) and connect new endpoints and backend logic to help make the app work better. Phase 3 will be the final PoC phase and will establish the final two pages for exploration (geographic) and community announcements page seen on a specific community page.

| Phase | Page                          | Features                                                     |
| ----- | ----------------------------- | ------------------------------------------------------------ |
| 1     | Welcome                       | Brief introduction to how to use the website, what it's for  |
| 1     | Login                         | Your everyday login page                                     |
| 1     | Sign Up                       | Your everyday sign up page                                   |
| 1     | Exploration (Gallery)         | Search Bar - Tag Filtering - Gallery View - Sort by (alphabetical, most/least members) - Filter by Verified Only - |
| 3     | Exploration (Geographic)      | Map centered on current location (ask for permission) - Map pins coloured by community type - Map pins sized by community size - Map pins are star shaped if you're a part of them - Map pins aggregated into hubs as you zoom out - Clickable pins to open a popup - Tag filtering - Verified Only filtering - Search bar filtering |
| 1     | Exploration Popup Views       | Clickable pin opens a brief information popup - Community Image, Name, Address, Description, Website link, Wiki link, Contact info, Member count, Announcement Page Link, Calendar Page Link, Subscribe button, Join button |
| 1     | Community Home Page           | Notification Preferences (schedule & method on the right hand side) - Your status with the community (Nothing/Subscriber/Member/Volunteer/Moderator/Co-steward/Steward) |
| 1     | Community Calendar            | Calendar page with only the current community's events - Ability to RSVP to events if you are a member - Ability to comment and interact with the calendar module as if it was the personal calendar, except you can only create events if you have a steward badge (you run the community) |
| 2     | Hub Calendar                  | Calendar page viewable by Hub-Comm Stewards - Hub Stewards can sync it to an existing Calendar hosted elsewhere (ie. Wordpress, Google, Microsoft, etc.) |
| 3     | Community Announcements/Forum | An information feed of a given community's latest announcements, sorted chronologically with the ability to pin certain announcements to the top - Clicking on an announcement opens a preview popup where all the information is displayed - The Preview Popup also has a save to my mail button which allows a user to email themselves the announcement to save it for later if they don't want to navigate through the website again - Announcements are automatically archived after 30 days or after an associated event has passed |
| 2     | Personal Dashboard            | My Subscriptions, Communities, & Badges - Information Feed - Tag Filtering - Community Filtering - Announcement Popup |
| 1     | Personal Calendar             | Tag Filtering - Community Filtering - RSVPing - Event Popup  |
| 2     | Personal Settings             | Account Settings - TBD                                       |



##  Feature Roadmap

| Feature                                     | Status     | Notes                                 |
| ------------------------------------------- | ---------- | ------------------------------------- |
| React + Vite + Prisma + Apollo Server setup | ✅ Done     |                                       |
| Database schema + migrations                | ✅ Done     |                                       |
| GraphQL resolvers (basic)                   | ✅ Done     |                                       |
| User authentication (email + OAuth)         | ⬜ Todo     | Supabase Auth                         |
| Community CRUD (organizer)                  | ⬜ Todo     |                                       |
| Event creation and display                  | ⬜ Todo     |                                       |
| RSVP mutations                              | ⬜ Todo     |                                       |
| Community browser (map + search)            | ⬜ Todo     |                                       |
| Event calendar view                         | ⬜ Todo     |                                       |
| Subscriptions + notification preferences    | ⬜ Todo     |                                       |
| Comment system                              | ⬜ Todo     | Creation + moderation status          |
| Email digest job                            | ⬜ Todo     | Sendgrid + scheduled backend job      |
| Organizer dashboard                         | ⬜ Todo     | Member management, community settings |
| .ics calendar export                        | ⬜ Todo     | Per-event download                    |
| "Add to calendar" deep links                | ⬜ Todo     | Google + Outlook                      |
| Tag filtering + search                      | ⬜ Todo     |                                       |
| Responsive mobile design                    | ⬜ Todo     |                                       |
| Unverified user cleanup job                 | ⬜ Todo     | Scheduled backend job, 30-day TTL     |
| Row-Level Security (RLS) policies           | ⬜ Deferred | Post-PoC hardening                    |
| Full calendar sync (Google/Outlook API)     | ⬜ Deferred | Post-PoC                              |
| Additional notification channels            | ⬜ Deferred | SMS, WhatsApp, etc.                   |



## Server-side Aspirations

**Community Matching Algorithm**

This feature is deferred until after the PoC is validated. The intent is to surface geographic and thematic groupings of communities on the map — so that as a user zooms out, related communities aggregate visually into implied "community hubs."

- Geographic clustering using K-means on community coordinates
- Tag similarity using cosine similarity on normalized tag vectors
- A weighted score: `match_score = 0.6 × geographic + 0.4 × tag_similarity`
- Hierarchical groupings stored in an adjacency list table for efficient querying

**AI Automation and Integration** 

- AI Agent Community Scraper Pipeline for Onboarding new groups
- Automated Community to Hub Aggregation 
- Automated Discover of implied Communities

**Verification Processes**

- How do we verify genuine:
  - community steward accounts
  - created communities
  - "adopted" communities (from those that have yet to be "claimed")
  - created community hubs
  - "adopted" community hubs
  - individual users

**Logistical and Functional Opportunities**

- Registered Hub resource list that allows cub-communities to collaborate and use tools more effectively

**Building Micro Connections**

- Optional community visibility of member lists
- Optional community visibility of members with similar interests
- Optional personal profile photo
- Mediated invitations to connect so email and other information can be mutually shared




## Funding Streams

For those seeking additional non-open sourced features, there are a few additional services that our platform offers.

- Centralized hosting subscriptions - community does not need to establish its own software hosting solution
- Community promotion via monetary legitimization - a community can take precedence in the explore feed for better member discovery
- Community sponsorship streamlining - allows communities to more easily obtain income from sponsors by directly featuring them on their page. We host the display layout where logos and sponsors are affixed, we allow the sponsorship to purchase plots directly through the website, and the community to directly get paid. We collect a small fee for the service.
