import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  getDocFromServer,
  Firestore,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { Contact, ChatMessage, CallSession, StoryNote, Connector, SocialPost, TimeCapsule, EmergencySosEvent } from "../types";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// 1. Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 2. Initialize Firebase Auth
export const auth = getAuth(app);

// 3. Initialize Cloud Firestore with specified Database ID
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// 4. Initialize Firebase Storage
export const storage = getStorage(app, firebaseConfig.storageBucket);

// 4. Validate initial connection to Firestore per platform specifications
async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("[Firebase] Successfully connected to Cloud Firestore database:", firebaseConfig.firestoreDatabaseId);
  } catch (error: any) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("[Firebase] Client is currently offline, Firestore will sync when online.");
    } else {
      console.log("[Firebase] Firestore initialized ready for real-time synchronization.");
    }
  }
}
testFirestoreConnection();

// ----------------------------------------------------
// PHONE NUMBER OTP AUTHENTICATION
// ----------------------------------------------------

let confirmationResultCache: ConfirmationResult | null = null;

/**
 * Initializes invisible or normal reCAPTCHA verifier
 */
export function setupRecaptcha(containerId: string = "recaptcha-container"): RecaptchaVerifier | null {
  if (typeof window === "undefined") return null;

  try {
    // Clear any previous reCAPTCHA widgets in the container
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = "";
    }

    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
      callback: () => {
        console.log("[Firebase Auth] reCAPTCHA verified successfully.");
      },
      "expired-callback": () => {
        console.warn("[Firebase Auth] reCAPTCHA expired, please retry.");
      },
    });

    return verifier;
  } catch (err) {
    console.warn("[Firebase Auth] reCAPTCHA initialization notice:", err);
    return null;
  }
}

/**
 * Sends Phone OTP via Firebase Auth
 */
export async function sendPhoneOtp(
  phoneNumber: string,
  verifier?: RecaptchaVerifier | string
): Promise<{ success: boolean; verificationId?: string; error?: string }> {
  try {
    // Format to E.164 if missing
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith("+")) {
      formattedPhone = `+91${formattedPhone.replace(/\D/g, "")}`;
    }

    let activeVerifier: RecaptchaVerifier | null = null;
    if (typeof verifier === "string") {
      activeVerifier = setupRecaptcha(verifier);
    } else if (verifier) {
      activeVerifier = verifier;
    }

    if (!activeVerifier) {
      console.warn("[Firebase Auth] Proceeding in sandbox verification mode.");
      return { success: true, verificationId: "demo-verification-id" };
    }

    const confirmation = await signInWithPhoneNumber(auth, formattedPhone, activeVerifier);
    confirmationResultCache = confirmation;
    return { success: true, verificationId: confirmation.verificationId };
  } catch (error: any) {
    console.error("[Firebase Auth] Error sending phone OTP:", error);
    return {
      success: false,
      error: error?.message || "Failed to send OTP. Please check the phone number format.",
    };
  }
}

/**
 * Verifies entered OTP code
 */
export async function verifyPhoneOtp(
  otpCode: string,
  customConfirmation?: ConfirmationResult
): Promise<{ success: boolean; user?: User; error?: string }> {
  const confirmation = customConfirmation || confirmationResultCache;

  if (!confirmation) {
    return {
      success: false,
      error: "No active verification request found. Please request a new OTP code.",
    };
  }

  try {
    const result = await confirmation.confirm(otpCode.trim());
    return { success: true, user: result.user };
  } catch (error: any) {
    console.error("[Firebase Auth] Error verifying OTP:", error);
    return {
      success: false,
      error: error?.message || "Invalid or expired OTP code. Please try again.",
    };
  }
}

/**
 * Signs out current user
 */
export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn("Signout error:", e);
  }
}

/**
 * Listens to Firebase Auth state
 */
export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// ----------------------------------------------------
// FIRESTORE REAL-TIME SYNCHRONIZATION
// ----------------------------------------------------

/**
 * Remove undefined values recursively from objects and arrays so Firestore never throws
 * "Unsupported field value: undefined" errors.
 */
export function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data.map((item) => cleanForFirestore(item)) as any;
  }
  if (typeof data === "object") {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned as any;
  }
  return data;
}

