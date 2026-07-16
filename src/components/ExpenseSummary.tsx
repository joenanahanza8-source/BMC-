import { useState, useMemo } from 'react';
import { Player, Match } from '../types';
import { Receipt, Coins, ShieldAlert, CheckCircle, Copy, Check, Info, FileText } from 'lucide-react';
import { motion } from 'motion/react';

interface ExpenseSummaryProps {
  players: Player[];
  matches: Match[];
}

export default function ExpenseSummary({ players, matches }: ExpenseSummaryProps) {
  const [copied, setCopied] = useState(false);

  // Active today's checked-in players
  const checkedInPlayers = useMemo(() => {
    return players.filter((p) => p.isCheckedIn);
  }, [players]);

  // Today's completed matches
  const completedMatches = useMemo(() => {
    // Matches that were completed and belong to "today" (or general active ones)
    // We assume any match completed during this active state/list
    return matches.filter((m) => m.status === 'completed');
  }, [matches]);

  // Financial constants
  const COURT_MAINT_FEE = 30; // Baht per player
  const SHUTTLE_FEE_PER_PLAY = 25; // Baht per match per player

  // Totals
  const totalPlayers = checkedInPlayers.length;
  const totalCourtMaintenance = totalPlayers * COURT_MAINT_FEE;

  const totalShuttlesUsed = useMemo(() => {
    return completedMatches.reduce((sum, m) => sum + m.shuttlecocks, 0);
  }, [completedMatches]);

  const totalPlays = useMemo(() => {
    return completedMatches.reduce((sum, m) => sum + (m.teamA.length + m.teamB.length), 0);
  }, [completedMatches]);

  const totalShuttleCost = totalPlays * SHUTTLE_FEE_PER_PLAY;
  const totalCost = totalCourtMaintenance + totalShuttleCost;

  // Calculation details per player
  const playerBills = useMemo(() => {
    const bills: Record<string, { court: number; shuttle: number; total: number; matchesPlayed: number }> = {};

    // Initialize bills for checked-in players
    checkedInPlayers.forEach((p) => {
      bills[p.id] = {
        court: COURT_MAINT_FEE,
        shuttle: 0,
        total: COURT_MAINT_FEE,
        matchesPlayed: 0,
      };
    });

    // Count total matches played for each player
    completedMatches.forEach((match) => {
      const allMatchPlayers = [...match.teamA, ...match.teamB];
      allMatchPlayers.forEach((pId) => {
        if (bills[pId]) {
          bills[pId].matchesPlayed++;
        }
      });
    });

    // Pay-per-play: calculate shuttle costs based strictly on matches played (25 Baht per play)
    checkedInPlayers.forEach((p) => {
      const shuttleCost = bills[p.id].matchesPlayed * SHUTTLE_FEE_PER_PLAY;
      bills[p.id].shuttle = shuttleCost;
      bills[p.id].total = bills[p.id].court + shuttleCost;
    });

    return bills;
  }, [checkedInPlayers, completedMatches]);

  // Formatted copy message for LINE group
  const handleCopyForLine = () => {
    const dateStr = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    let text = `🏸 *สรุปค่าใช้จ่ายก๊วน Bad Friday* (${dateStr}) 🏸\n`;
    text += `=========================\n`;
    text += `จำนวนผู้เล่นเช็กอิน: ${totalPlayers} คน\n`;
    text += `ค่าบำรุงสนาม (คนละ 30.-): ${totalCourtMaintenance} บาท\n`;
    text += `สถิติลงเล่นรวม: ${totalPlays} ครั้ง (คนละ 25.-/นัด)\n`;
    if (totalShuttlesUsed > 0) {
      text += `ใช้ลูกแบดจริงทั้งหมด: ${totalShuttlesUsed} ลูก\n`;
    }
    text += `รวมค่าลูกขนไก่: ${totalShuttleCost} บาท\n`;
    text += `💰 *ยอดรวมทั้งสิ้น: ${totalCost} บาท*\n`;
    text += `รูปแบบการคิด: *คิดตามนัดที่เล่นจริง (นัดละ 25.-/คน)*\n`;
    text += `=========================\n\n`;
    text += `รายชื่อและยอดโอน:\n`;

    checkedInPlayers.forEach((p, idx) => {
      const bill = playerBills[p.id];
      if (bill) {
        text += `${idx + 1}. ${p.name} -> *${Math.round(bill.total)} บาท*\n`;
        text += `   (ค่าสนาม 30.- + ค่าลูก ${Math.round(bill.shuttle)}.- | เล่น ${bill.matchesPlayed} นัด)\n`;
      }
    });

    text += `\nขอบคุณสมาชิกทุกคนครับ! 🐯🏸💰`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            สรุปค่าใช้จ่ายรายวัน (Daily Bill Calculator)
          </h2>
          <p className="text-slate-500 text-sm">
            คำนวณและแจกแจงค่าใช้จ่ายสนาม (คนละ 30.-) + ค่าลูกขนไก่ (ลงเล่นคนละ 25.- ต่อนัด) สำหรับผู้ใช้บริการวันนี้
          </p>
        </div>

        <button
          onClick={handleCopyForLine}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition font-medium text-sm self-start sm:self-auto"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'คัดลอกสำเร็จ!' : 'คัดลอกสรุปส่ง LINE'}
        </button>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cost card */}
        <div className="p-5 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-2xl shadow-sm space-y-2">
          <Coins className="w-5 h-5 text-emerald-100" />
          <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider block">ยอดรวมทั้งสิ้น (Total)</span>
          <span className="text-2xl font-black block">{totalCost.toLocaleString()} ฿</span>
        </div>

        {/* Players count card */}
        <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-2">
          <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full inline-block">บำรุงสนาม 30.-/คน</span>
          <span className="text-xs font-semibold text-slate-400 block">ผู้เล่นเช็กอินทั้งหมด</span>
          <span className="text-xl font-bold text-slate-800 block">{totalPlayers} คน ({totalCourtMaintenance} ฿)</span>
        </div>

        {/* Shuttlecocks used card */}
        <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-2">
          <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full inline-block">ค่าลูก 25.-/คน/นัด</span>
          <span className="text-xs font-semibold text-slate-400 block">จำนวนการลงเล่นรวม</span>
          <span className="text-xl font-bold text-slate-800 block">{totalPlays} ครั้ง ({totalShuttleCost} ฿)</span>
        </div>

        {/* Matches Completed card */}
        <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-2">
          <span className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded-full inline-block">เสร็จสมบูรณ์</span>
          <span className="text-xs font-semibold text-slate-400 block">จำนวนนัดที่เล่นจบ</span>
          <span className="text-xl font-bold text-indigo-900 block">{completedMatches.length} นัด</span>
        </div>
      </div>

      {/* Detail description info */}
      <div className="bg-sky-50 border border-sky-100 p-4 rounded-2xl flex items-start gap-3 text-sky-800 text-xs">
        <Info className="w-4.5 h-4.5 text-sky-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold block mb-0.5">
            กติกาการคำนวณค่าบริการ
          </span>
          <span className="opacity-90 leading-relaxed">
            ค่าธรรมเนียมสนาม 30 บาทคงที่ และคิดค่าลูกขนไก่ตามจำนวนนัดที่ลงเล่นจริง นัดละ 25 บาทต่อคน ใครเล่นกี่นัดจ่ายตามจริงเท่านั้น ไม่มีการเฉลี่ยแบบเหมาจ่าย!
          </span>
        </div>
      </div>

      {/* Bills table list */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            ตารางบิลค่าใช้จ่ายแยกรายคน
          </h3>
          <span className="text-xs text-slate-400">โอนเงินโดยยึดยอดรวมทศนิยมปัดขึ้นได้ตามความสะดวก</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3.5 px-6">ผู้เล่น</th>
                <th className="py-3.5 px-6">ลงเล่น (แมตช์)</th>
                <th className="py-3.5 px-6">ค่าบำรุงสนาม</th>
                <th className="py-3.5 px-6">ค่าลูกขนไก่ (ตามนัด)</th>
                <th className="py-3.5 px-6 text-right">ยอดที่ต้องชำระ (บาท)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {checkedInPlayers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 italic">
                    ไม่มีผู้เล่นที่เช็กอินวันนี้
                  </td>
                </tr>
              ) : (
                checkedInPlayers.map((player) => {
                  const bill = playerBills[player.id];
                  if (!bill) return null;

                  return (
                    <tr key={player.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-4 px-6 flex items-center gap-3">
                        <img referrerPolicy="no-referrer" src={player.avatar} alt="" className="w-8 h-8 rounded-full border shadow-xs" />
                        <div>
                          <span className="font-semibold text-slate-800 block">{player.name}</span>
                          <span className="text-[10px] text-slate-400">ระดับ: {player.skillLevel === 'beginner' ? 'มือใหม่' : player.skillLevel === 'intermediate' ? 'กลาง' : 'โปร'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-medium">
                        {bill.matchesPlayed} นัด
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-medium">
                        {bill.court} ฿
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-medium">
                        {bill.shuttle.toFixed(1)} ฿
                      </td>
                      <td className="py-4 px-6 text-right font-black text-slate-800 text-base">
                        {bill.total.toFixed(1)} ฿
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
