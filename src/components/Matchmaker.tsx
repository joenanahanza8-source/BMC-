import { useState, useMemo } from 'react';
import { Player, Court, MatchType, MatchStatus, Match } from '../types';
import { Sparkles, Trophy, Shuffle, UserPlus, Trash, ArrowRightLeft, ShieldCheck, ChevronRight, HelpCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MatchmakerProps {
  players: Player[];
  courts: Court[];
  matches: Match[];
  onAddMatch: (match: Omit<Match, 'id' | 'createdAt' | 'completedAt' | 'duration' | 'shuttlecocks' | 'winner'>) => void;
  onClose: () => void;
}

export default function Matchmaker({
  players,
  courts,
  matches,
  onAddMatch,
  onClose,
}: MatchmakerProps) {
  const [selectedCourt, setSelectedCourt] = useState<string>(courts[0]?.id || '');
  const [matchType, setMatchType] = useState<MatchType>('doubles');
  const [status, setStatus] = useState<MatchStatus>('playing');

  // Manual Selection State
  const [teamA, setTeamA] = useState<string[]>([]);
  const [teamB, setTeamB] = useState<string[]>([]);

  // Eligible players: Checked-in AND NOT currently playing (available or waiting)
  const eligiblePlayers = useMemo(() => {
    return players.filter((p) => p.isCheckedIn && p.status !== 'playing');
  }, [players]);

  // Compute player matches played (for queue priority)
  const playerMatchesPlayed = useMemo(() => {
    const counts: Record<string, number> = {};
    players.forEach((p) => {
      counts[p.id] = 0;
    });
    matches.forEach((m) => {
      m.teamA.forEach((id) => {
        if (counts[id] !== undefined) counts[id]++;
      });
      m.teamB.forEach((id) => {
        if (counts[id] !== undefined) counts[id]++;
      });
    });
    return counts;
  }, [players, matches]);

  // Assign weights for skill balancing: Beginner = 1, Intermediate = 2, Advanced = 3
  const getSkillWeight = (level: Player['skillLevel']) => {
    switch (level) {
      case 'beginner': return 1;
      case 'intermediate': return 2;
      case 'advanced': return 3;
    }
  };

  // Smart Auto-Matchmaker Algorithm
  const handleAutoMatch = () => {
    // Clear current selections
    setTeamA([]);
    setTeamB([]);

    // Sort available players by matches played (ascending) to give priority to those who played the least.
    // If equal, sort by skill level
    const sortedAvailable = [...eligiblePlayers].sort((a, b) => {
      const aMatches = playerMatchesPlayed[a.id] || 0;
      const bMatches = playerMatchesPlayed[b.id] || 0;
      if (aMatches !== bMatches) return aMatches - bMatches;
      return getSkillWeight(b.skillLevel) - getSkillWeight(a.skillLevel);
    });

    const neededCount = matchType === 'singles' ? 2 : 4;
    if (sortedAvailable.length < neededCount) {
      alert(`ต้องการผู้เล่นพร้อมเล่นอย่างน้อย ${neededCount} คน (ปัจจุบันพร้อมเล่น ${sortedAvailable.length} คน)`);
      return;
    }

    // Select the first N players who are queueing
    const selected = sortedAvailable.slice(0, neededCount);

    if (matchType === 'singles') {
      // Just put 1 on each team
      setTeamA([selected[0].id]);
      setTeamB([selected[1].id]);
    } else {
      // For doubles, we want to balance the teams
      // We will search for a combination of 2v2 that minimizes the skill difference
      let bestCombination: { tA: string[]; tB: string[]; diff: number } | null = null;

      // Generate all possible 2v2 splits (there are only 3 ways to split 4 players into 2 teams)
      const p = selected;
      const combinations = [
        { tA: [p[0], p[1]], tB: [p[2], p[3]] },
        { tA: [p[0], p[2]], tB: [p[1], p[3]] },
        { tA: [p[0], p[3]], tB: [p[1], p[2]] },
      ];

      combinations.forEach((combo) => {
        const skillA = getSkillWeight(combo.tA[0].skillLevel) + getSkillWeight(combo.tA[1].skillLevel);
        const skillB = getSkillWeight(combo.tB[0].skillLevel) + getSkillWeight(combo.tB[1].skillLevel);
        const diff = Math.abs(skillA - skillB);

        if (!bestCombination || diff < bestCombination.diff) {
          bestCombination = {
            tA: combo.tA.map((x) => x.id),
            tB: combo.tB.map((x) => x.id),
            diff,
          };
        }
      });

      if (bestCombination) {
        setTeamA(bestCombination.tA);
        setTeamB(bestCombination.tB);
      }
    }
  };

  // Manual player toggle
  const handlePlayerSelect = (playerId: string) => {
    // If already on Team A, remove
    if (teamA.includes(playerId)) {
      setTeamA(teamA.filter((id) => id !== playerId));
      return;
    }
    // If already on Team B, remove
    if (teamB.includes(playerId)) {
      setTeamB(teamB.filter((id) => id !== playerId));
      return;
    }

    // Otherwise, find a slot to add
    const maxPerTeam = matchType === 'singles' ? 1 : 2;

    if (teamA.length < maxPerTeam) {
      setTeamA([...teamA, playerId]);
    } else if (teamB.length < maxPerTeam) {
      setTeamB([...teamB, playerId]);
    } else {
      // Both teams full, replace the oldest selection in Team A
      setTeamA([playerId]);
    }
  };

  const handleCreateMatch = () => {
    const requiredPlayers = matchType === 'singles' ? 2 : 4;
    const currentCount = teamA.length + teamB.length;

    if (currentCount < requiredPlayers) {
      alert(`กรุณาเลือกผู้เล่นให้ครบตามประเภทการแข่ง (${requiredPlayers} คน)`);
      return;
    }

    onAddMatch({
      courtId: selectedCourt,
      type: matchType,
      teamA,
      teamB,
      status,
    });

    onClose();
  };

  const getTeamSkillSum = (teamIds: string[]) => {
    return teamIds.reduce((sum, id) => {
      const p = players.find((x) => x.id === id);
      return sum + (p ? getSkillWeight(p.skillLevel) : 0);
    }, 0);
  };

  const teamASkill = getTeamSkillSum(teamA);
  const teamBSkill = getTeamSkillSum(teamB);
  const skillDiff = Math.abs(teamASkill - teamBSkill);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Shuffle className="w-5 h-5 text-emerald-600" />
              จัดคู่และผู้เล่นลงสนามแข่งขัน
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              เลือกสนาม ประเภท และจัดทีมแข่งขันโดยคลิกเลือกผู้เล่น หรือคลิกสุ่มอัตโนมัติแบบสมดุล
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Settings Section (Left side) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Court Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                เลือกสนามที่จะลงเล่น
              </label>
              <div className="grid grid-cols-2 gap-2">
                {courts.map((court) => {
                  const isBusy = court.status === 'playing';
                  return (
                    <button
                      key={court.id}
                      type="button"
                      onClick={() => setSelectedCourt(court.id)}
                      className={`p-3 rounded-xl border text-left font-medium transition flex flex-col gap-1 ${
                        selectedCourt === court.id
                          ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900 shadow-sm'
                          : 'border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      <span className="text-sm font-semibold">{court.name}</span>
                      <span className="text-[10px] opacity-75">
                        {isBusy ? '● มีแมตช์กำลังแข่ง' : '○ สนามว่าง'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Match Type */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                ประเภทการแข่งขัน
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMatchType('singles');
                    setTeamA([]);
                    setTeamB([]);
                  }}
                  className={`p-3 rounded-xl border text-center transition font-semibold text-sm ${
                    matchType === 'singles'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                      : 'border-slate-100 bg-slate-50 text-slate-600'
                  }`}
                >
                  ประเภทเดี่ยว (Singles)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMatchType('doubles');
                    setTeamA([]);
                    setTeamB([]);
                  }}
                  className={`p-3 rounded-xl border text-center transition font-semibold text-sm ${
                    matchType === 'doubles'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                      : 'border-slate-100 bg-slate-50 text-slate-600'
                  }`}
                >
                  ประเภทคู่ (Doubles)
                </button>
              </div>
            </div>

            {/* Ingress Status Option */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                เมื่อบันทึกแมตช์แล้ว
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('playing')}
                  className={`p-3 rounded-xl border text-center transition font-semibold text-sm ${
                    status === 'playing'
                      ? 'border-sky-500 bg-sky-50 text-sky-800'
                      : 'border-slate-100 bg-slate-50 text-slate-600'
                  }`}
                >
                  ลงสนามแข่งทันที
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('waiting')}
                  className={`p-3 rounded-xl border text-center transition font-semibold text-sm ${
                    status === 'waiting'
                      ? 'border-amber-500 bg-amber-50 text-amber-800'
                      : 'border-slate-100 bg-slate-50 text-slate-600'
                  }`}
                >
                  เข้าคิวรอลงสนาม
                </button>
              </div>
            </div>

            {/* Smart Matching Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleAutoMatch}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm"
              >
                <Sparkles className="w-4 h-4" />
                สุ่มทีมให้แบบบาลานซ์ฝีมือ (Smart Match)
              </button>
              <p className="text-[10px] text-slate-400 text-center mt-1.5 leading-normal">
                จัดคู่ให้อัตโนมัติ โดยเน้นผู้เล่นที่ได้เล่นน้อยที่สุด และจัดระดับฝีมือทีมให้สูสีกันที่สุด
              </p>
            </div>
          </div>

          {/* Player Selection & Arena Grid (Right side) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Visual Arena Design (Preview teams) */}
            <div className="bg-emerald-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-inner flex flex-col items-stretch min-h-[220px] justify-between">
              {/* Badminton Court Lines (Visual design!) */}
              <div className="absolute inset-0 border border-emerald-500/30 m-4 pointer-events-none rounded">
                <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-emerald-500/40" />
                <div className="absolute inset-x-0 top-1/2 border-t border-emerald-500/40" />
              </div>

              {/* Team A Slot */}
              <div className="flex flex-col items-center justify-center relative z-10">
                <span className="text-[10px] bg-emerald-800/80 border border-emerald-700 px-2 py-0.5 rounded-full mb-2 font-semibold">
                  ทีม A (ฝีมือรวม: {teamASkill})
                </span>
                <div className="flex gap-4 justify-center items-center min-h-[64px]">
                  {teamA.length === 0 ? (
                    <span className="text-xs text-emerald-400 italic">ว่าง (เลือกผู้เล่น)</span>
                  ) : (
                    teamA.map((id) => {
                      const p = players.find((x) => x.id === id);
                      if (!p) return null;
                      return (
                        <div key={id} className="flex flex-col items-center gap-1">
                          <div className="relative">
                            <img referrerPolicy="no-referrer" src={p.avatar} alt="" className="w-10 h-10 rounded-full border-2 border-emerald-400 bg-emerald-800" />
                            <button
                              onClick={() => setTeamA(teamA.filter((x) => x !== id))}
                              className="absolute -top-1 -right-1 bg-rose-600 hover:bg-rose-700 text-white p-0.5 rounded-full"
                            >
                              <Trash className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-xs font-medium max-w-[80px] truncate">{p.name}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Verses Divider */}
              <div className="flex justify-center items-center relative z-10 my-1">
                <span className="bg-amber-500 text-slate-900 font-black px-3 py-1 rounded-full text-xs shadow-md">
                  VS
                </span>
              </div>

              {/* Team B Slot */}
              <div className="flex flex-col items-center justify-center relative z-10">
                <div className="flex gap-4 justify-center items-center min-h-[64px] mb-2">
                  {teamB.length === 0 ? (
                    <span className="text-xs text-emerald-400 italic">ว่าง (เลือกผู้เล่น)</span>
                  ) : (
                    teamB.map((id) => {
                      const p = players.find((x) => x.id === id);
                      if (!p) return null;
                      return (
                        <div key={id} className="flex flex-col items-center gap-1">
                          <div className="relative">
                            <img referrerPolicy="no-referrer" src={p.avatar} alt="" className="w-10 h-10 rounded-full border-2 border-emerald-400 bg-emerald-800" />
                            <button
                              onClick={() => setTeamB(teamB.filter((x) => x !== id))}
                              className="absolute -top-1 -right-1 bg-rose-600 hover:bg-rose-700 text-white p-0.5 rounded-full"
                            >
                              <Trash className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-xs font-medium max-w-[80px] truncate">{p.name}</span>
                        </div>
                      );
                    })
                  )}
                </div>
                <span className="text-[10px] bg-emerald-800/80 border border-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                  ทีม B (ฝีมือรวม: {teamBSkill})
                </span>
              </div>

              {/* Team Balance status banner */}
              {teamA.length > 0 && teamB.length > 0 && (
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-emerald-950/80 px-2 py-0.5 rounded text-[10px]">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>
                    {skillDiff === 0 ? 'ความสมดุลทีมระดับสุดยอด' : `ความต่างฝีมือทีม: ${skillDiff}`}
                  </span>
                </div>
              )}
            </div>

            {/* List of active queue players */}
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                คลิกเลือกผู้เล่นเพื่อจัดทีมแข่ง ({eligiblePlayers.length} คนว่าง/รอ)
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[180px] overflow-y-auto pr-1">
                {eligiblePlayers.length === 0 ? (
                  <div className="col-span-full py-6 text-center bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-400 rounded-xl">
                    ไม่มีผู้เล่นที่ว่างอยู่เช็กอินเข้าร่วม
                  </div>
                ) : (
                  eligiblePlayers.map((player) => {
                    const isSelectedA = teamA.includes(player.id);
                    const isSelectedB = teamB.includes(player.id);
                    const isSelected = isSelectedA || isSelectedB;
                    const count = playerMatchesPlayed[player.id] || 0;

                    let lvlColor = 'bg-emerald-100 text-emerald-800';
                    if (player.skillLevel === 'intermediate') lvlColor = 'bg-blue-100 text-blue-800';
                    if (player.skillLevel === 'advanced') lvlColor = 'bg-indigo-100 text-indigo-800';

                    return (
                      <button
                        key={player.id}
                        onClick={() => handlePlayerSelect(player.id)}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2.5 transition relative overflow-hidden ${
                          isSelectedA
                            ? 'border-sky-500 bg-sky-50'
                            : isSelectedB
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-slate-100 bg-white hover:bg-slate-50 shadow-sm'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <img referrerPolicy="no-referrer" src={player.avatar} alt="" className="w-8 h-8 rounded-full border" />
                          {isSelectedA && (
                            <span className="absolute -top-1.5 -right-1.5 bg-sky-500 text-white font-black text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
                              A
                            </span>
                          )}
                          {isSelectedB && (
                            <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-900 font-black text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
                              B
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-700 truncate">{player.name}</p>
                          <div className="flex gap-1 items-center mt-1">
                            <span className={`text-[8px] px-1 py-0.1 rounded font-semibold ${lvlColor}`}>
                              {player.skillLevel === 'beginner' ? 'มือใหม่' : player.skillLevel === 'intermediate' ? 'กลาง' : 'โปร'}
                            </span>
                            <span className="text-[8px] text-slate-400">
                              เล่นแล้ว: {count} แมตช์
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>ต้องการเดี่ยว 2 คน / คู่ 4 คน</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 rounded-xl transition"
            >
              ยกเลิก
            </button>
            <button
              id="btn-confirm-match"
              onClick={handleCreateMatch}
              className="px-6 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow transition"
            >
              ส่งลงสนาม / เข้าคิวแข่งขัน
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
