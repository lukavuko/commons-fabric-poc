# Feature Documentation





## Guiding Assumptions





## The Value Proposition

*What does our web-app intend to solve?*

##### a. Community Stewards

##### b. Community Members

##### c. Community Non-Members



## The User Experience

There are 3 types of users this app intends to serve in some way: stewards, members, and non-members.

This means each will have a slightly different usage pattern. This usage pattern will generate the first raw set of functions we intend to develop. From that chain of user journey events, we'll model a particular set of pages that need to be implemented and all the different views a particular page may accommodate.

Starting with the simplest of all three user types:

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

> I .

---

1. L





### 3. The Steward Journey

---

> I don't have an account. My friend told me to check out this app for getting connected to my community. I just moved here and I'm new and hoping to develop a stronger sense of connection to those around me, though I'm not sure where to start.

---

1. L



## Pages & Client-Side Functions

- Welcome Page
- Account Creation page/popup?
- Exploration Page 
  - Geographic View
  - Gallery View
  - Community Popup View
- Info Feed
  - Organization
  - Tag Filters
- Calendar page
  - Organization
  - **Functions**
- Personal Settings





## Additional Features of Interest (Server Side)

- **AI Automation and Integration** 
  - AI Agent Community Scraper Pipeline for Onboarding new groups
  - Automated Community to Hub Aggregation 
  - Automated Discover of implied Communities

- **Verification Processes**
  - How do we verify genuine:
    - community steward accounts
    - created communities
    - "adopted" communities (from those that have yet to be "claimed")
    - created community hubs
    - "adopted" community hubs
    - individual users

- **Logistical and Functional Opportunities**
  - Registered Hub resource list that allows cub-communities to collaborate and use tools more effectively

- **Building Micro Connections**
  - Optional community visibility of member lists
  - Optional community visibility of members with similar interests
  - Optional personal profile photo
  - Mediated invitations to connect so email and other information can be mutually shared




## Revenue Streams

For those seeking additional non-open sourced features, there are a few additional services that our platform offers.

- External community verification services - community can rely on outsourced solutions (regional platform stewards/3rd part services) for verification
- Centralized hosting subscriptions - community does not need to establish its own software hosting solution
- Community promotion via monetary legitimization - community takes precedence in the explore feed for member discovery
- Community sponsorship streamlining - allows communities to more easily obtain income from sponsors by directly featuring them on their page



## Styling

