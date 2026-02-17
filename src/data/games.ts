import type { Game } from '../types/game';
import { getElamUrl } from '../lib/elamUrl';

export const GAMES: Game[] = [
  {
    id: 'elam',
    title: 'Elam',
    description: 'Build and trade in the cradle of civilisation. A strategic resource game.',
    emoji: '\u{1F3DB}\uFE0F',
    status: 'active',
    url: getElamUrl(),
  },
  {
    id: 'interrogate',
    title: 'Interrogate',
    description: 'Ask the right questions. Uncover the truth before time runs out.',
    emoji: '\u{1F50D}',
    status: 'active',
    url: import.meta.env.BASE_URL + 'games/interrogate/index.html',
  },
  {
    id: 'almost',
    title: 'Almost',
    description: 'Get as close as you can without going over. A game of near misses and bold guesses.',
    emoji: '\u{1F3AF}',
    status: 'active',
  },
  {
    id: 'sidequests',
    title: 'Sidequests',
    description: 'Embark on unexpected detours. Complete side objectives before your rivals do.',
    emoji: '\u{1F5FA}\uFE0F',
    status: 'active',
  },
];
