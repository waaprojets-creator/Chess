import { create } from 'zustand';
import { nanoid } from './nanoid';
import { COGNITIVE_ITEMS } from '@/data/cognitiveItems';
import {
  estimateTheta,
  standardError,
  selectNextItem,
  shouldStop,
  thetaToBand,
  thetaToPercentile,
  type ItemResponse,
} from '@/services/catService';
import type { CognitiveItem, CognitiveSession } from '@/types/chess';

const STORAGE_KEY = 'chess:cognitive_sessions';
const MAX_SESSIONS = 20;

function loadSessions(): CognitiveSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CognitiveSession[]) : [];
  } catch { return []; }
}

function saveSessions(sessions: CognitiveSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS)));
  } catch {}
}

export type TestPhase = 'idle' | 'testing' | 'feedback' | 'done';

interface CognitiveTestState {
  phase: TestPhase;
  currentItem: CognitiveItem | null;
  responses: ItemResponse[];
  seenIds: Set<string>;
  thetaEstimate: number;
  se: number;
  selectedOptionIndex: number | null;
  lastAnswerCorrect: boolean | null;
  sessions: CognitiveSession[];

  startTest: () => void;
  selectOption: (index: number) => void;
  submitAnswer: () => void;
  nextItem: () => void;
  resetTest: () => void;
}

export const useCognitiveTestStore = create<CognitiveTestState>((set, get) => ({
  phase: 'idle',
  currentItem: null,
  responses: [],
  seenIds: new Set(),
  thetaEstimate: 0,
  se: 99,
  selectedOptionIndex: null,
  lastAnswerCorrect: null,
  sessions: loadSessions(),

  startTest() {
    const theta = 0;
    const seen = new Set<string>();
    const first = selectNextItem(theta, COGNITIVE_ITEMS, seen);
    set({
      phase: 'testing',
      currentItem: first,
      responses: [],
      seenIds: seen,
      thetaEstimate: theta,
      se: 99,
      selectedOptionIndex: null,
      lastAnswerCorrect: null,
    });
  },

  selectOption(index) {
    if (get().phase !== 'testing') return;
    set({ selectedOptionIndex: index });
  },

  submitAnswer() {
    const { currentItem, selectedOptionIndex, responses, seenIds, sessions } = get();
    if (!currentItem || selectedOptionIndex === null) return;

    const correct = selectedOptionIndex === currentItem.correctIndex;
    const newResponses: ItemResponse[] = [...responses, { item: currentItem, correct }];
    const newSeen = new Set(seenIds);
    newSeen.add(currentItem.id);

    const newTheta = estimateTheta(newResponses);
    const newSe    = standardError(newTheta, newResponses.map((r) => r.item));

    if (shouldStop(newResponses.length, newSe)) {
      // Finish the test
      const band       = thetaToBand(newTheta);
      const percentile = thetaToPercentile(newTheta);
      const session: CognitiveSession = {
        id: nanoid(),
        startedAt: Date.now(),
        completedAt: Date.now(),
        itemCount: newResponses.length,
        thetaFinal: Math.round(newTheta * 100) / 100,
        band,
        percentile,
      };
      const newSessions = [session, ...sessions];
      saveSessions(newSessions);
      set({
        phase: 'feedback',
        responses: newResponses,
        seenIds: newSeen,
        thetaEstimate: newTheta,
        se: newSe,
        lastAnswerCorrect: correct,
        sessions: newSessions,
      });
    } else {
      set({
        phase: 'feedback',
        responses: newResponses,
        seenIds: newSeen,
        thetaEstimate: newTheta,
        se: newSe,
        lastAnswerCorrect: correct,
      });
    }
  },

  nextItem() {
    const { responses, seenIds, thetaEstimate, sessions } = get();

    // If already done (session was saved in submitAnswer)
    if (shouldStop(responses.length, get().se)) {
      set({ phase: 'done' });
      return;
    }

    const next = selectNextItem(thetaEstimate, COGNITIVE_ITEMS, seenIds);
    if (!next) {
      // Bank exhausted — finish
      const band       = thetaToBand(thetaEstimate);
      const percentile = thetaToPercentile(thetaEstimate);
      const session: CognitiveSession = {
        id: nanoid(),
        startedAt: Date.now(),
        completedAt: Date.now(),
        itemCount: responses.length,
        thetaFinal: Math.round(thetaEstimate * 100) / 100,
        band,
        percentile,
      };
      const newSessions = [session, ...sessions];
      saveSessions(newSessions);
      set({ phase: 'done', sessions: newSessions });
      return;
    }

    set({
      phase: 'testing',
      currentItem: next,
      selectedOptionIndex: null,
      lastAnswerCorrect: null,
    });
  },

  resetTest() {
    set({
      phase: 'idle',
      currentItem: null,
      responses: [],
      seenIds: new Set(),
      thetaEstimate: 0,
      se: 99,
      selectedOptionIndex: null,
      lastAnswerCorrect: null,
    });
  },
}));
