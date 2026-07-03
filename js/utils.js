export function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function formatDate(value) {
  if (!value) return 'Not set';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not set' : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function calculateProgress(book) {
  const total = Number(book.totalPages) || 0;
  const current = Number(book.currentPage) || 0;
  const safeCurrent = Math.max(0, Math.min(current, total));
  const percentage = total ? Math.round((safeCurrent / total) * 100) : 0;
  const remaining = Math.max(total - safeCurrent, 0);
  const pagesRead = safeCurrent;
  return { percentage, remaining, pagesRead, completed: percentage >= 100 };
}

export function getStatusLabel(status) {
  const labels = {
    'want-to-read': 'Want to Read',
    'currently-reading': 'Currently Reading',
    finished: 'Finished',
    dropped: 'Dropped'
  };
  return labels[status] || status;
}

export function createToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2400);
}

export function getInitials(title) {
  return title
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || '')
    .join('')
    .toUpperCase();
}

export function updateReadingStreak(state, dateString) {
  const history = state.readingHistory || [];
  const dates = [...new Set(history.map((entry) => entry.date).filter(Boolean))].sort();

  if (!dates.length) {
    state.streak = { current: 0, longest: 0, lastReadingDate: null };
    return state.streak;
  }

  let current = 1;
  let longest = 1;
  let previousDate = dates[0];

  for (let index = 1; index < dates.length; index += 1) {
    const nextDate = dates[index];
    const diff = Math.round((new Date(nextDate) - new Date(previousDate)) / 86400000);
    if (diff === 1) {
      current += 1;
    } else {
      current = 1;
    }
    longest = Math.max(longest, current);
    previousDate = nextDate;
  }

  state.streak = {
    current,
    longest,
    lastReadingDate: previousDate || dateString || null
  };
  return state.streak;
}