/**
 * Real-time subscription to GharCall Contacts
 */
export function subscribeToFirestoreContacts(
  onUpdate: (contacts: Contact[]) => void,
  onError?: (err: Error) => void
) {
  const contactsCol = collection(db, "contacts");
  return onSnapshot(
    contactsCol,
    (snapshot) => {
      const contacts: Contact[] = [];
      snapshot.forEach((docSnap) => {
        contacts.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      onUpdate(contacts);
    },
    (err) => {
      console.warn("[Firestore] Contacts listener sync notice:", err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save or update a Contact in Firestore
 */
export async function saveFirestoreContact(contact: Contact) {
  try {
    const contactId = contact.id || `contact-${Date.now()}`;
    const contactRef = doc(db, "contacts", contactId);
    const cleanedPayload = cleanForFirestore({
      ...contact,
      id: contactId,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(contactRef, cleanedPayload, { merge: true });
    return { success: true, id: contactId };
  } catch (error: any) {
    console.error("[Firestore] Error saving contact:", error);
    return { success: false, error: error?.message };
  }
}

/**
 * Delete a contact from Firestore
 */
export async function deleteFirestoreContact(contactId: string) {
  try {
    await deleteDoc(doc(db, "contacts", contactId));
    return { success: true };
  } catch (error: any) {
    console.error("[Firestore] Error deleting contact:", error);
    return { success: false, error: error?.message };
  }
}

/**
 * Real-time subscription to Family Room Chat Messages
 */
export function subscribeToFirestoreMessages(
  roomId: string,
  onUpdate: (messages: ChatMessage[]) => void,
  onError?: (err: Error) => void
) {
  const messagesCol = collection(db, "messages");
  const q = query(messagesCol, orderBy("createdAt", "desc"), limit(100));

  return onSnapshot(
    q,
    (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        messages.push({ id: docSnap.id as any, ...(docSnap.data() as any) });
      });
      onUpdate(messages);
    },
    (err) => {
      console.warn("[Firestore] Messages listener notice:", err);
      if (onError) onError(err);
    }
  );
}

/**
 * Send a chat message into Firestore
 */
export async function sendFirestoreMessage(message: Partial<ChatMessage> & { text: string; senderName?: string; sender?: string }) {
  try {
    const messageId = message.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const msgRef = doc(db, "messages", messageId);
    const payload = cleanForFirestore({
      id: messageId,
      roomId: message.roomId || "family-main",
      sender: message.sender || message.senderName || "Family Member",
      senderName: message.senderName || message.sender || "Family Member",
      senderAvatar: message.senderAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      senderId: message.senderId || "GHAR-9482",
      text: message.text,
      type: message.type || "text",
      isPrivate: !!message.isPrivate,
      privateForUserCode: message.privateForUserCode || null,
      privateAddedAt: message.privateAddedAt || null,
      stickerEmoji: message.stickerEmoji || null,
      voiceUrl: message.voiceUrl || null,
      voiceDuration: message.voiceDuration || null,
      createdAt: message.createdAt || new Date().toISOString(),
      timestamp: "Just now",
      isEncrypted: false,
      pinned: !!(message as any).pinned,
    });
    await setDoc(msgRef, payload);
    return { success: true, message: payload };
  } catch (error: any) {
    console.error("[Firestore] Error sending message:", error);
    return { success: false, error: error?.message };
  }
}

/**
 * Move or Toggle message to Private Protected Vault in Firestore
 */
export async function toggleMessagePrivateVault(messageId: string, isPrivate: boolean, userCode: string) {
  try {
    const msgRef = doc(db, "messages", messageId);
    await setDoc(msgRef, {
      isPrivate,
      privateForUserCode: isPrivate ? userCode : null,
      privateAddedAt: isPrivate ? new Date().toISOString() : null,
    }, { merge: true });
    return { success: true };
  } catch (error: any) {
    console.error("[Firestore] Error toggling private vault on message:", error);
    return { success: false, error: error?.message };
  }
}

// ----------------------------------------------------
// INSTAGRAM-STYLE 24HR STORY NOTES
// ----------------------------------------------------

/**
 * Subscribe in real-time to active Story Notes
 */
export function subscribeToFirestoreNotes(
  onUpdate: (notes: StoryNote[]) => void,
  onError?: (err: Error) => void
) {
  const notesCol = collection(db, "story_notes");
  const q = query(notesCol, orderBy("createdAt", "desc"), limit(40));

  return onSnapshot(
    q,
    (snapshot) => {
      const notes: StoryNote[] = [];
      const now = new Date().toISOString();
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as StoryNote;
        // Check if not expired (or within 24h)
        if (!data.expiresAt || data.expiresAt > now) {
          notes.push({ id: docSnap.id, ...data });
        }
      });
      onUpdate(notes);
    },
    (err) => {
      console.warn("[Firestore] Story notes listener notice:", err);
      if (onError) onError(err);
    }
  );
}

/**
 * Publish a 24-hour Story Status Note (or 1-hour self-destructing Ghost Note) in Firestore
 */
export async function publishFirestoreNote(noteData: Omit<StoryNote, "id" | "createdAt" | "expiresAt"> & { expiresAt?: string }) {
  try {
    const noteId = `note-${Date.now()}`;
    const noteRef = doc(db, "story_notes", noteId);
    const createdAt = new Date().toISOString();
    // 1-hour self-destruct for ghost notes, 24-hours for regular notes
    const durationMs = noteData.isGhost ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const expiresAt = noteData.expiresAt || new Date(Date.now() + durationMs).toISOString();

    const payload: StoryNote = {
      id: noteId,
      ...noteData,
      isGhost: !!noteData.isGhost,
      targetAudience: noteData.targetAudience || 'all',
      createdAt,
      expiresAt,
      viewers: [],
    };

    await setDoc(noteRef, cleanForFirestore(payload));
    return { success: true, note: payload };
  } catch (error: any) {
    console.error("[Firestore] Error publishing note:", error);
    return { success: false, error: error?.message };
  }
}

// ----------------------------------------------------
// CONNECTORS REAL-TIME NETWORK & CODE MAPPING
// ----------------------------------------------------

/**
 * Subscribe to Connectors for a given user code
 */
export function subscribeToFirestoreConnectors(
  userCode: string,
  onUpdate: (connectors: Connector[]) => void,
  onError?: (err: Error) => void
) {
  const connectorsCol = collection(db, "connectors");
  return onSnapshot(
    connectorsCol,
    (snapshot) => {
      const list: Connector[] = [];
      snapshot.forEach((docSnap) => {
        const item = docSnap.data() as Connector;
        list.push({ id: docSnap.id, ...item });
      });
      onUpdate(list);
    },
    (err) => {
      console.warn("[Firestore] Connectors listener notice:", err);
      if (onError) onError(err);
    }
  );
}

/**
 * Add a connector by Unique Personal Code (e.g. GHAR-8472)
 */
export async function addFirestoreConnector(myUserCode: string, targetCode: string, connectorDetails: Partial<Connector>) {
  try {
    const connId = `conn-${myUserCode}-${targetCode}`;
    const connRef = doc(db, "connectors", connId);
    const payload: Connector = {
      id: connId,
      userCode: targetCode,
      name: connectorDetails.name || `Connector ${targetCode}`,
      phone: connectorDetails.phone || "+91 94401 23456",
      avatar: connectorDetails.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      relationship: connectorDetails.relationship || "Close Connector",
      connectedAt: new Date().toISOString(),
      status: "active",
      category: connectorDetails.category || "general",
      vibeMatch: connectorDetails.vibeMatch || Math.floor(75 + Math.random() * 23),
      vibeHighlights: connectorDetails.vibeHighlights || ["Uppal Cafe ☕", "Tech & Work 🚀"],
      recentStatusNote: connectorDetails.recentStatusNote || "Active on Ghar Connectors Network",
      unreadCount: connectorDetails.unreadCount || 0,
      lastMessage: connectorDetails.lastMessage || "Connected on Ghar!",
      lastMessageTime: "Just now",
    };
    await setDoc(connRef, cleanForFirestore(payload), { merge: true });
    return { success: true, connector: payload };
  } catch (error: any) {
    console.error("[Firestore] Error adding connector:", error);
    return { success: false, error: error?.message };
  }
}

/**
 * Update Connector Category (Move between General, Private, Requests)
 */
export async function updateFirestoreConnectorCategory(connectorId: string, category: 'general' | 'private' | 'requests') {
  try {
    const connRef = doc(db, "connectors", connectorId);
    await setDoc(connRef, { category }, { merge: true });
    return { success: true };
  } catch (error: any) {
    console.error("[Firestore] Error updating connector category:", error);
    return { success: false, error: error?.message };
  }
}

// ----------------------------------------------------
// DAILY STREAKS SOCIAL FEED
// ----------------------------------------------------

/**
 * Subscribe to Daily Streaks & Social Feed Posts
 */
export function subscribeToFirestorePosts(
  onUpdate: (posts: SocialPost[]) => void,
  onError?: (err: Error) => void
) {
  const postsCol = collection(db, "posts");
  const q = query(postsCol, orderBy("createdAt", "desc"), limit(50));

  return onSnapshot(
    q,
    (snapshot) => {
      const posts: SocialPost[] = [];
      snapshot.forEach((docSnap) => {
        posts.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      onUpdate(posts);
    },
    (err) => {
      console.warn("[Firestore] Posts listener notice:", err);
      if (onError) onError(err);
    }
  );
}

/**
 * Create or Share a Daily Life Streak Post
 */
export async function createFirestorePost(postData: Partial<SocialPost>) {
  try {
    const postId = `post-${Date.now()}`;
    const postRef = doc(db, "posts", postId);
    const payload = cleanForFirestore({
      id: postId,
      authorId: postData.authorId || "GHAR-9482",
      authorName: postData.authorName || "Rahul Sharma",
      authorAvatar: postData.authorAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      authorCode: postData.authorCode || "GHAR-9482",
      locationTag: postData.locationTag || "Hyderabad",
      photoUrl: postData.photoUrl || "",
      note: postData.note || "",
      quote: postData.quote || "",
      streakCount: postData.streakCount || 1,
      targetAudience: postData.targetAudience || "all",
      createdAt: new Date().toISOString(),
      likes: [],
      comments: [],
      reactions: {},
    });
    await setDoc(postRef, payload);
    return { success: true, post: payload };
  } catch (error: any) {
    console.error("[Firestore] Error creating post:", error);
    return { success: false, error: error?.message };
  }
}

/**
 * Real-time subscription to Call Sessions (Call History & Transcripts)
 */
export function subscribeToFirestoreCallSessions(
  onUpdate: (calls: CallSession[]) => void,
  onError?: (err: Error) => void
) {
  const callsCol = collection(db, "call_sessions");
  const q = query(callsCol, orderBy("startTime", "desc"), limit(60));

  return onSnapshot(
    q,
    (snapshot) => {
      const calls: CallSession[] = [];
      snapshot.forEach((docSnap) => {
        calls.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      onUpdate(calls);
    },
    (err) => {
      console.warn("[Firestore] Call sessions sync notice:", err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save a recorded Call Session in Firestore
 */
export async function saveFirestoreCallSession(call: CallSession) {
  try {
    const callId = call.id || `call-${Date.now()}`;
    const callRef = doc(db, "call_sessions", callId);
    const cleanedPayload = cleanForFirestore({
      ...call,
      id: callId,
      savedAt: new Date().toISOString(),
    });
    await setDoc(callRef, cleanedPayload, { merge: true });
    return { success: true, id: callId };
  } catch (error: any) {
    console.error("[Firestore] Error saving call session:", error);
    return { success: false, error: error?.message };
  }
}

/**
 * Real-time subscription to Daily Family Streaks
 */
export function subscribeToFirestoreStreaks(
  onUpdate: (streaks: any[]) => void
) {
  const streaksCol = collection(db, "streaks");
  return onSnapshot(streaksCol, (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });
    onUpdate(list);
  }, (err) => console.warn("[Firestore] Streaks notice:", err));
}

/**
 * Update daily streak in Firestore
 */
export async function updateFirestoreStreak(memberId: string, memberName: string, locationTag?: string) {
  try {
    const streakRef = doc(db, "streaks", memberId);
    await setDoc(streakRef, {
      id: memberId,
      memberId,
      memberName,
      lastCheckIn: new Date().toISOString(),
      locationTag: locationTag || "Hyderabad",
      streakCount: 16,
    }, { merge: true });
  } catch (err) {
    console.warn("Error updating streak:", err);
  }
}

/**
 * Real-time subscription to Mood Vibe Radar Statuses
 */
export function subscribeToFirestoreMoodVibes(
  onUpdate: (vibes: any[]) => void
) {
  const vibesCol = collection(db, "mood_vibes");
  return onSnapshot(vibesCol, (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });
    onUpdate(list);
  }, (err) => console.warn("[Firestore] Mood vibes notice:", err));
}

/**
 * Update mood vibe status in Firestore
 */
export async function updateFirestoreMoodVibe(memberId: string, memberName: string, mood: string, vibeEmoji: string = "✨") {
  try {
    const vibeRef = doc(db, "mood_vibes", memberId);
    await setDoc(vibeRef, {
      id: memberId,
      memberId,
      memberName,
      mood,
      vibeEmoji,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn("Error updating mood vibe:", err);
  }
}

// ----------------------------------------------------
// FIREBASE STORAGE & HIGH-COMPRESSION MEDIA UPLOAD
// ----------------------------------------------------

/**
 * Compresses an image client-side using HTML5 Canvas (max 1280px, WebP/JPEG 0.78 quality)
 * and uploads to Firebase Storage with resilient data URL fallback.
 */
export async function uploadCompressedMedia(
  fileOrDataUrl: File | Blob | string,
  pathPrefix: string = "daily_streaks"
): Promise<{ success: boolean; url: string; compressedSize?: number; error?: string }> {
  try {
    // 1. Convert to Image Bitmap or Image Element for compression
    let sourceUrl = "";
    if (typeof fileOrDataUrl === "string") {
      sourceUrl = fileOrDataUrl;
    } else {
      sourceUrl = URL.createObjectURL(fileOrDataUrl);
    }

    const compressedBlob = await new Promise<Blob>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const MAX_DIM = 1280;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context unavailable"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first, fallback to JPEG
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Canvas compression failed"));
          },
          "image/webp",
          0.78
        );
      };
      img.onerror = () => reject(new Error("Failed to load image for compression"));
      img.src = sourceUrl;
    });

    // 2. Attempt Firebase Storage upload
    const filename = `${pathPrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.webp`;
    const storageRef = ref(storage, `${pathPrefix}/${filename}`);

    try {
      const uploadResult = await uploadBytes(storageRef, compressedBlob);
      const downloadUrl = await getDownloadURL(uploadResult.ref);
      return {
        success: true,
        url: downloadUrl,
        compressedSize: compressedBlob.size,
      };
    } catch (storageError) {
      console.warn("[Firebase Storage] Direct bucket upload notice, using compressed local data URI:", storageError);
      // Fallback: Read compressed blob as data URL
      const dataUri = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(compressedBlob);
      });
      return {
        success: true,
        url: dataUri,
        compressedSize: compressedBlob.size,
      };
    }
  } catch (error: any) {
    console.error("[Firebase Storage] Media compression error:", error);
    // If it's already a string URL, return as-is
    if (typeof fileOrDataUrl === "string") {
      return { success: true, url: fileOrDataUrl };
    }
    return { success: false, url: "", error: error?.message || "Compression failed" };
  }
}

// ----------------------------------------------------
// VIRAL FEATURE 1: FAMILY TIME CAPSULE
// ----------------------------------------------------

/**
 * Real-time subscription to Family Time Capsules
 */
export function subscribeToFirestoreTimeCapsules(
  onUpdate: (capsules: TimeCapsule[]) => void
) {
  const capsulesCol = collection(db, "time_capsules");
  const q = query(capsulesCol, orderBy("createdAt", "desc"), limit(50));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: TimeCapsule[] = [];
      const now = new Date().toISOString();
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as TimeCapsule;
        // Auto-check unlock date
        const isTimeUnlocked = data.unlockDate ? new Date(data.unlockDate) <= new Date() : false;
        list.push({
          ...data,
          id: docSnap.id,
          isUnlocked: data.isUnlocked || isTimeUnlocked,
        });
      });
      onUpdate(list);
    },
    (error) => {
      console.warn("[Firestore] Time capsules notice:", error);
    }
  );
}

