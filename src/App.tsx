import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { Navigation, NavTab } from "./components/Navigation";
import { InstagramNotesBar } from "./components/InstagramNotesBar";
import { FamilyChatAndVaultHub } from "./components/FamilyChatAndVaultHub";
import { ConnectorsTabView } from "./components/ConnectorsTabView";
import { DailyStreaksSocialFeed } from "./components/DailyStreaksSocialFeed";
import { ProfileAndSecurityView } from "./components/ProfileAndSecurityView";
import { FamilyTimeCapsuleView } from "./components/FamilyTimeCapsuleView";
import { EmergencySosPanicHub } from "./components/EmergencySosPanicHub";
import { GharCallSplash3D } from "./components/GharCallSplash3D";
import { PostStreakModal } from "./components/PostStreakModal";
import { AuthModal } from "./components/AuthModal";
import { UserProfileSheetModal, UserProfileData } from "./components/UserProfileSheetModal";
import { VoiceRoomModal } from "./components/VoiceRoomModal";
import { CallLogsDashboard } from "./components/CallLogsDashboard";
import { GharRewindModal } from "./components/GharRewindModal";
import { 
  Flame, 
  PlusCircle, 
  MessageSquarePlus, 
  Ghost, 
  Sparkles, 
  Users,
  Hourglass,
  ShieldAlert,
  UserCheck,
  UserX,
  Radio,
  Zap,
  PhoneCall
} from "lucide-react";
import confetti from "canvas-confetti";
import { 
  AppState, 
  FamilyMember, 
  ChatMessage, 
  SocialPost, 
  UserAuthSession, 
  Connector, 
  StoryNote,
  TimeCapsule,
  TimeCapsuleUnlockRequest,
  EmergencySosEvent,
  GharRewindMoment,
  VibeStreakTracker
} from "./types";
import { socket } from "./lib/socketClient";
import { TimeCapsuleUnlockNotificationToast } from "./components/TimeCapsuleUnlockNotificationToast";
import { 
  subscribeToFirestoreMessages, 
  sendFirestoreMessage, 
  toggleMessagePrivateVault,
  subscribeToFirestoreNotes,
  publishFirestoreNote,
  subscribeToFirestoreConnectors,
  addFirestoreConnector,
  updateFirestoreConnectorCategory,
  subscribeToFirestorePosts,
  createFirestorePost,
  deleteFirestorePost,
  markFirestoreStreakViewed,
  subscribeToFirestoreVibeStreaks,
  subscribeToFirestoreTimeCapsules,
  createFirestoreTimeCapsule,
  unlockFirestoreTimeCapsule,
  submitFirestoreTimeCapsuleUnlockRequest,
  respondFirestoreTimeCapsuleUnlockRequest,
  subscribeToFirestoreTimeCapsuleRequests,
  subscribeToFirestoreEmergencySos,
  broadcastFirestoreEmergencySos,
  resolveFirestoreEmergencySos
} from "./lib/firebase";
import { 
  aggregateGharRewindMontage, 
  computeVibeStreaks, 
  syncVibeStreaksToFirestore 
} from "./lib/rewindWorker";

