import { useMemo, useState } from 'react';
import { Player, Match } from '../types';
import { Award, Trophy, Star, History, Shield, TrendingUp, Calendar, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface WeeklyStatsProps {
  players: Player[];
  matches: Match[];
}

interface PlayerStat {
  id: string;
  name: string;
  avatar: string;
  skillLevel: Player['skillLevel'];
  wins: number;
  losses: number;
  draws: number;
  totalPlayed: number;
  winRate: number;
  shuttlesSmashed: number;
}

export default function WeeklyStats({ players, matches }: WeeklyStatsProps) {
  const [timeframe, setTimeframe] = useState<'weekly' | 'alltime'>('weekly');

  // Filter matches based on timeframe
  const filteredMatches = useMemo(() => {
    const completed = matches.filter((m) => m.status === 'completed');
    if (timeframe === 'alltime') return completed;

    // Filter past 7 days for Weekly stats
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return completed.filter((m) => {
      const matchDate = new Date(m.createdAt || m.completedAt || '');
      return matchDate >= sevenDaysAgo;
    });
  }, [matches, timeframe]);

  // Aggregate stats per player
  const leaderboard: PlayerStat[] = useMemo(() => {
    const statsMap: Record<string, Omit<PlayerStat, 'winRate'>> = {};

    // Initialize map
    players.forEach((p) => {
      statsMap[p.id] = {
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        skillLevel: p.skillLevel,
        wins: 0,
        losses: 0,
        draws: 0,
        totalPlayed: 0,
        shuttlesSmashed: 0,
      };
    });

    // Populate stats from matches
    filteredMatches.forEach((match) => {
      const isTeamA = (id: string) => match.teamA.includes(id);
      const isTeamB = (id: string) => match.teamB.includes(id);

      const allPlayers = [...match.teamA, ...match.teamB];

      allPlayers.forEach((pId) => {
        if (!statsMap[pId]) return; // Player might have been deleted

        const playerStat = statsMap[pId];
        playerStat.totalPlayed++;
        playerStat.shuttlesSmashed += match.shuttlecocks;

        if (match.winner === 'draw') {
          playerStat.draws++;
        } else if (match.winner === 'teamA') {
          if (isTeamA(pId)) playerStat.wins++;
          else if (isTeamB(pId)) playerStat.losses++;
        } else if (match.winner === 'teamB') {
          if (isTeamB(pId)) playerStat.wins++;
          else if (isTeamA(pId)) playerStat.losses++;
        }
      });
    });

    // Convert to array and calculate win rates
    return Object.values(statsMap)
      .map((stat) => {
        const winRate = stat.totalPlayed > 0 ? (stat.wins / stat.totalPlayed) * 100 : 0;
        return {
          ...stat,
          winRate,
        };
      })
      // Sort by Wins desc, then by win rate desc, then by matches played desc
      .sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        return b.totalPlayed - a.totalPlayed;
      });
  }, [players, filteredMatches]);

  // Top 3 Players for Podium
  const topThree = useMemo(() => {
    return leaderboard.slice(0, 3);
  }, [leaderboard]);

  // Rest of the players
  const runnersUp = useMemo(() => {
    return leaderboard.slice(3);
  }, [leaderboard]);

  const skillBadge = (level: Player['skillLevel']) => {
    switch (level) {
      case 'beginner': return 'bg-emerald-100 text-emerald-800';
      case 'intermediate': return 'bg-blue-100 text-blue-800';
      case 'advanced': return 'bg-indigo-100 text-indigo-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            สถิติผู้ชนะและทำเนียบผู้เล่น (Leaderboard)
          </h2>
          <p className="text-slate-500 text-sm">
            ทำเนียบผู้เล่นทรงคุณค่า MVP เก็บรวบรวมอัตราการชนะและสถิติรายสัปดาห์
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="bg-slate-100 p-1 rounded-xl flex self-start sm:self-auto shadow-inner">
          <button
            onClick={() => setTimeframe('weekly')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
              timeframe === 'weekly'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            สัปดาห์นี้ (7 วันล่าสุด)
          </button>
          <button
            onClick={() => setTimeframe('alltime')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
              timeframe === 'alltime'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            ทั้งหมด (All-time)
          </button>
        </div>
      </div>

      {/* Podium Showcase (Top 3) */}
      {topThree.length > 0 && topThree[0].totalPlayed > 0 ? (
        <div className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl space-y-6">
          <div className="text-center space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 inline-block">
              ผู้เล่นยอดเยี่ยมประจำก๊วน MVP
            </span>
            <h3 className="text-lg font-bold text-slate-100">โพเดียมเกียรติยศ</h3>
          </div>

          <div className="flex items-end justify-center gap-4 pt-10 pb-4 max-w-xl mx-auto">
            {/* 2nd Place (Left) */}
            {topThree[1] && topThree[1].totalPlayed > 0 && (
              <div className="flex-1 flex flex-col items-center">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-300 shadow-lg bg-slate-800">
                    <img referrerPolicy="no-referrer" src={topThree[1].avatar} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="absolute -top-3 -right-1 bg-slate-300 text-slate-900 font-bold text-xs p-1 rounded-full w-6 h-6 flex items-center justify-center border-2 border-slate-800">
                    2
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-200 mt-2 text-center max-w-[90px] truncate">{topThree[1].name.split(' ')[0]}</span>
                <span className="text-[10px] text-slate-400 mt-0.5">{topThree[1].wins} ชนะ / WR {Math.round(topThree[1].winRate)}%</span>
                {/* 2nd place stand */}
                <div className="w-full h-16 bg-slate-700/60 mt-3 rounded-t-xl border-t-2 border-slate-500 flex items-center justify-center">
                  <span className="font-extrabold text-slate-400 text-xl">II</span>
                </div>
              </div>
            )}

            {/* 1st Place (Center) */}
            {topThree[0] && topThree[0].totalPlayed > 0 && (
              <div className="flex-1 flex flex-col items-center z-10">
                <div className="relative">
                  {/* Glowing halo */}
                  <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full blur-sm opacity-70 animate-pulse" />
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-amber-400 shadow-xl relative bg-slate-800">
                    <img referrerPolicy="no-referrer" src={topThree[0].avatar} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 drop-shadow-md">
                    <Trophy className="w-6 h-6 text-amber-400 animate-bounce" />
                  </div>
                  <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-900 font-bold text-xs p-1 rounded-full w-6 h-6 flex items-center justify-center border-2 border-slate-900">
                    1
                  </span>
                </div>
                <span className="text-sm font-black text-amber-300 mt-2 text-center max-w-[100px] truncate">{topThree[0].name.split(' ')[0]}</span>
                <span className="text-xs font-bold text-white mt-0.5">{topThree[0].wins} ชนะ / WR {Math.round(topThree[0].winRate)}%</span>
                {/* 1st place stand */}
                <div className="w-full h-24 bg-gradient-to-b from-amber-500/80 to-amber-600/50 mt-3 rounded-t-2xl border-t-4 border-amber-400 flex flex-col items-center justify-center shadow-lg">
                  <span className="font-extrabold text-amber-200 text-2xl">I</span>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-amber-200/80">MVP</span>
                </div>
              </div>
            )}

            {/* 3rd Place (Right) */}
            {topThree[2] && topThree[2].totalPlayed > 0 && (
              <div className="flex-1 flex flex-col items-center">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-amber-700 shadow-lg bg-slate-800">
                    <img referrerPolicy="no-referrer" src={topThree[2].avatar} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="absolute -top-3 -right-1 bg-amber-700 text-amber-100 font-bold text-xs p-1 rounded-full w-6 h-6 flex items-center justify-center border-2 border-slate-800">
                    3
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-200 mt-2 text-center max-w-[90px] truncate">{topThree[2].name.split(' ')[0]}</span>
                <span className="text-[10px] text-slate-400 mt-0.5">{topThree[2].wins} ชนะ / WR {Math.round(topThree[2].winRate)}%</span>
                {/* 3rd place stand */}
                <div className="w-full h-12 bg-slate-700/40 mt-3 rounded-t-xl border-t-2 border-amber-800 flex items-center justify-center">
                  <span className="font-extrabold text-amber-800 text-xl">III</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400 text-sm">
          <History className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          ยังไม่มีข้อมูลการแข่งขันที่เสร็จสมบูรณ์ในรอบที่ระบุ
        </div>
      )}

      {/* All Players Stats List */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            ตารางอันดับสถิติผู้เล่นทั้งหมด
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3.5 px-6 text-center w-16">อันดับ</th>
                <th className="py-3.5 px-6">ชื่อผู้เล่น</th>
                <th className="py-3.5 px-6 text-center">แข่งทั้งหมด</th>
                <th className="py-3.5 px-6 text-center text-emerald-600">ชนะ</th>
                <th className="py-3.5 px-6 text-center text-rose-500">แพ้</th>
                <th className="py-3.5 px-6 text-center text-amber-600">เสมอ</th>
                <th className="py-3.5 px-6 text-right">อัตราชนะ Win Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {leaderboard.map((pStat, index) => {
                const isTop3 = index < 3 && pStat.totalPlayed > 0;
                let rankVisual = <span>{index + 1}</span>;
                if (isTop3) {
                  if (index === 0) rankVisual = <span className="inline-block p-1 bg-amber-100 text-amber-800 rounded-full"><Trophy className="w-4 h-4" /></span>;
                  if (index === 1) rankVisual = <span className="inline-block p-1 bg-slate-200 text-slate-800 rounded-full"><Star className="w-4 h-4" /></span>;
                  if (index === 2) rankVisual = <span className="inline-block p-1 bg-amber-50 text-amber-900 rounded-full"><Award className="w-4 h-4" /></span>;
                }

                return (
                  <tr key={pStat.id} className="hover:bg-slate-50/40 transition">
                    <td className="py-4 px-6 text-center font-bold text-slate-500">
                      <div className="flex justify-center">{rankVisual}</div>
                    </td>
                    <td className="py-4 px-6 flex items-center gap-3">
                      <img referrerPolicy="no-referrer" src={pStat.avatar} alt="" className="w-8 h-8 rounded-full border shadow-xs" />
                      <div>
                        <span className="font-semibold text-slate-800 block">{pStat.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded border ${skillBadge(pStat.skillLevel)}`}>
                          {pStat.skillLevel === 'beginner' ? 'มือใหม่' : pStat.skillLevel === 'intermediate' ? 'มือกลาง' : 'มือโปร'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center font-bold text-slate-600">
                      {pStat.totalPlayed} นัด
                    </td>
                    <td className="py-4 px-6 text-center font-extrabold text-emerald-600 bg-emerald-50/20">
                      {pStat.wins}
                    </td>
                    <td className="py-4 px-6 text-center font-bold text-rose-500">
                      {pStat.losses}
                    </td>
                    <td className="py-4 px-6 text-center font-semibold text-amber-600 bg-amber-50/10">
                      {pStat.draws}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-extrabold text-slate-800 text-sm">
                          {pStat.totalPlayed > 0 ? `${Math.round(pStat.winRate)}%` : '-'}
                        </span>
                        {pStat.totalPlayed > 0 && (
                          <div className="w-16 bg-slate-100 h-1 rounded-full overflow-hidden mt-1">
                            <div className="bg-emerald-500 h-full" style={{ width: `${pStat.winRate}%` }} />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
