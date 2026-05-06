import { gql } from "graphql-tag";

export const typeDefs = gql`
  scalar DateTime

  # -------------------------------------------------------
  # Enums
  # -------------------------------------------------------

  enum RoleEntityType {
    HUB
    COMMUNITY
  }
  enum CommentEntityType {
    ANNOUNCEMENT
    EVENT
  }
  enum HubType {
    REGISTERED
    AGGLOMERATE
  }
  enum ReleaseStatus {
    DRAFT
    PENDING
    HIDDEN
    PUBLIC
    ARCHIVED
  }
  enum EventType {
    SOCIAL
    INFORMATIONAL
  }
  enum RecurrenceSchedule {
    DAILY
    WEEKLY
    BIWEEKLY
    MONTHLY
    ANNUAL
  }
  enum Day {
    MON
    TUE
    WED
    THU
    FRI
    SAT
    SUN
  }
  enum CommentStatus {
    PENDING
    APPROVED
    REJECTED
    HIDDEN
    LOCKED
  }
  enum CommunicationFrequency {
    NEVER
    REALTIME
    DAILY
    WEEKLY
    BIWEEKLY
    MONTHLY
  }
  enum CommunicationMethod {
    EMAIL
    SMS
  }
  enum RSVPStatus {
    GOING
    INTERESTED
    NOT_GOING
  }
  enum CommunityScope {
    PUBLIC
    SUBSCRIBER
    MEMBER
    STEWARD
  }

  # -------------------------------------------------------
  # Types
  # -------------------------------------------------------

  type User {
    id: ID!
    displayName: String
    email: String!
    phone: String
    firstname: String
    lastname: String
    postalCode: String
    city: String
    emailVerifiedAt: DateTime
    phoneVerifiedAt: DateTime
    createdAt: DateTime!
    lastloginAt: DateTime
    subscriptions: [UserSubscription!]!
    userRoles: [UserRole!]!
  }

  type Hub {
    id: ID!
    type: HubType!
    name: String!
    description: String!
    address: String
    latitude: Float
    longitude: Float
    createdAt: DateTime!
    updatedAt: DateTime!
    communities: [Community!]!
  }

  type Community {
    id: ID!
    name: String!
    website: String
    description: String!
    tags: [String!]!
    contactFirstname: String!
    contactLastname: String!
    contactEmail: String!
    contactNumber: String
    address: String!
    city: String!
    province: String!
    postalCode: String
    country: String!
    verifiedEmail: Boolean!
    verifiedExternally: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    events(upcoming: Boolean): [Event!]!
    announcements: [Announcement!]!
    subscriberCount: Int!
  }

  type Event {
    id: ID!
    community: Community!
    creator: User
    announcement: Announcement
    releaseStatus: ReleaseStatus!
    eventType: EventType
    title: String!
    subtitle: String
    description: String
    links: [String!]!
    tags: [String!]!
    location: String
    startsAt: DateTime
    endsAt: DateTime
    icalUrl: String
    recurring: RecurrenceSchedule
    recurringDow: [Day!]!
    createdAt: DateTime!
    releasedAt: DateTime
    rsvpCount: Int!
    myRsvp: RSVPStatus
  }

  type Announcement {
    id: ID!
    community: Community!
    author: User
    releaseStatus: ReleaseStatus!
    title: String!
    subtitle: String
    description: String
    tags: [String!]!
    createdAt: DateTime!
    releasedAt: DateTime
    likes: Int
    views: Int
  }

  type Comment {
    id: ID!
    author: User
    commentStatus: CommentStatus!
    content: String!
    ts: DateTime!
    tsEdited: DateTime
    parentEntityType: CommentEntityType!
    parentEntityId: ID!
    parentComment: Comment
    replies: [Comment!]!
  }

  # Named UserSubscription to avoid conflict with GraphQL Subscription operation type
  type UserSubscription {
    id: ID!
    community: Community!
    isActive: Boolean!
    tsSubscribed: DateTime!
    tsUnsubscribed: DateTime
    calendarFreq: CommunicationFrequency
    calendarPreferredTime: String
    calendarChannels: [CommunicationMethod!]!
    announcementFreq: CommunicationFrequency
    announcementPreferredTime: String
    announcementChannels: [CommunicationMethod!]!
  }

  type UserEvent {
    id: ID!
    event: Event!
    rsvpStatus: RSVPStatus!
  }

  type UserRole {
    userId: ID!
    entityType: RoleEntityType!
    entityId: ID!
    role: Role!
  }

  type Role {
    id: ID!
    name: String!
    description: String
    isDefault: Boolean!
  }

  type Permission {
    id: ID!
    name: String!
    description: String
  }

  type Feed {
    upcomingEvents: [Event!]!
    recentAnnouncements: [Announcement!]!
  }

  type AuthPayload {
    user: User!
    token: String!
  }

  type CommunityAccess {
    scope: CommunityScope!
    isSubscribed: Boolean!
    roleName: String
  }

  # -------------------------------------------------------
  # Inputs
  # -------------------------------------------------------

  input UpdateUserInput {
    firstname: String
    lastname: String
    phone: String
    displayName: String
    postalCode: String
    city: String
  }

  input CommunityFilter {
    city: String
    province: String
    tags: [String!]
    verifiedOnly: Boolean
  }

  input Pagination {
    limit: Int
    offset: Int
  }

  input CreateCommunityInput {
    name: String!
    website: String
    description: String!
    tags: [String!]!
    contactFirstname: String!
    contactLastname: String!
    contactEmail: String!
    contactNumber: String
    address: String!
    city: String!
    province: String!
    postalCode: String
    country: String!
  }

  input UpdateCommunityInput {
    name: String
    website: String
    description: String
    tags: [String!]
    contactFirstname: String
    contactLastname: String
    contactEmail: String
    contactNumber: String
    address: String
    city: String
    province: String
    postalCode: String
    country: String
  }

  input CreateEventInput {
    communityId: ID!
    title: String!
    subtitle: String
    description: String
    eventType: EventType
    links: [String!]
    tags: [String!]
    location: String
    startsAt: DateTime
    endsAt: DateTime
    recurring: RecurrenceSchedule
    recurringDow: [Day!]
  }

  input UpdateEventInput {
    title: String
    subtitle: String
    description: String
    eventType: EventType
    links: [String!]
    tags: [String!]
    location: String
    startsAt: DateTime
    endsAt: DateTime
    recurring: RecurrenceSchedule
    recurringDow: [Day!]
    releaseStatus: ReleaseStatus
  }

  input CreateAnnouncementInput {
    communityId: ID!
    title: String!
    subtitle: String
    description: String
    tags: [String!]
  }

  input PostCommentInput {
    parentEntityType: CommentEntityType!
    parentEntityId: ID!
    communityId: ID!
    content: String!
    parentCommentId: ID
  }

  input UpdateSubscriptionInput {
    calendarFreq: CommunicationFrequency
    calendarPreferredTime: String
    calendarChannels: [CommunicationMethod!]
    announcementFreq: CommunicationFrequency
    announcementPreferredTime: String
    announcementChannels: [CommunicationMethod!]
  }

  # -------------------------------------------------------
  # Operations
  # -------------------------------------------------------

  type Query {
    me: User
    communities(filter: CommunityFilter, pagination: Pagination): [Community!]!
    community(id: ID!): Community
    searchCommunities(query: String!, limit: Int): [Community!]!
    hubs: [Hub!]!
    hub(id: ID!): Hub
    events(communityId: ID, fromDate: DateTime, toDate: DateTime): [Event!]!
    event(id: ID!): Event
    announcements(communityId: ID!): [Announcement!]!
    announcement(id: ID!): Announcement
    comments(
      parentEntityType: CommentEntityType!
      parentEntityId: ID!
    ): [Comment!]!
    myFeed: Feed!
    mySubscriptions: [UserSubscription!]!
    communityAccess(communityId: ID!): CommunityAccess!
    """
    Returns the resolved permission names the current user holds for a given
    entity (community or hub). Falls back to the ANYONE implicit set when the
    user has no UserRole for the entity. Returns [] when unauthenticated.
    """
    myCalendar(fromDate: DateTime, toDate: DateTime): [Event!]!
    myPermissions(entityId: ID!, entityType: RoleEntityType!): [String!]!
  }

  type Mutation {
    signUp(email: String!, password: String!): AuthPayload!
    signIn(email: String!, password: String!): AuthPayload!
    signOut: Boolean!

    updateMe(input: UpdateUserInput!): User!
    deleteMe: Boolean!

    createCommunity(input: CreateCommunityInput!): Community!
    updateCommunity(id: ID!, input: UpdateCommunityInput!): Community!
    deleteCommunity(id: ID!): Boolean!

    createEvent(input: CreateEventInput!): Event!
    updateEvent(id: ID!, input: UpdateEventInput!): Event!
    deleteEvent(id: ID!): Boolean!
    publishEvent(id: ID!): Event!

    createAnnouncement(input: CreateAnnouncementInput!): Announcement!
    publishAnnouncement(id: ID!): Announcement!

    subscribeToCommunity(
      communityId: ID!
      input: UpdateSubscriptionInput
    ): UserSubscription!
    unsubscribeFromCommunity(communityId: ID!): Boolean!
    updateSubscription(
      communityId: ID!
      input: UpdateSubscriptionInput!
    ): UserSubscription!

    rsvpToEvent(eventId: ID!, status: RSVPStatus!): UserEvent!
    cancelRsvp(eventId: ID!): Boolean!

    postComment(input: PostCommentInput!): Comment!
    moderateComment(id: ID!, status: CommentStatus!): Comment!
  }
`;
