const STORAGE_KEY = 'reading-tracker-state';

const defaultState = {
  books: [],
  goals: { targetBooks: 24, targetPages: 3000 },
  readingHistory: [],
  streak: { current: 0, longest: 0, lastReadingDate: null },
  preferences: { theme: 'light' }
};

export function getDefaultState() {
  return JSON.parse(JSON.stringify(defaultState));
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return getDefaultState();
    }

    const parsed = JSON.parse(raw);
    return {
      ...getDefaultState(),
      ...parsed,
      goals: { ...getDefaultState().goals, ...(parsed.goals || {}) },
      streak: { ...getDefaultState().streak, ...(parsed.streak || {}) },
      preferences: { ...getDefaultState().preferences, ...(parsed.preferences || {}) },
      books: Array.isArray(parsed.books) ? parsed.books : [],
      readingHistory: Array.isArray(parsed.readingHistory) ? parsed.readingHistory : []
    };
  } catch (error) {
    console.error('Unable to load tracker state', error);
    return getDefaultState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Unable to save tracker state', error);
  }
}
