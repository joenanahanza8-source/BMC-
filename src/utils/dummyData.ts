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

export const INITIAL_PLAYERS: Player[] = [];

export const INITIAL_COURTS: Court[] = [
  { id: 'c1', name: 'สนาม 1', status: 'empty', currentMatchId: null },
  { id: 'c2', name: 'สนาม 2', status: 'empty', currentMatchId: null },
  { id: 'c3', name: 'สนาม 3', status: 'empty', currentMatchId: null },
  { id: 'c4', name: 'สนาม 4', status: 'empty', currentMatchId: null },
  { id: 'c5', name: 'สนาม 5', status: 'empty', currentMatchId: null },
  { id: 'c6', name: 'สนาม 6', status: 'empty', currentMatchId: null },
];

export const INITIAL_MATCHES: Match[] = [];
