import { Player, Match, Court } from '../types';

export const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80', // Female 1
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&fit=crop&q=80', // Male 1
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&fit=crop&q=80', // Male 2
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&fit=crop&q=80', // Female 2
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&fit=crop&q=80', // Male 3
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&fit=crop&q=80', // Female 3
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&fit=crop&q=80', // Male 4
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&fit=crop&q=80', // Female 4
];

export const INITIAL_PLAYERS: Player[] = [
  {
    id: 'p1',
    name: 'สมชาย แขนทอง',
    avatar: PRESET_AVATARS[1],
    skillLevel: 'advanced',
    isCheckedIn: true,
    status: 'available',
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'p2',
    name: 'สมศรี มีชัย',
    avatar: PRESET_AVATARS[3],
    skillLevel: 'intermediate',
    isCheckedIn: true,
    status: 'available',
    createdAt: new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'p3',
    name: 'กิตติพงษ์ วงศ์ดี',
    avatar: PRESET_AVATARS[2],
    skillLevel: 'advanced',
    isCheckedIn: true,
    status: 'available',
    createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'p4',
    name: 'ณิชาภัทร เลิศล้ำ',
    avatar: PRESET_AVATARS[0],
    skillLevel: 'intermediate',
    isCheckedIn: true,
    status: 'available',
    createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'p5',
    name: 'อนันต์ สุขสำราญ',
    avatar: PRESET_AVATARS[4],
    skillLevel: 'beginner',
    isCheckedIn: true,
    status: 'available',
    createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'p6',
    name: 'วิภาดา พรหมมา',
    avatar: PRESET_AVATARS[5],
    skillLevel: 'intermediate',
    isCheckedIn: true,
    status: 'available',
    createdAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'p7',
    name: 'ธนากร รักดี',
    avatar: PRESET_AVATARS[6],
    skillLevel: 'beginner',
    isCheckedIn: false,
    status: 'available',
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'p8',
    name: 'นภาพร แซ่ตั้ง',
    avatar: PRESET_AVATARS[7],
    skillLevel: 'intermediate',
    isCheckedIn: true,
    status: 'available',
    createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
  }
];

export const INITIAL_COURTS: Court[] = [
  { id: 'c1', name: 'สนาม 1', status: 'empty', currentMatchId: null },
  { id: 'c2', name: 'สนาม 2', status: 'empty', currentMatchId: null },
  { id: 'c3', name: 'สนาม 3', status: 'empty', currentMatchId: null },
  { id: 'c4', name: 'สนาม 4', status: 'empty', currentMatchId: null },
  { id: 'c5', name: 'สนาม 5', status: 'empty', currentMatchId: null },
  { id: 'c6', name: 'สนาม 6', status: 'empty', currentMatchId: null },
];

// Seed matches from the current week to show statistical leaderboard
const getPastDateStr = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

export const INITIAL_MATCHES: Match[] = [
  // 3 Days Ago Matches
  {
    id: 'm1',
    courtId: 'c1',
    type: 'doubles',
    teamA: ['p1', 'p2'],
    teamB: ['p3', 'p4'],
    status: 'completed',
    shuttlecocks: 2,
    duration: 21,
    winner: 'teamA',
    createdAt: getPastDateStr(3),
    completedAt: getPastDateStr(3),
  },
  {
    id: 'm2',
    courtId: 'c2',
    type: 'singles',
    teamA: ['p5'],
    teamB: ['p6'],
    status: 'completed',
    shuttlecocks: 1,
    duration: 15,
    winner: 'teamB',
    createdAt: getPastDateStr(3),
    completedAt: getPastDateStr(3),
  },
  // 2 Days Ago Matches
  {
    id: 'm3',
    courtId: 'c1',
    type: 'doubles',
    teamA: ['p1', 'p3'],
    teamB: ['p2', 'p6'],
    status: 'completed',
    shuttlecocks: 3,
    duration: 25,
    winner: 'teamA',
    createdAt: getPastDateStr(2),
    completedAt: getPastDateStr(2),
  },
  {
    id: 'm4',
    courtId: 'c2',
    type: 'doubles',
    teamA: ['p4', 'p5'],
    teamB: ['p2', 'p8'],
    status: 'completed',
    shuttlecocks: 2,
    duration: 18,
    winner: 'draw',
    createdAt: getPastDateStr(2),
    completedAt: getPastDateStr(2),
  },
  // Yesterday Matches
  {
    id: 'm5',
    courtId: 'c1',
    type: 'singles',
    teamA: ['p1'],
    teamB: ['p3'],
    status: 'completed',
    shuttlecocks: 1,
    duration: 12,
    winner: 'teamA',
    createdAt: getPastDateStr(1),
    completedAt: getPastDateStr(1),
  },
  {
    id: 'm6',
    courtId: 'c2',
    type: 'doubles',
    teamA: ['p2', 'p4'],
    teamB: ['p6', 'p8'],
    status: 'completed',
    shuttlecocks: 2,
    duration: 22,
    winner: 'teamB',
    createdAt: getPastDateStr(1),
    completedAt: getPastDateStr(1),
  }
];
