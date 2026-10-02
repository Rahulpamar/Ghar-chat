import { SocialPost, StoryNote, GharRewindMoment, VibeStreakTracker, Connector, ChatMessage } from "../types";
import { saveFirestoreVibeStreak } from "./firebase";

/**
 * Ghar Rewind Montage Background Worker
 * Aggregates daily shared moments into a chronological Instagram/Snapchat-style story montage
 */
export function aggregateGharRewindMontage(
  socialPosts: SocialPost[] = [],
  storyNotes: StoryNote[] = []
): GharRewindMoment[] {
  const curatedMoments: GharRewindMoment[] = [];

  // 1. Process Social Posts
  socialPosts.forEach((post) => {
    // Determine Time of Day Label
    const date = new Date(post.createdAt || Date.now());
    const hours = date.getHours();
    let timeOfDayLabel = "☀️ Afternoon Moment";
    if (hours < 11) {
      timeOfDayLabel = "🌅 Morning Chai & Check-in";
    } else if (hours < 16) {
      timeOfDayLabel = "☀️ Midday Hustle & Grub";
    } else if (hours < 20) {
      timeOfDayLabel = "🌇 Golden Hour Sunset Walk";
    } else {
      timeOfDayLabel = "🌙 Night Muchatlu & Vibes";
    }

    curatedMoments.push({
      id: `rewind-${post.id}`,
      authorName: post.authorName || "Family Member",
      authorAvatar: post.authorAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      authorCode: post.authorCode || "GHAR-9482",
      photoUrl: post.photoUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80",
      note: post.note || "Daily life moments shared on Ghar.",
      quote: post.quote || "Cherish the simple everyday memories together.",
      locationTag: post.locationTag || "Hyderabad",
      timestamp: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      timeOfDayLabel,
      streakCount: post.streakCount || 14,
    });
  });

  // 2. Process Story Notes that have photos or memorable quotes
  storyNotes.forEach((note) => {
    const date = new Date(note.createdAt || Date.now());
    const hours = date.getHours();
    let timeOfDayLabel = hours < 12 ? "🌅 Morning Status" : hours < 18 ? "☀️ Afternoon Thought" : "🌙 Evening Note";

    curatedMoments.push({
      id: `rewind-note-${note.id}`,
      authorName: note.authorName || "Connector",
      authorAvatar: note.authorAvatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
      authorCode: note.authorCode || "GHAR-5182",
      photoUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80",
      note: `${note.emoji || "✨"} "${note.note}"`,
      quote: "Shared status note with the Ghar network.",
      locationTag: note.location || "Uppal Cafe, Hyderabad",
      timestamp: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      timeOfDayLabel,
      streakCount: 12,
    });
  });

  // 3. Fallback defaults if fewer than 3 moments exist
  if (curatedMoments.length < 3) {
    const defaults: GharRewindMoment[] = [
      {
        id: "rewind-default-1",
        authorName: "Rahul Sharma",
        authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        authorCode: "GHAR-9482",
        photoUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80",
        note: "Irani chai & Osmania biscuits breakfast sprint with family!",
        quote: "Chai and authentic conversations start the best days.",
        locationTag: "Paradise Food Court, Secunderabad",
        timestamp: "08:45 AM",
        timeOfDayLabel: "🌅 08:45 AM • Morning Chai & Check-in",
        streakCount: 15,
      },
      {
        id: "rewind-default-2",
        authorName: "Sunita Sharma (Mom)",
        authorAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
        authorCode: "GHAR-3391",
        photoUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80",
        note: "Fresh morning walk at KBR Park before the sun gets too warm.",
        quote: "One step at a time, every single day.",
        locationTag: "KBR National Park, Jubilee Hills",
        timestamp: "10:15 AM",
        timeOfDayLabel: "☀️ 10:15 AM • Midday Greenery Walk",
        streakCount: 21,
      },
      {
        id: "rewind-default-3",
        authorName: "Ananya Rao",
        authorAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
        authorCode: "GHAR-8823",
        photoUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80",
        note: "Uppal Cafe workspace meetup with the project crew!",
        quote: "Food tastes best when shared with people who dream with you.",
        locationTag: "Uppal Cafe, Hyderabad",
        timestamp: "04:30 PM",
        timeOfDayLabel: "🌇 04:30 PM • Golden Hour Cafe Catchup",
        streakCount: 14,
      },
      {
        id: "rewind-default-4",
        authorName: "Ramesh Sharma (Dad)",
        authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        authorCode: "GHAR-1049",
        photoUrl: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&auto=format&fit=crop&q=80",
        note: "Evening terrace family get-together with samosas & sweet lassi.",
        quote: "Family isn't an important thing. It's everything.",
        locationTag: "Home Terrace Garden, Hyderabad",
        timestamp: "08:15 PM",
        timeOfDayLabel: "🌙 08:15 PM • Night Terrace Gathering",
        streakCount: 12,
      },
    ];

    return [...curatedMoments, ...defaults];
  }

  return curatedMoments;
}

/**
 * Automated Vibe Streak Tracker Worker
 * Calculates and updates daily streak counters between connected users based on active messaging and streak shares.
 */
export function computeVibeStreaks(
  connectors: Connector[],
  messages: ChatMessage[] = [],
  myCode: string = "GHAR-9482",
  myName: string = "Rahul Sharma"
): VibeStreakTracker[] {
  const trackers: VibeStreakTracker[] = [];

  connectors.forEach((conn, index) => {
    // Count interactions in chat or shared connections
    const connMessages = messages.filter(
      (m) =>
        (m.senderId === conn.userCode && m.roomId.includes(conn.userCode)) ||
        (m.senderId === myCode && m.roomId.includes(conn.userCode))
    );

    // Dynamic base streak count with daily bonus
    const baseStreak = conn.streakCount || (14 - (index % 5) * 2 + Math.min(connMessages.length, 5));
    const streakCount = Math.max(3, baseStreak);

    const now = new Date();
    // Streak expires at midnight (or in 6-12 hours for excitement)
    const expiresAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
    const hoursRemaining = (new Date(expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60);

    const tracker: VibeStreakTracker = {
      id: `vibe-${myCode}-${conn.userCode}`,
      userCode1: myCode,
      userCode2: conn.userCode,
      user1Name: myName,
      user2Name: conn.name,
      streakCount,
      lastInteractionAt: conn.lastMessageTime || "Today",
      expiresAt,
      isExpiringSoon: hoursRemaining < 6,
      relationship: conn.relationship || "Connector",
    };

    trackers.push(tracker);
  });

  return trackers;
}

/**
 * Sync computed vibe streaks to Firestore in background
 */
export async function syncVibeStreaksToFirestore(trackers: VibeStreakTracker[]) {
  try {
    for (const tracker of trackers) {
      await saveFirestoreVibeStreak({
        id: tracker.id,
        userCode1: tracker.userCode1,
        userCode2: tracker.userCode2,
        user1Name: tracker.user1Name,
        user2Name: tracker.user2Name,
        streakCount: tracker.streakCount,
        lastInteractionAt: tracker.lastInteractionAt,
        expiresAt: tracker.expiresAt,
        isExpiringSoon: tracker.isExpiringSoon,
      });
    }
  } catch (err) {
    console.warn("[RewindWorker] Error syncing vibe streaks:", err);
  }
}
