export type Role = 'admin' | 'member';

export type Relationship = 
  | 'Primary Host'
  | 'Mom'
  | 'Dad'
  | 'Son'
  | 'Daughter'
  | 'Grandparent'
  | 'Sibling'
  | 'Spouse'
  | 'Relative';

export type MoodType = 
  | 'joyful' 
  | 'peaceful' 
  | 'busy' 
  | 'stressed' 
  | 'missing-home' 
  | 'excited' 
  | 'cooking' 
  | 'casual';

export type LiveStatusType = 
  | 'happy' 
  | 'busy' 
  | 'tired' 
  | 'sick' 
  | 'traveling' 
  | 'cooking';

export interface LiveStatus {
  status: LiveStatusType;
  label: string;
  emoji: string;
  updatedAt: string;
  customNote?: string;
}

export interface MemberLocation {
  lat: number;
  lng: number;
  distanceKm: number;
  isInsideGeofence: boolean; // within 5km radius
  etaMinutes: number;
  locationName: string;
  lastUpdated: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  phone: string;
  role: Role;
  relationship: Relationship;
  avatar: string;
  joinedAt: string;
  isOnline: boolean;
  lastActive: string;
  liveStatus?: LiveStatus;
  location?: MemberLocation;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  avatar?: string;
  notes?: string;
  preferredLanguage?: 'Telugu' | 'Hindi' | 'English';
  lastCalled?: string;
  folder?: string;
}

export interface QuickReplyTemplate {
  id: string;
  title: string;
  message: string;
  icon: string;
  category?: 'meeting' | 'driving' | 'clinic' | 'cooking' | 'busy' | 'custom';
}

export interface RecurrenceConfig {
  frequency: 'hourly' | 'daily' | 'weekly' | 'custom';
  intervalValue: number; // e.g. 2, 4, 8, 12, 1, 3
  intervalUnit: 'hours' | 'days' | 'weeks';
  daysOfWeek?: string[]; // e.g. ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  endDate?: string; // ISO date string
  maxRuns?: number;
  runCount: number;
}

export type CallPriority = 'low' | 'medium' | 'high' | 'critical';

export interface ScheduledCall {
  id: string;
  contactId?: string;
  contactName: string;
  contactPhone: string;
  scheduledTime: string; // ISO string
  reminderNote: string;
  promptGoal: string;
  status: 'pending' | 'triggered' | 'completed' | 'cancelled';
  createdAt: string;
  createdByName: string;
  priority?: CallPriority;
  isRecurring?: boolean;
  recurrence?: RecurrenceConfig;
  nextRunTime?: string;
  active?: boolean;
  lastTriggeredAt?: string;
}

export interface GeofenceAlert {
  id: string;
  memberId: string;
  memberName: string;
  avatar: string;
  type: 'entered_5km' | 'left_5km' | 'arrived_home';
  distanceKm: number;
  etaMinutes: number;
  timestamp: string;
  message: string;
}

export interface SosAlert {
  id: string;
  senderId: string;
  senderName: string;
  senderPhone: string;
  senderAvatar: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  locationName: string;
  status: 'active' | 'resolved';
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface FamilyPodcastEpisode {
  id: string;
  title: string;
  date: string;
  durationSeconds: number;
  audioUrl: string;
  script: string;
  summary: string;
  topicsCovered: string[];
  generatedAt: string;
}

export interface ConspiratorChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  assignedToName: string;
}

export interface ConspiratorMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
}

export interface ConspiratorPlan {
  id: string;
  title: string;
  targetMemberId: string; // Excluded person
  targetMemberName: string;
  occasionDate: string;
  budget?: string;
  checklist: ConspiratorChecklistItem[];
  messages: ConspiratorMessage[];
  pinCode: string;
}

export interface TranscriptEntry {
  id: string;
  speaker: 'assistant' | 'caller' | 'system';
  text: string;
  timestamp: string;
  isUrgentKeyword?: boolean;
}

export type CallTranscript = TranscriptEntry;

export type CallPriorityTag = 'urgent' | 'routine' | 'personal' | 'follow-up';

