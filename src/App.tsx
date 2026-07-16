import { useState, useEffect } from 'react';
import { Player, Court, Match, MatchWinner, MatchType, MatchStatus, Booking } from './types';
import {
  INITIAL_PLAYERS,
  INITIAL_COURTS,
  INITIAL_MATCHES,
} from './utils/dummyData';
import PlayerManager from './components/PlayerManager';
import Matchmaker from './components/Matchmaker';
import CourtList from './components/CourtList';
import ExpenseSummary from './components/ExpenseSummary';
import WeeklyStats from './components/WeeklyStats';
import BookingManager from './components/BookingManager';
import {
  Activity,
  Users,
  Receipt,
  Trophy,
  Plus,
  Play,
  RotateCcw,
  Sparkles,
  Swords,
  Trash2,
  Calendar,
  AlertCircle,
  CalendarDays
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Seed initial bookings with a couple of mock values for demonstration
const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    courtId: 'c1',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '18:00 - 20:00',
    bookerName: 'สมศักดิ์ แขนเหล็ก',
    phoneNumber: '081-234-5678',
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'b2',
    courtId: 'c2',
    date: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0],
    timeSlot: '20:00 - 22:00',
    bookerName: 'คุณอรอุมา เลิฟแบด',
    phoneNumber: '098-765-4321',
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
];

