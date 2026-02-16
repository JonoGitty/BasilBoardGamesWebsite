import type { Game } from '../types/game';

export const GAMES: Game[] = [
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
  {
    id: 'elam',
    title: 'Elam',
    description: 'Build and trade in the cradle of civilisation. A strategic resource game.',
    emoji: '\u{1F3DB}\uFE0F',
    status: 'active',
  },
  {
    id: 'interrogate',
    title: 'Interrogate',
    description: 'Ask the right questions. Uncover the truth before time runs out.',
    emoji: '\u{1F50D}',
    status: 'active',
  },
  {
    id: 'hex-havoc',
    title: 'Hex Havoc',
    description: 'Claim hexes, block opponents, and dominate the board in this territorial tug-of-war.',
    emoji: '\u{2B21}',
    status: 'active',
  },
  {
    id: 'tall-tales',
    title: 'Tall Tales',
    description: 'Spin the most convincing story. Bluff your way to victory.',
    emoji: '\u{1F4D6}',
    status: 'active',
  },
  {
    id: 'deep-six',
    title: 'Deep Six',
    description: 'Dive into the depths. A press-your-luck ocean exploration game.',
    emoji: '\u{1F30A}',
    status: 'coming_soon',
  },
  {
    id: 'nightmarket',
    title: 'Night Market',
    description: 'Barter, haggle, and hustle your way through a neon-lit bazaar.',
    emoji: '\u{1F3EE}',
    status: 'coming_soon',
  },
  {
    id: 'runestone',
    title: 'Runestone',
    description: 'Decipher ancient runes to cast powerful spells before your opponents.',
    emoji: '\u{1F48E}',
    status: 'archived',
  },
  {
    id: 'two-timer',
    title: 'Two Timer',
    description: 'Play both sides in this double-agent deduction game.',
    emoji: '\u{23F3}',
    status: 'coming_soon',
  },
];
