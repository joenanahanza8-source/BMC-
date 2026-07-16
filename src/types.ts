export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';
export type PlayerStatus = 'available' | 'playing' | 'waiting';
export type MatchType = 'singles' | 'doubles';
export type MatchStatus = 'playing' | 'waiting' | 'completed';
export type MatchWinner = 'teamA' | 'teamB' | 'draw' | null;

export interface Player {
  id: string;
  name: string;
  avatar: string; // Base64 image, custom URL, or preset avatar ID
  skillLevel: SkillLevel;
  isCheckedIn: boolean; // Is active in today's session
  status: PlayerStatus;
  createdAt: string;
}

export interface Match {
  id: string;
  courtId: string;
  type: MatchType;
  teamA: string[]; // Player IDs
  teamB: string[]; // Player IDs
  status: MatchStatus;
  shuttlecocks: number; // Number of shuttlecocks used (ลูกละ 25)
  duration: number; // Duration in minutes
  winner: MatchWinner;
  createdAt: string; // Match start or creation time
  completedAt: string | null;
}

export interface Court {
  id: string;
  name: string;
  status: 'empty' | 'playing';
  currentMatchId: string | null;
}

export interface Booking {
  id: string;
  courtId: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "18:00 - 19:00"
  bookerName: string;
  phoneNumber: string;
  status: 'pending' | 'confirmed';
  createdAt: string;
}

export interface DailySummary {
  date: string;
  totalPlayers: number;
  courtMaintenanceFee: number; // 30 Baht per checked-in player
  shuttlecockCostPerUnit: number; // 25 Baht per shuttlecock
  totalShuttlecocksUsed: number;
  totalShuttlecockCost: number;
  totalCost: number;
}