export interface CallSession {
  id: string;
  direction: 'inbound' | 'outbound';
  callerName: string;
  callerNumber: string;
  targetUserName: string;
  status: 'ringing' | 'in-progress' | 'urgent-forwarded' | 'completed' | 'voicemail' | 'pending' | 'scheduled';
  startTime: string;
  durationSeconds: number;
  isUrgent: boolean;
  urgencyReason?: string;
  forwardedToNumber?: string;
  forwardedAt?: string;
  audioUrl?: string;
  transcripts?: TranscriptEntry[];
  summary?: string;
  telephonyProvider: 'twilio' | 'retell' | 'vapi' | 'deepgram' | 'web-sim';
  personalNote?: string;
  personalNoteUpdatedAt?: string;
  priorityTag?: CallPriorityTag;
  priorityTagUpdatedAt?: string;
  priorityLevel?: string;
  priority?: string;
}

export interface NoteComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
}

export interface FamilyMoodNote {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  authorRelationship: Relationship;
  authorAvatar: string;
  content: string;
  mood: MoodType;
  imageUrl?: string;
  audioSnippetUrl?: string;
  audioDuration?: number;
  createdAt: string;
  reactions: Record<string, string[]>; // emoji -> array of userIds
  comments: NoteComment[];
  isPinned?: boolean;
  pinnedAt?: string;
  pinnedBy?: string;
}

export interface InviteToken {
  id?: string;
  token: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  expiresAt: string;
  usedCount: number;
  maxUses: number;
  defaultRole: Role;
  url: string;
}

export interface AppSettings {
  familyName: string;
  virtualPhoneNumber: string;
  primaryForwardPhone: string;
  primaryHostName: string;
  greetingTemplate: string;
  urgencyKeywords: string[];
  forwardingEnabled: boolean;
  recordingEnabled: boolean;
  deepgramEnabled: boolean;
  twilioConfigured: boolean;
  retellConfigured?: boolean;
  retellAgentId?: string;
}

export interface UserAuthSession {
  phoneNumber: string;
  isVerified: boolean;
  userCode: string;
  name: string;
  avatar: string;
  pinLockEnabled: boolean;
  pinCode: string;
  isLocked: boolean;
}

export type ChatMessageType = 
  | 'text' 
  | 'voice' 
  | 'image' 
  | 'sticker' 
  | 'ai_call_summary' 
  | 'upi_request' 
  | 'upi_paid' 
  | 'system';

export interface AiCallDetailPayload {
  targetName: string;
  targetPhone: string;
  promptInstruction: string;
  introSpoken: string;
  targetVoiceResponse: string;
  targetAudioUrl: string;
  callTimestamp: string;
  callerIdUsed: string;
  status: 'connecting' | 'connected' | 'completed' | 'failed';
}

export interface UpiDetailPayload {
  amount: number;
  purpose: string;
  status: 'requested' | 'approved';
  transactionId?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface StoryNote {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorCode: string;
  note: string;
  emoji: string;
  location?: string;
  createdAt: string;
  expiresAt: string;
  targetAudience?: 'family' | 'connectors' | 'all';
  isGhost?: boolean;
  viewers?: string[];
}

export interface Connector {
  id: string;
  userCode: string;
  name: string;
  phone: string;
  avatar: string;
  relationship: string;
  connectedAt: string;
  status: 'active' | 'pending';
  category?: 'general' | 'private' | 'requests';
  bio?: string;
  vibeMatch?: number;
  vibeHighlights?: string[];
  lastSeen?: string;
  recentStatusNote?: string;
  unreadCount?: number;
  lastMessage?: string;
  lastMessageTime?: string;
  mutualCount?: number;
  streakCount?: number;
  streakExpiresAt?: string;
  isStreakExpiring?: boolean;
}

export interface VoiceRoomParticipant {
  id: string;
  name: string;
  avatar: string;
  isMuted: boolean;
  isSpeaking: boolean;
  role: 'host' | 'participant';
}

export interface VoiceRoomSession {
  id: string;
  roomId: string;
  roomType: 'family' | 'connectors';
  title: string;
  startedAt: string;
  activeCount: number;
  participants: VoiceRoomParticipant[];
}

export interface ChatMessage {
  id: string;
  roomId: string; // 'family-main' or 'connector-xxxx'
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  type: ChatMessageType;
  isPrivate?: boolean;
  privateForUserCode?: string;
  privateAddedAt?: string;
  voiceUrl?: string;
  voiceDuration?: number;
  imageUrl?: string;
  stickerEmoji?: string;
  reactions?: Record<string, string[]>; // emoji -> array of userCodes who reacted
  aiCallDetails?: AiCallDetailPayload;
  upiDetails?: UpiDetailPayload;
  createdAt: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  isEncrypted: boolean;
}

export interface CloseFriend {
  id: string;
  name: string;
  userCode: string; // e.g. GK-8823
  phone: string;
  avatar: string;
  relationship: string;
  unreadCount: number;
  lastMessage?: string;
  lastMessageTime?: string;
  status: 'online' | 'offline' | 'away';
}

export interface SocialComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  createdAt: string;
}

