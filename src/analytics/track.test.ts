import { describe, it, expect, beforeEach } from 'vitest';
import { track, flushEvents, queueSize } from './track';

beforeEach(() => {
  localStorage.clear();
  // Drain any leftover events
  flushEvents();
});

describe('track', () => {
  it('queues an event', () => {
    track('app_open', {});
    expect(queueSize()).toBe(1);
  });

  it('queues multiple events with correct names', () => {
    track('app_open', {});
    track('card_click', { gameId: 'almost' });
    track('game_start', { gameId: 'elam', launchMode: 'internal' });

    const events = flushEvents();
    expect(events.length).toBe(3);
    expect(events[0].name).toBe('app_open');
    expect(events[1].name).toBe('card_click');
    expect(events[2].name).toBe('game_start');
  });

  it('includes timestamp on events', () => {
    const before = Date.now();
    track('app_open', {});
    const events = flushEvents();
    expect(events[0].timestamp).toBeGreaterThanOrEqual(before);
  });

  it('drops events when opted out', () => {
    localStorage.setItem('basil_profile', JSON.stringify({ analyticsOptOut: true }));

    track('app_open', {});
    track('card_click', { gameId: 'almost' });

    expect(queueSize()).toBe(0);
    expect(flushEvents().length).toBe(0);
  });

  it('queues events when not opted out', () => {
    localStorage.setItem('basil_profile', JSON.stringify({ analyticsOptOut: false }));

    track('app_open', {});
    expect(queueSize()).toBe(1);
  });

  it('flushEvents drains the queue', () => {
    track('app_open', {});
    track('card_click', { gameId: 'elam' });

    const events = flushEvents();
    expect(events.length).toBe(2);
    expect(queueSize()).toBe(0);
  });

  it('assigns a UUID id to each event', () => {
    track('app_open', {});
    const events = flushEvents();
    expect(events[0].id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('assigns unique ids to each event', () => {
    track('app_open', {});
    track('card_click', { gameId: 'almost' });
    const events = flushEvents();
    expect(events[0].id).not.toBe(events[1].id);
  });
});
