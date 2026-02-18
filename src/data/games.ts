import type { Game } from '../types/game';
import { getElamUrl, getElamOnlineUrl } from '../lib/elamUrl';

export const GAMES: Game[] = [
  {
    id: 'elam',
    title: 'Elam',
    description: 'Capture the flag and race it home. A tactical strategy board game.',
    emoji: '\u{1F3DB}\uFE0F',
    status: 'live',
    url: getElamUrl(),
    onlineUrl: getElamOnlineUrl(),
    sortOrder: 1,
  },
  {
    id: 'interrogate',
    title: 'Interrogate',
    description: 'Ask the right questions. Uncover the truth before time runs out.',
    emoji: '\u{1F50D}',
    status: 'live',
    url: import.meta.env.BASE_URL + 'games/interrogate/index.html',
    sortOrder: 2,
  },
  {
    id: 'almost',
    title: 'Almost',
    description: 'Get as close as you can without going over. A game of near misses and bold guesses.',
    emoji: '\u{1F3AF}',
    status: 'beta',
    badge: 'beta',
    sortOrder: 3,
  },
  {
    id: 'sidequests',
    title: 'Sidequests',
    description: 'Embark on unexpected detours. Complete side objectives before your rivals do.',
    emoji: '\u{1F5FA}\uFE0F',
    status: 'live',
    sortOrder: 4,
  },
];