export interface SocialPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorCode: string;
  locationTag: string;
  photoUrl: string;
  note: string;
  quote: string;
  streakCount: number;
  createdAt: string;
  targetAudience?: 'family' | 'connectors' | 'all';
  likes: string[]; // member IDs
  reactions: Record<string, number>; // emoji -> count
  comments: SocialComment[];
  isViewOnce?: boolean; // Snapchat-style view-once disappearing streak
  viewDurationSeconds?: number; // e.g. 5, 7, or 10 seconds countdown
  viewedBy?: string[]; // userCodes who opened it
  disappearedFor?: string[]; // userCodes for whom this streak permanently vanished
}

export interface GharRewindMoment {
  id: string;
  authorName: string;
  authorAvatar: string;
  authorCode: string;
  photoUrl: string;
  note: string;
  quote?: string;
  locationTag: string;
  timestamp: string;
  timeOfDayLabel: string;
  streakCount: number;
}

export interface VibeStreakTracker {
  id: string;
  userCode1: string;
  userCode2: string;
  user1Name: string;
  user2Name: string;
  streakCount: number;
  lastInteractionAt: string;
  expiresAt: string;
  isExpiringSoon: boolean;
  relationship?: string;
}

export interface UpiPaymentRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  amount: number;
  purpose: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  transactionId?: string;
  approvedBy?: string;
}

export interface TimeCapsuleUnlockRequest {
  id: string;
  capsuleId: string;
  capsuleTitle: string;
  requesterId: string;
  requesterName: string;
  requesterAvatar: string;
  requesterCode?: string;
  ownerCode?: string;
  ownerName?: string;
  message: string; // The fun request / bribe text, e.g. "Tell me the password and I'll treat you to Dairy Milk!"
  status: 'pending' | 'accepted' | 'declined' | 'rejected';
  createdAt: string;
  respondedAt?: string;
}

export interface TimeCapsule {
  id: string;
  title: string;
  description: string;
  photoUrl?: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorCode?: string;
  targetAudience: 'family' | 'connectors' | 'all';
  unlockDate: string; // ISO Date String (e.g. Diwali, New Year)
  occasionTag: string; // e.g., 'Diwali 🪔', 'New Year 🎆', 'Birthday 🎂', 'Anniversary 💖', 'Custom ⏳'
  isUnlocked: boolean;
  unlockedForUsers?: string[]; // Specific userCodes for whom this capsule is unlocked via instant bribe accept
  unlockRequests?: TimeCapsuleUnlockRequest[];
  createdAt: string;
  reactions?: Record<string, number>;
}

export interface EmergencySosEvent {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderPhone: string;
  latitude: number;
  longitude: number;
  address: string;
  batteryLevel: number;
  status: 'active' | 'resolved';
  timestamp: string;
  resolvedAt?: string;
}

export interface AppState {
  members: FamilyMember[];
  callLogs: CallSession[];
  activeCall: CallSession | null;
  moodNotes: FamilyMoodNote[];
  invites: InviteToken[];
  settings: AppSettings;
  contacts: Contact[];
  contactFolders?: string[];
  quickReplies?: QuickReplyTemplate[];
  scheduledCalls: ScheduledCall[];
  geofenceAlerts: GeofenceAlert[];
  activeSosAlert: SosAlert | null;
  podcasts: FamilyPodcastEpisode[];
  conspiratorPlans: ConspiratorPlan[];
  familyRoomCode: string;
  messages?: ChatMessage[];
  closeFriends?: CloseFriend[];
  connectors?: Connector[];
  storyNotes?: StoryNote[];
  socialPosts?: SocialPost[];
  timeCapsules?: TimeCapsule[];
  timeCapsuleRequests?: TimeCapsuleUnlockRequest[];
  vibeStreaks?: VibeStreakTracker[];
  activeSosPanic?: EmergencySosEvent | null;
  upiRequests?: UpiPaymentRequest[];
  activeUrgentAlert?: {
    callId: string;
    callerName: string;
    callerNumber: string;
    timestamp: string;
    forwardedTo: string;
  } | null;
}