export default function App() {
  const [appState, setAppState] = useState<AppState | null>(null);
  const [currentMemberId, setCurrentMemberId] = useState<string>("mem-1");
  const [activeTab, setActiveTab] = useState<NavTab>("chat");
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);
  const [isMobileView, setIsMobileView] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isAppLocked, setIsAppLocked] = useState<boolean>(false);
  const [showSplash, setShowSplash] = useState<boolean>(true);

  // Profile Click Sheet state
  const [selectedProfileUser, setSelectedProfileUser] = useState<UserProfileData | null>(null);

  // Group Voice Room ("Go Fam Call" / "Go Connectors Call")
  const [activeVoiceRoom, setActiveVoiceRoom] = useState<"family" | "connectors" | null>(null);

  // Trigger modals from Home Screen Universal Post bar
  const [isStreakModalOpen, setIsStreakModalOpen] = useState<boolean>(false);
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState<boolean>(false);

  // Ghar Rewind Montage Modal State
  const [isRewindModalOpen, setIsRewindModalOpen] = useState<boolean>(false);
  const [rewindMoments, setRewindMoments] = useState<GharRewindMoment[]>([]);

  // Vibe Streak Trackers state
  const [vibeStreaks, setVibeStreaks] = useState<VibeStreakTracker[]>([]);

  // Time Capsule Bribe / Unlock Requests
  const [unlockRequests, setUnlockRequests] = useState<TimeCapsuleUnlockRequest[]>([]);

  // Active Emergency SOS Panic Event
  const [activeSosAlert, setActiveSosAlert] = useState<EmergencySosEvent | null>(null);

  // Authenticated user session with secure unique personal code (e.g. GHAR-9482)
  const [authSession, setAuthSession] = useState<UserAuthSession>({
    phoneNumber: "+91 98765 43210",
    isVerified: true,
    userCode: "GHAR-9482",
    name: "Rahul Sharma",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    pinLockEnabled: true,
    pinCode: "1234",
    isLocked: false,
  });

  // 1. Initial State Fetch and WebSocket Setup
  useEffect(() => {
    fetch("/api/state")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.state) {
          setAppState(data.state);
          if (data.state.activeSosPanic) {
            setActiveSosAlert(data.state.activeSosPanic);
          }
        }
      })
      .catch((err) => console.warn("Failed to fetch initial state:", err));

    socket.connect();

    const unsubs = [
      socket.subscribe("connection:status", ({ connected }) => {
        setIsWsConnected(connected);
      }),

      socket.subscribe("init", (serverState: AppState) => {
        setAppState(serverState);
        if (serverState.activeSosPanic) {
          setActiveSosAlert(serverState.activeSosPanic);
        }
      }),

      socket.subscribe("chat:message", (message: ChatMessage) => {
        setAppState((prev) => {
          if (!prev) return prev;
          if ((prev.messages || []).some((m) => m.id === message.id)) return prev;
          return {
            ...prev,
            messages: [...(prev.messages || []), message],
          };
        });
      }),

      socket.subscribe("chat:message_vault_updated", (updatedMsg: ChatMessage) => {
        setAppState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: (prev.messages || []).map((m) => (m.id === updatedMsg.id ? updatedMsg : m)),
          };
        });
      }),

      socket.subscribe("chat:message_reacted", ({ messageId, reactions }: { messageId: string; reactions: Record<string, string[]> }) => {
        setAppState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: (prev.messages || []).map((m) =>
              m.id === messageId ? { ...m, reactions } : m
            ),
          };
        });
      }),

      socket.subscribe("family:room_joined", ({ roomCode }: { roomCode: string }) => {
        setAppState((prev) => (prev ? { ...prev, familyRoomCode: roomCode } : prev));
      }),

      socket.subscribe("note:posted", (newNote: StoryNote) => {
        setAppState((prev) => {
          if (!prev) return prev;
          const filtered = (prev.storyNotes || []).filter((n) => n.authorCode !== newNote.authorCode);
          return {
            ...prev,
            storyNotes: [newNote, ...filtered],
          };
        });
      }),

      socket.subscribe("connector:added", (newConnector: Connector) => {
        setAppState((prev) => {
          if (!prev) return prev;
          const exists = (prev.connectors || []).some((c) => c.userCode === newConnector.userCode);
          return {
            ...prev,
            connectors: exists ? prev.connectors : [newConnector, ...(prev.connectors || [])],
          };
        });
      }),

      socket.subscribe("connector:category_updated", (updatedConn: Connector) => {
        setAppState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            connectors: (prev.connectors || []).map((c) => (c.id === updatedConn.id ? updatedConn : c)),
          };
        });
      }),

      socket.subscribe("connector:accepted", (acceptedConn: Connector) => {
        setAppState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            connectors: (prev.connectors || []).map((c) => (c.id === acceptedConn.id ? acceptedConn : c)),
          };
        });
      }),

      socket.subscribe("social:post_created", (newPost: SocialPost) => {
        setAppState((prev) => {
          if (!prev) return prev;
          if ((prev.socialPosts || []).some((p) => p.id === newPost.id)) return prev;
          return {
            ...prev,
            socialPosts: [newPost, ...(prev.socialPosts || [])],
          };
        });
      }),

      socket.subscribe("social:post_updated", (updatedPost: SocialPost) => {
        setAppState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            socialPosts: (prev.socialPosts || []).map((p) => (p.id === updatedPost.id ? updatedPost : p)),
          };
        });
      }),

      socket.subscribe("social:post_deleted", ({ postId }: { postId: string }) => {
        setAppState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            socialPosts: (prev.socialPosts || []).filter((p) => p.id !== postId),
          };
        });
      }),

      socket.subscribe("time_capsule:created", (newCapsule: TimeCapsule) => {
        setAppState((prev) => {
          if (!prev) return prev;
          if ((prev.timeCapsules || []).some((c) => c.id === newCapsule.id)) return prev;
          return {
            ...prev,
            timeCapsules: [newCapsule, ...(prev.timeCapsules || [])],
          };
        });
      }),

      socket.subscribe("time_capsule:unlocked", (unlockedCapsule: TimeCapsule) => {
        setAppState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            timeCapsules: (prev.timeCapsules || []).map((c) =>
              c.id === unlockedCapsule.id ? { ...c, isUnlocked: true } : c
            ),
          };
        });
      }),

      socket.subscribe("time_capsule:unlock_requested", ({ request }: { request: TimeCapsuleUnlockRequest }) => {
        if (request.ownerCode === authSession.userCode || request.ownerName === authSession.name) {
          setUnlockRequests((prev) => [request, ...prev.filter((r) => r.id !== request.id)]);
        }
      }),

      socket.subscribe("time_capsule:unlock_responded", ({ capsuleId, requesterCode, status }: any) => {
        if (status === "accepted") {
          setAppState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              timeCapsules: (prev.timeCapsules || []).map((c) => {
                if (c.id !== capsuleId) return c;
                const currentUnlocked = c.unlockedForUsers || [];
                return {
                  ...c,
                  unlockedForUsers: currentUnlocked.includes(requesterCode)
                    ? currentUnlocked
                    : [...currentUnlocked, requesterCode],
                };
              }),
            };
          });
        }
      }),

      socket.subscribe("emergency_sos:triggered", (sosEvent: EmergencySosEvent) => {
        setActiveSosAlert(sosEvent);
        setAppState((prev) => (prev ? { ...prev, activeSosPanic: sosEvent } : prev));
      }),

      socket.subscribe("emergency_sos:resolved", () => {
        setActiveSosAlert(null);
        setAppState((prev) => (prev ? { ...prev, activeSosPanic: null } : prev));
      }),
    ];

    return () => {
      unsubs.forEach((u) => u());
    };
  }, []);

  // 2. Direct Cloud Firestore Real-Time Subscriptions (Dual-Sync with Fallback)
  useEffect(() => {
    // A. Subscribe to Firestore Chat Messages
    const unsubMessages = subscribeToFirestoreMessages("family-main", (firestoreMsgs) => {
      if (firestoreMsgs && firestoreMsgs.length > 0) {
        setAppState((prev) => {
          if (!prev) return prev;
          const existingIds = new Set((prev.messages || []).map((m) => m.id));
          const newOnes = firestoreMsgs.filter((m) => !existingIds.has(m.id));
          if (newOnes.length > 0) {
            return {
              ...prev,
              messages: [...(prev.messages || []), ...newOnes],
            };
          }
          return prev;
        });
      }
    });

    // B. Subscribe to Firestore 24h & Ghost Story Notes
    const unsubNotes = subscribeToFirestoreNotes((firestoreNotes) => {
      if (firestoreNotes && firestoreNotes.length > 0) {
        setAppState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            storyNotes: firestoreNotes,
          };
        });
      }
    });

    // C. Subscribe to Firestore Connectors
    const unsubConnectors = subscribeToFirestoreConnectors(authSession.userCode, (firestoreConns) => {
      if (firestoreConns && firestoreConns.length > 0) {
        setAppState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            connectors: firestoreConns,
          };
        });
      }
    });

    // D. Subscribe to Firestore Social Feed Posts
    const unsubPosts = subscribeToFirestorePosts((firestorePosts) => {
      if (firestorePosts && firestorePosts.length > 0) {
        setAppState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            socialPosts: firestorePosts,
          };
        });
      }
    });

    // E. Subscribe to Firestore Family Time Capsules
    const unsubTimeCapsules = subscribeToFirestoreTimeCapsules((firestoreCapsules) => {
      if (firestoreCapsules && firestoreCapsules.length > 0) {
        setAppState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            timeCapsules: firestoreCapsules,
          };
        });
      }
    });

    // F. Subscribe to Firestore Emergency SOS Panic Drops
    const unsubEmergencySos = subscribeToFirestoreEmergencySos((liveSos) => {
      setActiveSosAlert(liveSos);
      setAppState((prev) => (prev ? { ...prev, activeSosPanic: liveSos } : prev));
    });

    // G. Subscribe to Firestore Automated Vibe Streaks
    const unsubVibeStreaks = subscribeToFirestoreVibeStreaks(authSession.userCode, (firestoreStreaks) => {
      if (firestoreStreaks && firestoreStreaks.length > 0) {
        setVibeStreaks(firestoreStreaks);
        setAppState((prev) => (prev ? { ...prev, vibeStreaks: firestoreStreaks } : prev));
      }
    });

    // H. Subscribe to Firestore Time Capsule Unlock & Bribe Requests
    const unsubUnlockReqs = subscribeToFirestoreTimeCapsuleRequests(authSession.userCode, (reqs) => {
      if (reqs && reqs.length > 0) {
        setUnlockRequests(reqs);
      }
    });

    return () => {
      unsubMessages();
      unsubNotes();
      unsubConnectors();
      unsubPosts();
      unsubTimeCapsules();
      unsubEmergencySos();
      unsubVibeStreaks();
      unsubUnlockReqs();
    };
  }, [authSession.userCode]);

  // Automated Vibe Streak background computer & Firestore synchronizer
  useEffect(() => {
    if (!appState) return;
    const computed = computeVibeStreaks(
      appState.connectors || [],
      appState.messages || [],
      authSession.userCode,
      authSession.name
    );
    setVibeStreaks(computed);
    syncVibeStreaksToFirestore(computed);
  }, [(appState?.connectors || []).length, (appState?.messages || []).length, (appState?.socialPosts || []).length]);

  // Loading Screen
  if (!appState) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0F5132] text-white flex items-center justify-center mx-auto animate-pulse font-black text-xl">
            GH
          </div>
          <p className="text-sm font-bold text-[#0F172A]">Connecting to Ghar...</p>
          <span className="text-xs text-slate-400">Real-Time Family & Connectors Network</span>
        </div>
      </div>
    );
  }

  const currentMember =
    appState.members.find((m) => m.id === currentMemberId) || appState.members[0];

  // Filter dedicated streak posts (bidirectional sync)
  const allPosts = appState.socialPosts || [];
  const familyStreaks = allPosts.filter(
    (p) => p.targetAudience === "family" || p.targetAudience === "all" || !p.targetAudience
  );
  const connectorsStreaks = allPosts.filter(
    (p) => p.targetAudience === "connectors" || p.targetAudience === "all"
  );

  // Incoming Connector Requests for Home Screen Banner
  const pendingRequests = (appState.connectors || []).filter(
    (c) => c.status === "pending" || c.category === "requests"
  );

  // Actions: Send Chat Message
  const handleSendMessage = async (msgPayload: Partial<ChatMessage>) => {
    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...msgPayload,
          senderId: authSession.userCode,
          senderName: authSession.name,
          senderAvatar: authSession.avatar,
        }),
      });
      const data = await res.json();
      if (data.success && data.message) {
        setAppState((prev) => {
          if (!prev) return prev;
          if ((prev.messages || []).some((m) => m.id === data.message.id)) return prev;
          return {
            ...prev,
            messages: [...(prev.messages || []), data.message],
          };
        });

        await sendFirestoreMessage({
          ...data.message,
          text: data.message.text,
          senderName: authSession.name,
        });
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // Actions: WhatsApp-Style Message Reaction
  const handleReactMessage = async (messageId: string, emoji: string) => {
    try {
      const res = await fetch(`/api/chat/messages/${messageId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji, userCode: authSession.userCode }),
      });
      const data = await res.json();
      if (data.success && data.message) {
        setAppState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: (prev.messages || []).map((m) =>
              m.id === messageId ? { ...m, reactions: data.message.reactions } : m
            ),
          };
        });
      }
    } catch (err) {
      console.error("Failed to react to message:", err);
    }
  };

  // Actions: Join Family Room with Code
  const handleJoinFamilyRoom = async (code: string) => {
    try {
      const res = await fetch("/api/family/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode: code, userCode: authSession.userCode }),
      });
      const data = await res.json();
      if (data.success) {
        setAppState((prev) => (prev ? { ...prev, familyRoomCode: data.roomCode } : prev));
        confetti({ particleCount: 60, spread: 80 });
      }
    } catch (err) {
      console.error("Failed to join family room:", err);
    }
  };

  // Actions: Move / Toggle Message in Private Protected Vault
  const handleTogglePrivateVault = async (messageId: string, isPrivate: boolean) => {
    try {
      const res = await fetch(`/api/chat/messages/${messageId}/private`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPrivate, userCode: authSession.userCode }),
      });
      const data = await res.json();
      if (data.success) {
        setAppState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: (prev.messages || []).map((m) =>
              m.id === messageId
                ? { ...m, isPrivate, privateForUserCode: isPrivate ? authSession.userCode : undefined }
                : m
            ),
          };
        });

        await toggleMessagePrivateVault(messageId, isPrivate, authSession.userCode);
      }
    } catch (err) {
      console.error("Failed to toggle private vault message:", err);
    }
  };

  // Actions: Post 24h Story Note or 1-hour Ghost Note
  const handlePostNote = async (notePayload: { 
    note: string; 
    emoji: string; 
    location?: string;
    isGhost?: boolean;
    targetAudience?: 'family' | 'connectors' | 'all';
  }) => {
    try {
      const res = await fetch("/api/story-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...notePayload,
          authorId: currentMember.id,
          authorName: authSession.name,
          authorAvatar: authSession.avatar,
          authorCode: authSession.userCode,
        }),
      });
      const data = await res.json();
      if (data.success && data.note) {
        setAppState((prev) => {
          if (!prev) return prev;
          const filtered = (prev.storyNotes || []).filter((n) => n.authorCode !== data.note.authorCode);
          return {
            ...prev,
            storyNotes: [data.note, ...filtered],
          };
        });

        await publishFirestoreNote({
          authorId: currentMember.id,
          authorName: authSession.name,
          authorAvatar: authSession.avatar,
          authorCode: authSession.userCode,
          note: notePayload.note,
          emoji: notePayload.emoji,
          location: notePayload.location,
          isGhost: notePayload.isGhost,
          targetAudience: notePayload.targetAudience,
        });
      }
    } catch (err) {
      console.error("Failed to post story note:", err);
    }
  };

  // Actions: Add Connector by Personal Code
  const handleAddConnectorCode = async (code: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/connectors/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userCode: code, myCode: authSession.userCode }),
      });
      const data = await res.json();
      if (data.success && data.connector) {
        setAppState((prev) => {
          if (!prev) return prev;
          const exists = (prev.connectors || []).some((c) => c.userCode === data.connector.userCode);
          return {
            ...prev,
            connectors: exists ? prev.connectors : [data.connector, ...(prev.connectors || [])],
          };
        });

        await addFirestoreConnector(authSession.userCode, code, data.connector);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to connect personal code:", err);
      return false;
    }
  };

  // Actions: Change Connector Category (Move between General, Private, Requests)
  const handleChangeConnectorCategory = async (connectorId: string, newCategory: 'general' | 'private' | 'requests') => {
    try {
      const res = await fetch(`/api/connectors/${connectorId}/category`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: newCategory }),
      });
      const data = await res.json();
      if (data.success) {
        setAppState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            connectors: (prev.connectors || []).map((c) =>
              c.id === connectorId ? { ...c, category: newCategory } : c
            ),
          };
        });

        await updateFirestoreConnectorCategory(connectorId, newCategory);
      }
    } catch (err) {
      console.error("Failed to update connector category:", err);
    }
  };

  // Actions: Accept Connector Request
  const handleAcceptConnectorRequest = async (connectorId: string) => {
    try {
      await fetch(`/api/connectors/${connectorId}/accept`, { method: "POST" });
      setAppState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          connectors: (prev.connectors || []).map((c) =>
            c.id === connectorId ? { ...c, status: "active", category: "general" } : c
          ),
        };
      });
      confetti({ particleCount: 50, spread: 60 });
    } catch (err) {
      console.error("Failed to accept request:", err);
    }
  };

  // Actions: Daily Streak Social Post (with Audience Selector)
  const handleCreatePost = async (postPayload: Partial<SocialPost>) => {
    try {
      const res = await fetch("/api/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...postPayload,
          authorId: authSession.userCode,
          authorName: authSession.name,
          authorAvatar: authSession.avatar,
          authorCode: authSession.userCode,
        }),
      });
      const data = await res.json();
      if (data.success && data.post) {
        setAppState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            socialPosts: [data.post, ...(prev.socialPosts || [])],
          };
        });

        await createFirestorePost(data.post);
      }
    } catch (err) {
      console.error("Failed to create streak post:", err);
    }
  };

  // Actions: Delete Daily Streak Post permanently
  const handleDeletePost = async (postId: string) => {
    try {
      // Optimistic instant zero-latency removal
      setAppState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          socialPosts: (prev.socialPosts || []).filter((p) => p.id !== postId),
        };
      });

      await fetch(`/api/social/posts/${postId}`, { method: "DELETE" });
      await deleteFirestorePost(postId);
      confetti({ particleCount: 30, spread: 40 });
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };

  // Actions: Mark View-Once Streak as viewed (Snapchat-style self-destruct)
  const handleMarkViewOnceViewed = async (postId: string) => {
    try {
      // Optimistic instant zero-latency update
      setAppState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          socialPosts: (prev.socialPosts || []).map((p) => {
            if (p.id !== postId) return p;
            const viewedBy = Array.from(new Set([...(p.viewedBy || []), authSession.userCode]));
            const disappearedFor = Array.from(new Set([...(p.disappearedFor || []), authSession.userCode]));
            return {
              ...p,
              viewedBy,
              disappearedFor,
            };
          }),
        };
      });

      await fetch(`/api/social/posts/${postId}/view-once`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userCode: authSession.userCode }),
      });
      await markFirestoreStreakViewed(postId, authSession.userCode);
    } catch (err) {
      console.error("Failed to mark view-once streak viewed:", err);
    }
  };

  // Actions: Open Ghar Rewind Montage
  const handleOpenRewind = () => {
    const moments = aggregateGharRewindMontage(appState?.socialPosts || [], appState?.storyNotes || []);
    setRewindMoments(moments);
    setIsRewindModalOpen(true);
  };

  // Actions: Like Post
  const handleLikePost = async (postId: string) => {
    try {
      const res = await fetch(`/api/social/posts/${postId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: authSession.userCode }),
      });
      const data = await res.json();
      if (data.success && data.post) {
        setAppState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            socialPosts: (prev.socialPosts || []).map((p) => (p.id === postId ? data.post : p)),
          };
        });
      }
    } catch (err) {
      console.error("Failed to like post:", err);
    }
  };

  // Actions: Comment on Post
  const handleCommentPost = async (postId: string, commentText: string) => {
    try {
      const res = await fetch(`/api/social/posts/${postId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorId: authSession.userCode,
          authorName: authSession.name,
          authorAvatar: authSession.avatar,
          text: commentText,
        }),
      });
      const data = await res.json();
      if (data.success && data.post) {
        setAppState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            socialPosts: (prev.socialPosts || []).map((p) => (p.id === postId ? data.post : p)),
          };
        });
      }
    } catch (err) {
      console.error("Failed to comment on post:", err);
    }
  };

  // Actions: Create Family Time Capsule
  const handleCreateTimeCapsule = async (capsulePayload: Omit<TimeCapsule, "id" | "createdAt" | "isUnlocked">) => {
    try {
      const res = await fetch("/api/time-capsules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(capsulePayload),
      });
      const data = await res.json();
      if (data.success && data.capsule) {
        setAppState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            timeCapsules: [data.capsule, ...(prev.timeCapsules || [])],
          };
        });

        await createFirestoreTimeCapsule(capsulePayload);
      }
    } catch (err) {
      console.error("Failed to create time capsule:", err);
    }
  };

  // Actions: Unlock Time Capsule
  const handleUnlockTimeCapsule = async (capsuleId: string) => {
    try {
      await fetch(`/api/time-capsules/${capsuleId}/unlock`, { method: "PATCH" });
      await unlockFirestoreTimeCapsule(capsuleId);
      setAppState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          timeCapsules: (prev.timeCapsules || []).map((c) =>
            c.id === capsuleId ? { ...c, isUnlocked: true } : c
          ),
        };
      });
    } catch (err) {
      console.error("Failed to unlock time capsule:", err);
    }
  };

  // Actions: Request Time Capsule Unlock with Bribe Message
  const handleRequestTimeCapsuleUnlock = async (capsuleId: string, message: string) => {
    try {
      const capsule = (appState?.timeCapsules || []).find((c) => c.id === capsuleId);
      const ownerCode = capsule?.authorCode || capsule?.authorId || "GHAR-8823";
      const ownerName = capsule?.authorName || "Sunita Sharma";

      const req: TimeCapsuleUnlockRequest = {
        id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        capsuleId,
        capsuleTitle: capsule?.title || "Memory Vault",
        requesterId: authSession.userCode,
        requesterName: authSession.name,
        requesterAvatar: authSession.avatar,
        requesterCode: authSession.userCode,
        ownerCode,
        ownerName,
        message,
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      setUnlockRequests((prev) => [req, ...prev.filter((r) => r.id !== req.id)]);

      await fetch(`/api/time-capsules/${capsuleId}/request-unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });

      await submitFirestoreTimeCapsuleUnlockRequest(req);
    } catch (err) {
      console.error("Failed to submit time capsule unlock request:", err);
    }
  };

  // Actions: Owner Accepts Bribe & Unlocks Capsule for Requester Instantly
  const handleAcceptUnlockRequest = async (request: TimeCapsuleUnlockRequest) => {
    try {
      const requesterCode = request.requesterCode || request.requesterId;
      // 1. Optimistic zero-latency state update
      setAppState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          timeCapsules: (prev.timeCapsules || []).map((c) => {
            if (c.id !== request.capsuleId) return c;
            const currentUnlocked = c.unlockedForUsers || [];
            return {
              ...c,
              unlockedForUsers: currentUnlocked.includes(requesterCode)
                ? currentUnlocked
                : [...currentUnlocked, requesterCode],
            };
          }),
        };
      });

      setUnlockRequests((prev) =>
        prev.map((r) => (r.id === request.id ? { ...r, status: "accepted" as const } : r))
      );

      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });

      await fetch(`/api/time-capsules/${request.capsuleId}/respond-unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          status: "accepted",
          requesterCode,
        }),
      });

      await respondFirestoreTimeCapsuleUnlockRequest(
        request.id,
        request.capsuleId,
        "accepted",
        requesterCode
      );
    } catch (err) {
      console.error("Failed to accept unlock request:", err);
    }
  };

  // Actions: Owner Rejects Bribe Request
  const handleRejectUnlockRequest = async (request: TimeCapsuleUnlockRequest) => {
    try {
      const requesterCode = request.requesterCode || request.requesterId;
      // 1. Optimistic zero-latency state update - marks request as rejected without modifying capsule unlockedForUsers
      setUnlockRequests((prev) =>
        prev.map((r) => (r.id === request.id ? { ...r, status: "rejected" as const } : r))
      );

      await fetch(`/api/time-capsules/${request.capsuleId}/respond-unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          status: "rejected",
          requesterCode,
        }),
      });

      await respondFirestoreTimeCapsuleUnlockRequest(
        request.id,
        request.capsuleId,
        "rejected",
        requesterCode
      );
    } catch (err) {
      console.error("Failed to reject unlock request:", err);
    }
  };

  // Actions: Emergency SOS Panic Broadcast
  const handleTriggerEmergencySos = async (sosPayload: {
    senderId: string;
    senderName: string;
    senderAvatar: string;
    senderPhone: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    batteryLevel?: number;
  }) => {
    try {
      const res = await fetch("/api/emergency-sos/panic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sosPayload),
      });
      const data = await res.json();
      if (data.success && data.alert) {
        setActiveSosAlert(data.alert);
        await broadcastFirestoreEmergencySos(sosPayload);
      }
    } catch (err) {
      console.error("Failed to broadcast SOS:", err);
    }
  };

  // Actions: Resolve Emergency SOS Alert ("I am Safe")
  const handleResolveEmergencySos = async (alertId: string) => {
    try {
      await fetch("/api/emergency-sos/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId }),
      });
      await resolveFirestoreEmergencySos(alertId);
      setActiveSosAlert(null);
    } catch (err) {
      console.error("Failed to resolve SOS:", err);
    }
  };

  // Update PIN Security in User Session
  const handleUpdateUserPin = (newPin: string) => {
    setAuthSession((prev) => ({
      ...prev,
      pinCode: newPin,
      pinLockEnabled: true,
    }));
  };

  // Profile Click "Message" action router
  const handleStartDirectMessageFromProfile = (user: UserProfileData) => {
    setActiveTab("connectors");
  };

  // Main Tabbed Content Component
  const contentComponent = (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-24 md:pb-12 space-y-4">
      {/* 1. TOP UNIFIED STATUS BAR (24h Stories & 1h Ghost Notes from Family & Connectors) */}
      <div className="rounded-3xl overflow-hidden shadow-2xs border border-slate-100">
        <InstagramNotesBar
          notes={appState.storyNotes || []}
          currentSession={authSession}
          onPostNote={handlePostNote}
          isTriggerModalOpen={isAddNoteModalOpen}
          onCloseTriggerModal={() => setIsAddNoteModalOpen(false)}
        />
      </div>

      {/* 2. HOME SCREEN UNIVERSAL POST TRIGGER BAR */}
      <div className="bg-[#FFFFFF] border border-slate-200/90 rounded-2xl p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <img
            src={authSession.avatar}
            alt={authSession.name}
            onClick={() =>
              setSelectedProfileUser({
                id: authSession.userCode,
                name: authSession.name,
                avatar: authSession.avatar,
                userCode: authSession.userCode,
                relationship: "You (Host)",
                bio: "Real-time communication & daily life streaks on Ghar.",
                recentStatusNote: "At work 💻 • Online on Ghar",
                vibeMatch: 100,
              })
            }
            className="w-9 h-9 rounded-full object-cover border border-slate-200 cursor-pointer hover:ring-2 hover:ring-[#0F5132] transition"
          />
          <div>
            <span className="text-xs font-bold text-slate-900 block">
              What's happening today, {authSession.name.split(" ")[0]}?
            </span>
            <span className="text-[10px] text-slate-400">
              Universal Home Post • Routes to Family Room or Connectors Feed
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Ghar Rewind Montage Button */}
          <button
            onClick={handleOpenRewind}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0F5132] via-emerald-600 to-amber-500 hover:from-[#0c4128] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer hover:scale-105 active:scale-95"
            title="Watch daily chronological story montage of family & connector moments"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
            <span>Ghar Rewind</span>
          </button>

          {/* Post Streak Button */}
          <button
            onClick={() => setIsStreakModalOpen(true)}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-[#0F5132] hover:bg-[#0c4128] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5 text-amber-300" />
            <span>Post Streak</span>
          </button>

          {/* Add 24h / Ghost Note Button */}
          <button
            onClick={() => setIsAddNoteModalOpen(true)}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
          >
            <MessageSquarePlus className="w-3.5 h-3.5 text-[#0F5132]" />
            <span>Add Note</span>
            <Ghost className="w-3 h-3 text-purple-600" />
          </button>

          {/* Quick Lock Capsule Trigger */}
          <button
            onClick={() => setActiveTab("capsule")}
            className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-amber-200"
          >
            <Hourglass className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Time Capsule</span>
          </button>

          {/* Quick Call Logs Trigger */}
          <button
            onClick={() => setActiveTab("calls")}
            className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-blue-200"
          >
            <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Call Logs</span>
          </button>
        </div>
      </div>

      {/* 3. HOME SCREEN INCOMING CONNECTOR REQUESTS BANNER */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3.5 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black text-amber-900 uppercase tracking-wider">
              <UserCheck className="w-4 h-4 text-amber-600" />
              <span>Incoming Connector Requests ({pendingRequests.length})</span>
            </div>
            <span className="text-[10px] text-amber-700 font-bold bg-amber-100/80 px-2 py-0.5 rounded-full">
              Accept to Chat Instantly
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="p-3 bg-white border border-amber-200/80 rounded-xl flex items-center justify-between shadow-2xs hover:shadow-xs transition"
              >
                <div
                  className="flex items-center gap-2.5 cursor-pointer group"
                  onClick={() =>
                    setSelectedProfileUser({
                      id: req.id,
                      name: req.name,
                      avatar: req.avatar,
                      userCode: req.userCode,
                      relationship: req.relationship || "Incoming Connection",
                      bio: req.bio || "Requested to connect with your Ghar personal code.",
                      recentStatusNote: req.recentStatusNote || "Active on Ghar",
                      vibeMatch: req.vibeMatch || 85,
                      vibeHighlights: req.vibeHighlights,
                    })
                  }
                  title="Click to view detailed profile"
                >
                  <img
                    src={req.avatar}
                    alt={req.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 group-hover:ring-2 group-hover:ring-[#0F5132] transition"
                  />
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 group-hover:text-[#0F5132] transition">
                      {req.name}
                    </h5>
                    <span className="text-[10px] font-mono text-[#0F5132] font-semibold block">
                      {req.userCode}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ⚡ {req.vibeMatch || 85}% Vibe Match
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleAcceptConnectorRequest(req.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#0F5132] hover:bg-[#0c4128] text-white text-[11px] font-bold shadow-2xs cursor-pointer flex items-center gap-1"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Accept</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. MAIN NAVIGATION TABS */}
      <Navigation
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        unreadChatCount={(appState.messages || []).filter((m) => !m.isPrivate).length}
        connectorsCount={(appState.connectors || []).length}
        timeCapsuleCount={(appState.timeCapsules || []).length}
        callsCount={(appState.callLogs || []).length}
      />

      {/* Tab 1: Family Room & Private Protected Vault (With Dedicated Family Streaks) */}
      {activeTab === "chat" && (
        <FamilyChatAndVaultHub
          messages={appState.messages || []}
          currentSession={authSession}
          familyRoomCode={appState.familyRoomCode || "GHAR-FAM-7182"}
          onSendMessage={handleSendMessage}
          onTogglePrivateVault={handleTogglePrivateVault}
          onUpdateUserPin={handleUpdateUserPin}
          familyPosts={familyStreaks}
          timeCapsules={appState.timeCapsules || []}
          onRequestTimeCapsuleUnlock={handleRequestTimeCapsuleUnlock}
          onLikePost={handleLikePost}
          onJoinFamilyRoom={handleJoinFamilyRoom}
          onReactMessage={handleReactMessage}
          onDeletePost={handleDeletePost}
          onMarkViewOnceViewed={handleMarkViewOnceViewed}
          onOpenRewind={handleOpenRewind}
          onOpenProfile={setSelectedProfileUser}
          onOpenVoiceRoom={setActiveVoiceRoom}
        />
      )}

      {/* Tab 2: Connectors Hub & Instagram-Style Messenger (General, Private, Requests, Connectors Streaks, Directory) */}
      {activeTab === "connectors" && (
        <ConnectorsTabView
          currentSession={authSession}
          connectors={appState.connectors || []}
          connectorPosts={connectorsStreaks}
          timeCapsules={(appState.timeCapsules || []).filter((c) => c.targetAudience === "connectors" || c.targetAudience === "all")}
          onRequestTimeCapsuleUnlock={handleRequestTimeCapsuleUnlock}
          onAddConnectorCode={handleAddConnectorCode}
          onLikePost={handleLikePost}
          onChangeConnectorCategory={handleChangeConnectorCategory}
          onAcceptRequest={handleAcceptConnectorRequest}
          onDeletePost={handleDeletePost}
          onMarkViewOnceViewed={handleMarkViewOnceViewed}
          onOpenRewind={handleOpenRewind}
          onOpenProfile={setSelectedProfileUser}
          onOpenVoiceRoom={setActiveVoiceRoom}
        />
      )}

      {/* Tab 3: Unified Daily Streaks Feed */}
      {activeTab === "streaks" && (
        <div className="h-[750px] bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <DailyStreaksSocialFeed
            posts={appState.socialPosts || []}
            currentSession={authSession}
            onCreatePost={handleCreatePost}
            onLikePost={handleLikePost}
            onCommentPost={handleCommentPost}
            onDeletePost={handleDeletePost}
            onMarkViewOnceViewed={handleMarkViewOnceViewed}
            onOpenRewind={handleOpenRewind}
          />
        </div>
      )}

      {/* Tab 4: Family Time Capsule (Viral Memory Feature) */}
      {activeTab === "capsule" && (
        <FamilyTimeCapsuleView
          capsules={appState.timeCapsules || []}
          currentSession={authSession}
          onCreateCapsule={handleCreateTimeCapsule}
          onUnlockCapsule={handleUnlockTimeCapsule}
          onRequestUnlock={handleRequestTimeCapsuleUnlock}
        />
      )}

      {/* Tab 5: Call Logs Dashboard (Inbound & Outbound AI Transcriptions) */}
      {activeTab === "calls" && (
        <CallLogsDashboard
          callLogs={appState.callLogs || []}
        />
      )}

      {/* Tab 6: Profile & Security (PIN Vault) */}
      {activeTab === "settings" && (
        <ProfileAndSecurityView
          currentSession={authSession}
          familyMembers={appState.members}
          familyRoomCode={appState.familyRoomCode || "GHAR-FAM-7182"}
          onUpdateSession={(updated) => {
            setAuthSession((prev) => ({ ...prev, ...updated }));
          }}
        />
      )}

      {/* Post Streak Modal with Audience Selector Popup */}
      <PostStreakModal
        isOpen={isStreakModalOpen}
        onClose={() => setIsStreakModalOpen(false)}
        currentSession={authSession}
        onSubmitPost={handleCreatePost}
      />

      {/* User Detailed Profile Sheet Modal (Triggered by Avatar Clicks across app) */}
      <UserProfileSheetModal
        user={selectedProfileUser}
        onClose={() => setSelectedProfileUser(null)}
        onStartDirectMessage={handleStartDirectMessageFromProfile}
      />

      {/* In-App Live Voice Room ("Go Fam Call" / "Go Connectors Call") */}
      {activeVoiceRoom && (
        <VoiceRoomModal
          isOpen={!!activeVoiceRoom}
          roomType={activeVoiceRoom}
          currentSession={authSession}
          onClose={() => setActiveVoiceRoom(null)}
        />
      )}

      {/* "Ghar Rewind" Montage Modal (Chronological Daily Moments) */}
      <GharRewindModal
        isOpen={isRewindModalOpen}
        onClose={() => setIsRewindModalOpen(false)}
        moments={rewindMoments}
      />
    </main>
  );

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0F172A] selection:bg-emerald-100 font-sans relative">
      {/* 3D Motion Pop-Up Launch Splash Screen */}
      {showSplash && (
        <GharCallSplash3D
          autoDismissMs={2400}
          onDismiss={() => setShowSplash(false)}
          onComplete={() => setShowSplash(false)}
        />
      )}

      {/* Top Header with Personal Code & Mobile Frame Switcher */}
      <Header
        currentMember={currentMember}
        allMembers={appState.members}
        onSwitchMember={setCurrentMemberId}
        isWsConnected={isWsConnected}
        isMobileView={isMobileView}
        onToggleMobileView={() => setIsMobileView(!isMobileView)}
        userCode={authSession.userCode}
        roomCode={appState.familyRoomCode || "GHAR-FAM-7182"}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLockApp={() => setIsAppLocked(true)}
        onOpenRewind={handleOpenRewind}
      />

      {/* Emergency SOS Panic Banner & Floating Button System */}
      <EmergencySosPanicHub
        activeSos={activeSosAlert}
        currentSession={authSession}
        onTriggerSos={handleTriggerEmergencySos}
        onResolveSos={handleResolveEmergencySos}
      />

      {/* Auth / PIN Lock Modal */}
      <AuthModal
        isOpen={isAuthModalOpen || isAppLocked}
        isLockScreenMode={isAppLocked}
        currentSession={authSession}
        onClose={() => {
          setIsAuthModalOpen(false);
          setIsAppLocked(false);
        }}
        onSuccess={(session) => {
          setAuthSession(session);
          setIsAuthModalOpen(false);
          setIsAppLocked(false);
        }}
      />

      {/* Viewport Frame Renderer */}
      {isMobileView ? (
        <div className="flex justify-center items-center py-6 px-4">
          <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl border-[8px] border-slate-900 overflow-hidden relative">
            {/* Phone Notch */}
            <div className="bg-slate-900 h-6 w-full flex items-center justify-center">
              <div className="w-20 h-3.5 bg-slate-950 rounded-b-xl" />
            </div>
            <div className="h-[800px] overflow-y-auto">
              {contentComponent}
            </div>
          </div>
        </div>
      ) : (
        contentComponent
      )}
    </div>
  );
}