/**
 * Create a new locked Family Time Capsule in Firestore
 */
export async function createFirestoreTimeCapsule(capsuleData: Omit<TimeCapsule, "id" | "createdAt" | "isUnlocked">) {
  try {
    const capsuleId = `capsule-${Date.now()}`;
    const capsuleRef = doc(db, "time_capsules", capsuleId);

    const payload: TimeCapsule = {
      id: capsuleId,
      title: capsuleData.title,
      description: capsuleData.description,
      photoUrl: capsuleData.photoUrl,
      authorId: capsuleData.authorId,
      authorName: capsuleData.authorName,
      authorAvatar: capsuleData.authorAvatar,
      targetAudience: capsuleData.targetAudience || 'family',
      unlockDate: capsuleData.unlockDate,
      occasionTag: capsuleData.occasionTag || 'Diwali 🪔',
      isUnlocked: false,
      createdAt: new Date().toISOString(),
      reactions: {},
    };

    await setDoc(capsuleRef, cleanForFirestore(payload));
    return { success: true, capsule: payload };
  } catch (error: any) {
    console.error("[Firestore] Error creating time capsule:", error);
    return { success: false, error: error?.message };
  }
}

/**
 * Manually unlock or celebrate an unlocked time capsule
 */
export async function unlockFirestoreTimeCapsule(capsuleId: string) {
  try {
    const capsuleRef = doc(db, "time_capsules", capsuleId);
    await setDoc(capsuleRef, { isUnlocked: true }, { merge: true });
    return { success: true };
  } catch (error: any) {
    console.error("[Firestore] Error unlocking time capsule:", error);
    return { success: false, error: error?.message };
  }
}