export default function App() {
  // State Initialization from LocalStorage or Dummy Data
  const [players, setPlayers] = useState<Player[]>(() => {
    const local = localStorage.getItem('badminton_players');
    return local ? JSON.parse(local) : INITIAL_PLAYERS;
  });

  const [courts, setCourts] = useState<Court[]>(() => {
    const local = localStorage.getItem('badminton_courts');
    if (local) {
      const parsed = JSON.parse(local) as Court[];
      if (parsed.length < INITIAL_COURTS.length) {
        return INITIAL_COURTS;
      }
      return parsed;
    }
    return INITIAL_COURTS;
  });

  const [matches, setMatches] = useState<Match[]>(() => {
    const local = localStorage.getItem('badminton_matches');
    return local ? JSON.parse(local) : INITIAL_MATCHES;
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const local = localStorage.getItem('badminton_bookings');
    return local ? JSON.parse(local) : INITIAL_BOOKINGS;
  });

  const [activeTab, setActiveTab] = useState<'courts' | 'players' | 'expenses' | 'leaderboard' | 'bookings'>('courts');
  const [isMatchmakerOpen, setIsMatchmakerOpen] = useState(false);
  const [matchmakerCourtId, setMatchmakerCourtId] = useState<string>('');

  // Admin authentication states
  const [adminEmail, setAdminEmail] = useState<string>(() => {
    return localStorage.getItem('badminton_admin_email') || '';
  });
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authEmailInput, setAuthEmailInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  const isAdmin = adminEmail === 'joe.nana.hanza8@gmail.com';

  // Automatically switch tabs if a guest attempts to stay on a forbidden tab
  useEffect(() => {
    if (!isAdmin && (activeTab === 'players' || activeTab === 'expenses')) {
      setActiveTab('courts');
    }
  }, [isAdmin, activeTab]);

  // Save to LocalStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('badminton_players', JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem('badminton_courts', JSON.stringify(courts));
  }, [courts]);

  useEffect(() => {
    localStorage.setItem('badminton_matches', JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    localStorage.setItem('badminton_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('badminton_admin_email', adminEmail);
  }, [adminEmail]);

  // Booking Handlers
  const handleAddBooking = (bookingData: Omit<Booking, 'id' | 'createdAt'>) => {
    const newBooking: Booking = {
      ...bookingData,
      id: 'booking_' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setBookings((prev) => [newBooking, ...prev]);
  };

  const handleConfirmBooking = (id: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'confirmed' } : b))
    );
  };

  const handleDeleteBooking = (id: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== id));
  };

  // Clean up any stale player statuses on boot to prevent locked states
  useEffect(() => {
    // Check if players are marked as "playing" or "waiting" but no active matches match them
    const activeAndWaitingMatches = matches.filter((m) => m.status === 'playing' || m.status === 'waiting');
    const busyPlayerIds = new Set<string>();
    activeAndWaitingMatches.forEach((m) => {
      [...m.teamA, ...m.teamB].forEach((id) => busyPlayerIds.add(id));
    });

    setPlayers((prev) =>
      prev.map((p) => {
        if (!busyPlayerIds.has(p.id) && p.status !== 'available') {
          return { ...p, status: 'available' };
        }
        if (busyPlayerIds.has(p.id) && p.status === 'available') {
          // Find the match to see if playing or waiting
          const match = activeAndWaitingMatches.find((m) => m.teamA.includes(p.id) || m.teamB.includes(p.id));
          const matchStatus = match?.status === 'playing' ? 'playing' : 'waiting';
          return { ...p, status: matchStatus };
        }
        return p;
      })
    );
  }, []);

  // Player Handlers
  const handleAddPlayer = (newPlayer: Omit<Player, 'id' | 'createdAt' | 'status'>) => {
    const player: Player = {
      ...newPlayer,
      id: 'player_' + Date.now(),
      status: 'available',
      createdAt: new Date().toISOString(),
    };
    setPlayers((prev) => [player, ...prev]);
  };

  const handleUpdatePlayer = (id: string, updates: Partial<Player>) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const handleDeletePlayer = (id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  // Matchmaker Open Trigger
  const handleOpenMatchmaker = (courtId: string) => {
    setMatchmakerCourtId(courtId);
    setIsMatchmakerOpen(true);
  };

  // Match Schedule Handler
  const handleAddMatch = (matchData: Omit<Match, 'id' | 'createdAt' | 'completedAt' | 'duration' | 'shuttlecocks' | 'winner'>) => {
    const matchId = 'match_' + Date.now();
    const newMatch: Match = {
      ...matchData,
      id: matchId,
      shuttlecocks: 1, // Start with 1 shuttlecock by default
      duration: 0,
      winner: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    setMatches((prev) => [...prev, newMatch]);

    // Update Court status if starting playing immediately
    if (matchData.status === 'playing') {
      setCourts((prev) =>
        prev.map((c) =>
          c.id === matchData.courtId
            ? { ...c, status: 'playing', currentMatchId: matchId }
            : c
        )
      );

      // Set participating players' status to 'playing'
      const playerIds = [...matchData.teamA, ...matchData.teamB];
      setPlayers((prev) =>
        prev.map((p) =>
          playerIds.includes(p.id) ? { ...p, status: 'playing' } : p
        )
      );
    } else {
      // If waiting in queue, set participating players' status to 'waiting'
      const playerIds = [...matchData.teamA, ...matchData.teamB];
      setPlayers((prev) =>
        prev.map((p) =>
          playerIds.includes(p.id) ? { ...p, status: 'waiting' } : p
        )
      );
    }
  };

  // Live Shuttlecock Counters
  const handleUpdateMatchShuttlecocks = (matchId: string, count: number) => {
    setMatches((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, shuttlecocks: count } : m))
    );
  };

  // Match Completion Handler
  const handleFinishMatch = (matchId: string, winner: MatchWinner, finalShuttlecocks: number, finalDuration: number) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? {
              ...m,
              status: 'completed',
              winner,
              shuttlecocks: finalShuttlecocks,
              duration: finalDuration,
              completedAt: new Date().toISOString(),
            }
          : m
      )
    );

    // Release players
    const matchPlayers = [...match.teamA, ...match.teamB];
    setPlayers((prev) =>
      prev.map((p) =>
        matchPlayers.includes(p.id) ? { ...p, status: 'available' } : p
      )
    );

    // Free up court
    setCourts((prev) =>
      prev.map((c) =>
        c.id === match.courtId
          ? { ...c, status: 'empty', currentMatchId: null }
          : c
      )
    );

    // Smart Auto-Promote next queued match if exists
    setTimeout(() => {
      const remainingQueued = matches.filter(
        (m) => m.status === 'waiting' && m.courtId === match.courtId && m.id !== matchId
      );
      if (remainingQueued.length > 0) {
        // Auto alert or offer promotion
        const nextMatch = remainingQueued[0];
        if (confirm(`สนามว่างแล้ว! เริ่มแข่งคิวถัดไปเลยหรือไม่?`)) {
          handlePromoteMatch(nextMatch.id);
        }
      }
    }, 100);
  };

  // Cancel queue match
  const handleCancelMatch = (matchId: string) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    setMatches((prev) => prev.filter((m) => m.id !== matchId));

    // Release players back to available
    const matchPlayers = [...match.teamA, ...match.teamB];
    setPlayers((prev) =>
      prev.map((p) =>
        matchPlayers.includes(p.id) ? { ...p, status: 'available' } : p
      )
    );
  };

  // Promote waiting match to active play
  const handlePromoteMatch = (matchId: string) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? { ...m, status: 'playing', createdAt: new Date().toISOString() }
          : m
      )
    );

    setCourts((prev) =>
      prev.map((c) =>
        c.id === match.courtId
          ? { ...c, status: 'playing', currentMatchId: matchId }
          : c
      )
    );

    const matchPlayers = [...match.teamA, ...match.teamB];
    setPlayers((prev) =>
      prev.map((p) =>
        matchPlayers.includes(p.id) ? { ...p, status: 'playing' } : p
      )
    );
  };

  // Reset entire session (Clear stats, but preserve player database)
  const handleResetSession = () => {
    if (
      confirm(
        'คุณแน่ใจหรือไม่ที่จะรีเซ็ตข้อมูลการแข่งขันและค่าใช้จ่ายของวันนี้ทั้งหมด? (รายชื่อผู้เล่นหลักจะไม่ถูกลบ)'
      )
    ) {
      // Delete finished/active matches of today
      setMatches((prev) => prev.filter((m) => m.status === 'completed' && new Date(m.createdAt).toDateString() !== new Date().toDateString()));

      // Reset court status
      setCourts(INITIAL_COURTS);

      // Reset player availability to available and checkout some
      setPlayers((prev) =>
        prev.map((p) => ({
          ...p,
          status: 'available',
        }))
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-12 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Upper Navigation Banner */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-red-600 rounded-2xl blur opacity-25 animate-pulse"></div>
              <div className="relative p-2.5 bg-gradient-to-br from-amber-500 via-orange-600 to-red-700 rounded-2xl text-white shadow-lg shadow-orange-600/20 flex items-center gap-1.5 px-3.5 py-2 border border-amber-400/20">
                <span className="text-2xl animate-bounce" style={{ animationDuration: '3s' }}>🐯</span>
                <div className="flex flex-col leading-none">
                  <span className="text-[10px] font-black tracking-widest text-amber-200">เสือ</span>
                  <span className="text-base font-black tracking-tighter text-white">037</span>
                </div>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-800 flex items-center gap-2">
                BAD FRIDAY
                <span className="text-[10px] bg-red-50 text-red-600 border border-red-100 font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 bg-red-600 rounded-full animate-ping"></span>
                  ก๊วนแบดวันศุกร์
                </span>
              </h1>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="text-xs text-slate-400">ระบบจัดการผู้เล่นลงสนาม และสรุปค่าใช้จ่ายประจำวัน</p>
                <span className="text-slate-300 hidden sm:inline text-xs">|</span>
                <p className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  Design by Badminton care
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 text-xs font-semibold">
            {isAdmin ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="font-extrabold text-[11px]">👑 แอดมิน (joe.nana...)</span>
                <button
                  onClick={() => setAdminEmail('')}
                  className="ml-1 text-[10px] text-slate-400 hover:text-red-500 underline font-normal cursor-pointer"
                >
                  (ออก)
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthEmailInput('');
                  setAuthError('');
                  setShowAuthModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-transparent hover:border-slate-300 rounded-xl transition cursor-pointer font-extrabold text-[11px]"
              >
                <span>👤 ผู้เยี่ยมชม</span>
                <span className="text-slate-400 font-normal">(ล็อกอิน)</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>
                {new Date().toLocaleDateString('th-TH', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            </div>

            {isAdmin && (
              <button
                onClick={handleResetSession}
                className="px-3 py-1.5 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600 rounded-xl transition text-xs font-bold cursor-pointer"
                title="รีเซ็ตค่าการเล่นของวันนี้"
              >
                รีเซ็ตวันนี้
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Tabbed Layout Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200/60 mb-8 overflow-x-auto no-scrollbar gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('courts')}
            className={`pb-3 px-4 text-sm font-extrabold transition-all duration-200 flex items-center gap-2 border-b-2 shrink-0 ${
              activeTab === 'courts'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Activity className="w-4 h-4" />
            หน้าสนามแข่งขัน
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('players')}
              className={`pb-3 px-4 text-sm font-extrabold transition-all duration-200 flex items-center gap-2 border-b-2 shrink-0 ${
                activeTab === 'players'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Users className="w-4 h-4" />
              รายชื่อผู้เล่น ({players.length})
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('expenses')}
              className={`pb-3 px-4 text-sm font-extrabold transition-all duration-200 flex items-center gap-2 border-b-2 shrink-0 ${
                activeTab === 'expenses'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Receipt className="w-4 h-4" />
              สรุปค่าใช้จ่ายและหารเงิน
            </button>
          )}
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`pb-3 px-4 text-sm font-extrabold transition-all duration-200 flex items-center gap-2 border-b-2 shrink-0 ${
              activeTab === 'leaderboard'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Trophy className="w-4 h-4" />
            ทำเนียบผู้ชนะ (Leaderboard)
          </button>
          <button
            id="tab-bookings"
            onClick={() => setActiveTab('bookings')}
            className={`pb-3 px-4 text-sm font-extrabold transition-all duration-200 flex items-center gap-2 border-b-2 shrink-0 ${
              activeTab === 'bookings'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            จองสนามล่วงหน้า ({bookings.length})
          </button>
        </div>

        {/* Tab Contents with Transition Animations */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {activeTab === 'courts' && (
              <motion.div
                key="courts"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.15 }}
              >
                <CourtList
                  courts={courts}
                  matches={matches}
                  players={players}
                  onOpenMatchmaker={handleOpenMatchmaker}
                  onFinishMatch={handleFinishMatch}
                  onCancelMatch={handleCancelMatch}
                  onPromoteMatch={handlePromoteMatch}
                  onUpdateMatchShuttlecocks={handleUpdateMatchShuttlecocks}
                  isAdmin={isAdmin}
                />
              </motion.div>
            )}

            {activeTab === 'players' && (
              <motion.div
                key="players"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.15 }}
              >
                <PlayerManager
                  players={players}
                  onAddPlayer={handleAddPlayer}
                  onUpdatePlayer={handleUpdatePlayer}
                  onDeletePlayer={handleDeletePlayer}
                />
              </motion.div>
            )}

            {activeTab === 'expenses' && (
              <motion.div
                key="expenses"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.15 }}
              >
                <ExpenseSummary players={players} matches={matches} />
              </motion.div>
            )}

            {activeTab === 'leaderboard' && (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.15 }}
              >
                <WeeklyStats players={players} matches={matches} />
              </motion.div>
            )}

            {activeTab === 'bookings' && (
              <motion.div
                key="bookings"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.15 }}
              >
                <BookingManager
                  courts={courts}
                  bookings={bookings}
                  onAddBooking={handleAddBooking}
                  onConfirmBooking={handleConfirmBooking}
                  onDeleteBooking={handleDeleteBooking}
                  isAdmin={isAdmin}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Sliding Matchmaker Sidebar / Modal */}
      <AnimatePresence>
        {isMatchmakerOpen && (
          <Matchmaker
            players={players}
            courts={courts}
            matches={matches}
            onClose={() => setIsMatchmakerOpen(false)}
            onAddMatch={handleAddMatch}
          />
        )}
      </AnimatePresence>

      {/* Admin Authentication Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-slate-100 space-y-5 z-10 overflow-hidden text-slate-800"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    🔑 ล็อกอินยืนยันสิทธิ์แอดมิน
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    กรุณากรอกอีเมลผู้ดูแลเพื่อปลดล็อกแท็บและการควบคุมทั้งหมด
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const trimmed = authEmailInput.trim().toLowerCase();
                  if (trimmed === 'joe.nana.hanza8@gmail.com') {
                    setAdminEmail(trimmed);
                    setShowAuthModal(false);
                    // Reset active tab to courts just in case
                    setActiveTab('courts');
                  } else {
                    setAuthError('❌ ขออภัย! เฉพาะ joe.nana.hanza8@gmail.com เท่านั้นที่สามารถเป็นแอดมินได้');
                  }
                }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block">
                    อีเมลแอดมิน:
                  </label>
                  <input
                    type="email"
                    required
                    value={authEmailInput}
                    onChange={(e) => {
                      setAuthEmailInput(e.target.value);
                      if (authError) setAuthError('');
                    }}
                    placeholder="example@email.com"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-2xl text-sm font-semibold outline-none transition"
                  />
                  {authError && (
                    <p className="text-xs font-bold text-rose-500 mt-1.5 leading-relaxed">
                      {authError}
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAuthModal(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-2xl text-xs font-black text-slate-600 transition"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-600/10 transition"
                  >
                    ยืนยันตัวตน
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer credit */}
      <footer className="mt-16 border-t border-slate-200/60 py-8 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Bad Friday (เสือ 037). All rights reserved.</p>
          <p className="flex items-center gap-1.5 font-semibold text-slate-500">
            <span>Powering your weekly games</span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors px-2.5 py-0.5 rounded-full text-[11px] border border-emerald-100/50">
              Design by Badminton care
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
}
