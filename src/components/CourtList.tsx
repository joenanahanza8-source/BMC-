import { useState, useEffect } from 'react';
import { Court, Match, Player, MatchWinner } from '../types';
import { Play, RotateCcw, Flame, CheckCircle2, ChevronRight, Hash, UserCheck, Trash2, Clock, Swords } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CourtListProps {
  courts: Court[];
  matches: Match[];
  players: Player[];
  onOpenMatchmaker: (courtId: string) => void;
  onFinishMatch: (matchId: string, winner: MatchWinner, shuttlecocks: number, duration: number) => void;
  onCancelMatch: (matchId: string) => void;
  onPromoteMatch: (matchId: string) => void;
  onUpdateMatchShuttlecocks: (matchId: string, count: number) => void;
  isAdmin?: boolean;
}

export default function CourtList({
  courts,
  matches,
  players,
  onOpenMatchmaker,
  onFinishMatch,
  onCancelMatch,
  onPromoteMatch,
  onUpdateMatchShuttlecocks,
  isAdmin = false,
}: CourtListProps) {
  const [finishingMatchId, setFinishingMatchId] = useState<string | null>(null);
  const [selectedWinner, setSelectedWinner] = useState<MatchWinner>(null);
  const [finalShuttlecocks, setFinalShuttlecocks] = useState<number>(1);
  const [finalDuration, setFinalDuration] = useState<number>(15);

  // Active playing matches
  const activeMatches = matches.filter((m) => m.status === 'playing');

  // Queue/waiting matches grouped by court
  const queuedMatchesByCourt = (courtId: string) => {
    return matches.filter((m) => m.status === 'waiting' && m.courtId === courtId);
  };

  // Helper to resolve player info
  const getPlayerName = (id: string) => players.find((p) => p.id === id)?.name || 'ผู้เล่นนิรนาม';
  const getPlayerAvatar = (id: string) => players.find((p) => p.id === id)?.avatar || '';

  // Open finishing modal and prefill data
  const handleOpenFinishModal = (match: Match) => {
    setFinishingMatchId(match.id);
    setSelectedWinner('teamA');
    setFinalShuttlecocks(match.shuttlecocks);

    // Calculate approximate elapsed minutes
    const elapsedMs = Date.now() - new Date(match.createdAt).getTime();
    const elapsedMins = Math.max(1, Math.round(elapsedMs / 60000));
    setFinalDuration(elapsedMins);
  };

  const handleSaveCompletion = () => {
    if (!finishingMatchId) return;
    onFinishMatch(finishingMatchId, selectedWinner, finalShuttlecocks, finalDuration);
    setFinishingMatchId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-500" />
          สถานะสนามและการแข่งขัน
        </h2>
        <p className="text-slate-500 text-sm">
          ควบคุมและบันทึกผลการเล่นของแต่ละสนามแบบเรียลไทม์
        </p>
      </div>

      {/* Courts Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courts.map((court) => {
          // Find if there is an active playing match for this court
          const activeMatch = activeMatches.find((m) => m.courtId === court.id);
          const queue = queuedMatchesByCourt(court.id);

          return (
            <div
              key={court.id}
              className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-slate-200 transition relative overflow-hidden"
            >
              {/* Top Banner Indicator */}
              <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className={`w-3.5 h-3.5 rounded-full ${activeMatch ? 'bg-sky-500 animate-pulse' : 'bg-slate-300'}`} />
                  <h3 className="font-bold text-slate-800 text-base">{court.name}</h3>
                </div>
                {activeMatch && (
                  <span className="text-xs bg-sky-50 text-sky-700 font-bold px-3 py-1 rounded-full border border-sky-100">
                    กำลังแข่งขัน
                  </span>
                )}
                {!activeMatch && (
                  <span className="text-xs bg-slate-50 text-slate-400 font-medium px-3 py-1 rounded-full border border-slate-100">
                    สนามว่าง
                  </span>
                )}
              </div>

              {/* Court Main Area */}
              <div className="flex-1 py-2">
                {activeMatch ? (
                  <div className="space-y-6">
                    {/* Versus layout of active match */}
                    <div className="flex items-center justify-between gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                      {/* Team A */}
                      <div className="flex-1 flex flex-col items-center text-center space-y-2">
                        <span className="text-[10px] font-bold text-sky-600 tracking-wider">ทีม A</span>
                        <div className="flex -space-x-2">
                          {activeMatch.teamA.map((id) => (
                            <img
                              key={id}
                              referrerPolicy="no-referrer"
                              src={getPlayerAvatar(id)}
                              alt=""
                              title={getPlayerName(id)}
                              className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover bg-slate-200"
                            />
                          ))}
                        </div>
                        <div className="text-xs font-semibold text-slate-700 max-w-[120px] truncate">
                          {activeMatch.teamA.map((id) => getPlayerName(id).split(' ')[0]).join(' / ')}
                        </div>
                      </div>

                      {/* VS Center */}
                      <div className="shrink-0 flex flex-col items-center">
                        <span className="text-xs text-slate-300 font-bold border border-slate-200 bg-white shadow-sm px-2.5 py-1 rounded-full">
                          VS
                        </span>
                        {/* Live Timer widget */}
                        <LiveTimer startTime={activeMatch.createdAt} />
                      </div>

                      {/* Team B */}
                      <div className="flex-1 flex flex-col items-center text-center space-y-2">
                        <span className="text-[10px] font-bold text-emerald-600 tracking-wider">ทีม B</span>
                        <div className="flex -space-x-2">
                          {activeMatch.teamB.map((id) => (
                            <img
                              key={id}
                              referrerPolicy="no-referrer"
                              src={getPlayerAvatar(id)}
                              alt=""
                              title={getPlayerName(id)}
                              className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover bg-slate-200"
                            />
                          ))}
                        </div>
                        <div className="text-xs font-semibold text-slate-700 max-w-[120px] truncate">
                          {activeMatch.teamB.map((id) => getPlayerName(id).split(' ')[0]).join(' / ')}
                        </div>
                      </div>
                    </div>

                    {/* Shuttlecock controls */}
                    <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-100/30">
                      <div className="flex items-center gap-2">
                        <img referrerPolicy="no-referrer" src="https://cdn-icons-png.flaticon.com/512/3255/3255651.png" className="w-5 h-5 shrink-0" alt="shuttle" />
                        <div>
                          <span className="text-xs font-bold text-slate-700 block">ลูกขนไก่ที่ใช้</span>
                          <span className="text-[10px] text-slate-400">ลูกละ 25 บาท</span>
                        </div>
                      </div>
                      {isAdmin ? (
                        <div className="flex items-center gap-3">
                          <button
                            id={`sub-shuttle-${activeMatch.id}`}
                            onClick={() => onUpdateMatchShuttlecocks(activeMatch.id, Math.max(0, activeMatch.shuttlecocks - 1))}
                            className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition flex items-center justify-center font-bold text-slate-500 shadow-sm cursor-pointer"
                          >
                            -
                          </button>
                          <span className="text-sm font-extrabold text-slate-800 w-6 text-center">
                            {activeMatch.shuttlecocks}
                          </span>
                          <button
                            id={`add-shuttle-${activeMatch.id}`}
                            onClick={() => onUpdateMatchShuttlecocks(activeMatch.id, activeMatch.shuttlecocks + 1)}
                            className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition flex items-center justify-center font-bold text-slate-500 shadow-sm cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs font-black text-slate-700 bg-slate-100/80 border border-slate-200/50 px-3.5 py-1.5 rounded-xl">
                          {activeMatch.shuttlecocks} ลูก
                        </div>
                      )}
                    </div>
 
                    {/* Completion Buttons */}
                    {isAdmin ? (
                      <button
                        id={`btn-finish-match-${activeMatch.id}`}
                        onClick={() => handleOpenFinishModal(activeMatch)}
                        className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm transition flex items-center justify-center gap-2 text-sm cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        จบการแข่งขัน & บันทึกผล
                      </button>
                    ) : (
                      <div className="w-full py-2.5 px-4 bg-slate-50 text-slate-500 rounded-xl font-bold flex items-center justify-center gap-2 text-xs border border-slate-100">
                        <Clock className="w-4 h-4 text-slate-400 animate-spin animate-duration-3000" />
                        กำลังจับเวลาแข่งขัน...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <Swords className="w-8 h-8 text-slate-300" />
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700">ไม่มีแมตช์ที่กำลังแข่ง</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-[200px] leading-relaxed">
                        เลือกผู้เล่นและลงชื่อแข่งขันเพื่อเริ่มต้นนับเวลาลงสนาม
                      </p>
                    </div>
                    {isAdmin ? (
                      <button
                        id={`btn-empty-court-pair-${court.id}`}
                        onClick={() => onOpenMatchmaker(court.id)}
                        className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800 shadow-xs rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        + จับคู่ลงเล่น
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-slate-400 bg-slate-100/60 border border-slate-100 px-3.5 py-1.5 rounded-2xl">
                        สนามว่าง (รอแอดมินจัดคิว)
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Waiting queue for this court */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
                  คิวรอลงสนามถัดไป ({queue.length})
                </span>

                {queue.length === 0 ? (
                  <span className="text-[11px] text-slate-400 italic block">ไม่มีแมตช์เข้าคิวไว้</span>
                ) : (
                  <div className="space-y-2.5">
                    {queue.map((match, idx) => (
                      <div
                        id={`queue-match-${match.id}`}
                        key={match.id}
                        className="flex items-center justify-between p-2.5 bg-amber-50/30 border border-amber-200/40 rounded-xl"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                            คิวที่ {idx + 1}
                          </span>
                          <div className="flex -space-x-1.5">
                            {[...match.teamA, ...match.teamB].map((id) => (
                              <img
                                key={id}
                                referrerPolicy="no-referrer"
                                src={getPlayerAvatar(id)}
                                alt=""
                                className="w-6 h-6 rounded-full border border-white shadow-xs object-cover"
                              />
                            ))}
                          </div>
                          <span className="text-[11px] text-slate-600 font-semibold truncate max-w-[140px]">
                            {match.type === 'singles' ? 'เดี่ยว' : 'คู่'} - {[...match.teamA].map(id => getPlayerName(id).split(' ')[0]).join('/')}
                          </span>
                        </div>

                        {isAdmin && (
                          <div className="flex items-center gap-1.5">
                            {/* Promote waiting match to active if court is empty */}
                            {!activeMatch && (
                              <button
                                id={`promote-match-${match.id}`}
                                onClick={() => onPromoteMatch(match.id)}
                                className="text-[10px] px-2 py-1 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-sm transition cursor-pointer"
                              >
                                ลงเล่นเลย
                              </button>
                            )}
                            <button
                              id={`cancel-match-${match.id}`}
                              onClick={() => onCancelMatch(match.id)}
                              className="p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-md transition cursor-pointer"
                              title="ยกเลิกคิว"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Dialog Modal */}
      <AnimatePresence>
        {finishingMatchId && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 shadow-xl w-full max-w-md space-y-6"
            >
              <div>
                <h3 className="text-lg font-bold text-slate-800">ยืนยันผลการแข่งขัน</h3>
                <p className="text-xs text-slate-400 mt-1">กรอกข้อมูลผู้ชนะ รายละเอียดแมตช์ เพื่อเก็บบันทึกสถิติ</p>
              </div>

              {/* Selector for Winner */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  ทีมผู้ชนะการแข่งขัน
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedWinner('teamA')}
                    className={`py-3 px-2 text-center rounded-xl border text-sm font-bold transition flex flex-col gap-1 ${
                      selectedWinner === 'teamA'
                        ? 'border-sky-500 bg-sky-50 text-sky-800'
                        : 'border-slate-100 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span>ทีม A</span>
                    <span className="text-[9px] font-normal opacity-75">ชนะ (A Win)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedWinner('draw')}
                    className={`py-3 px-2 text-center rounded-xl border text-sm font-bold transition flex flex-col gap-1 ${
                      selectedWinner === 'draw'
                        ? 'border-slate-400 bg-slate-100 text-slate-800'
                        : 'border-slate-100 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span>เสมอกัน</span>
                    <span className="text-[9px] font-normal opacity-75">เสมอ (Draw)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedWinner('teamB')}
                    className={`py-3 px-2 text-center rounded-xl border text-sm font-bold transition flex flex-col gap-1 ${
                      selectedWinner === 'teamB'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                        : 'border-slate-100 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span>ทีม B</span>
                    <span className="text-[9px] font-normal opacity-75">ชนะ (B Win)</span>
                  </button>
                </div>
              </div>

              {/* Final inputs for Shuttlecocks and Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="final-shuttles" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    จำนวนลูกขนไก่ที่ใช้
                  </label>
                  <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setFinalShuttlecocks(Math.max(0, finalShuttlecocks - 1))}
                      className="px-3 py-2 bg-slate-50 hover:bg-slate-100 font-bold border-r text-slate-500 text-sm"
                    >
                      -
                    </button>
                    <input
                      id="final-shuttles"
                      type="number"
                      value={finalShuttlecocks}
                      onChange={(e) => setFinalShuttlecocks(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full text-center py-2 focus:outline-none text-sm font-extrabold text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setFinalShuttlecocks(finalShuttlecocks + 1)}
                      className="px-3 py-2 bg-slate-50 hover:bg-slate-100 font-bold border-l text-slate-500 text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="final-duration" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    เวลาที่แข่งขัน (นาที)
                  </label>
                  <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setFinalDuration(Math.max(1, finalDuration - 5))}
                      className="px-3 py-2 bg-slate-50 hover:bg-slate-100 font-bold border-r text-slate-500 text-sm"
                    >
                      -
                    </button>
                    <input
                      id="final-duration"
                      type="number"
                      value={finalDuration}
                      onChange={(e) => setFinalDuration(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full text-center py-2 focus:outline-none text-sm font-extrabold text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setFinalDuration(finalDuration + 5)}
                      className="px-3 py-2 bg-slate-50 hover:bg-slate-100 font-bold border-l text-slate-500 text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFinishingMatchId(null)}
                  className="flex-1 py-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-100 transition"
                >
                  ยกเลิก
                </button>
                <button
                  id="btn-confirm-completion"
                  type="button"
                  onClick={handleSaveCompletion}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition"
                >
                  บันทึกผลแมตช์
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Live timer component
function LiveTimer({ startTime }: { startTime: string }) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const calculateTime = () => {
      const ms = Date.now() - new Date(startTime).getTime();
      const mins = Math.floor(ms / 60000);
      const secs = Math.floor((ms % 60000) / 1000);
      const str = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      setElapsed(str);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="flex items-center gap-1.5 mt-2 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 text-amber-600">
      <Clock className="w-3.5 h-3.5" />
      <span className="font-mono text-xs font-bold">{elapsed}</span>
    </div>
  );
}