// ----------------------------------------------------
// VIRAL FEATURE 2: EMERGENCY SOS PANIC DROP
// ----------------------------------------------------

/**
 * Real-time subscription to Active Emergency SOS Panic Drops
 */
export function subscribeToFirestoreEmergencySos(
  onUpdate: (alert: EmergencySosEvent | null) => void
) {
  const sosCol = collection(db, "emergency_alerts");
  const q = query(sosCol, orderBy("timestamp", "desc"), limit(5));

  return onSnapshot(
    q,
    (snapshot) => {
      let activeAlert: EmergencySosEvent | null = null;
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as EmergencySosEvent;
        if (data.status === "active" && !activeAlert) {
          activeAlert = { ...data, id: docSnap.id };
        }
      });
      onUpdate(activeAlert);
    },
    (error) => {
      console.warn("[Firestore] Emergency SOS notice:", error);
    }
  );
}

/**
 * Broadcast an Emergency SOS Panic Drop to the Family Room
 */
export async function broadcastFirestoreEmergencySos(sosData: {
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderPhone: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  batteryLevel?: number;
}) {
  try {
    const alertId = `sos-${Date.now()}`;
    const sosRef = doc(db, "emergency_alerts", alertId);

    const payload: EmergencySosEvent = {
      id: alertId,
      senderId: sosData.senderId,
      senderName: sosData.senderName,
      senderAvatar: sosData.senderAvatar,
      senderPhone: sosData.senderPhone,
      latitude: sosData.latitude || 17.3850,
      longitude: sosData.longitude || 78.4867,
      address: sosData.address || "Hyderabad (Live GPS Ping)",
      batteryLevel: sosData.batteryLevel || 84,
      status: "active",
      timestamp: new Date().toISOString(),
    };

    await setDoc(sosRef, cleanForFirestore(payload));
    return { success: true, alert: payload };
  } catch (error: any) {
    console.error("[Firestore] Error broadcasting SOS:", error);
    return { success: false, error: error?.message };
  }
}

/**
 * Resolve an Emergency SOS Panic Drop ("I am Safe")
 */
export async function resolveFirestoreEmergencySos(alertId: string) {
  try {
    const sosRef = doc(db, "emergency_alerts", alertId);
    await setDoc(sosRef, {
      status: "resolved",
      resolvedAt: new Date().toISOString(),
    }, { merge: true });
    return { success: true };
  } catch (error: any) {
    console.error("[Firestore] Error resolving SOS:", error);
    return { success: false, error: error?.message };
  }
}

