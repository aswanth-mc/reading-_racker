import { loadState, saveState } from './storage.js';
import { renderBooks, openBookModal, validateBook, saveBook, deleteBook } from './books.js';
import { renderSummaryCards, renderGoals, renderCalendar, renderStatistics } from './dashboard.js';
import { createToast, formatDate, uid, updateReadingStreak } from './utils.js';

const state = loadState();
const form = document.getElementById('bookForm');
const modal = document.getElementById('bookFormModal');
const bookModal = document.getElementById('bookModal');
const summaryCards = document.getElementById('summaryCards');
const booksList = document.getElementById('booksList');
const goalsContent = document.getElementById('goalsContent');
const calendarGrid = document.getElementById('calendarGrid');
const calendarDetails = document.getElementById('calendarDetails');
const importInput = document.getElementById('importInput');
const exportBtn = document.getElementById('exportBtn');
const themeToggle = document.getElementById('themeToggle');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const genreFilter = document.getElementById('genreFilter');
const favoriteFilter = document.getElementById('favoriteFilter');
const sortFilter = document.getElementById('sortFilter');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');
const heroMetric = document.getElementById('heroMetric');
const formErrors = document.getElementById('formErrors');
const formTitle = document.getElementById('formTitle');
const editingBookId = document.getElementById('editingBookId');
const bookModalContent = document.getElementById('bookModalContent');

let activeBookId = null;

function persist() {
  updateReadingStreak(state, new Date().toISOString().slice(0, 10));
  saveState(state);
}

function applyTheme() {
  document.body.classList.toggle('dark', state.preferences.theme === 'dark');
  themeToggle.textContent = state.preferences.theme === 'dark' ? '☀️ Light mode' : '🌙 Dark mode';
}

function render() {
  renderSummaryCards(state, summaryCards);
  renderGoals(state, goalsContent);
  renderCalendar(state, calendarGrid, calendarDetails);
  renderStatistics(state, {
    booksByMonthChart: document.getElementById('booksByMonthChart'),
    pagesByMonthChart: document.getElementById('pagesByMonthChart'),
    genreChart: document.getElementById('genreChart'),
    statusChart: document.getElementById('statusChart')
  });
  heroMetric.textContent = `${state.books.length} books logged`;
  populateGenreFilter();
  applyTheme();
  renderFilteredBooks();
}

function populateGenreFilter() {
  const genres = [...new Set(state.books.map((book) => book.genre).filter(Boolean))];
  genreFilter.innerHTML = '<option value="all">All</option>' + genres.map((genre) => `<option value="${genre}">${genre}</option>`).join('');
}

function openEditModal(bookId) {
  const book = state.books.find((item) => item.id === bookId);
  if (!book) return;
  activeBookId = bookId;
  formTitle.textContent = 'Edit Book';
  editingBookId.value = book.id;
  document.getElementById('title').value = book.title || '';
  document.getElementById('author').value = book.author || '';
  document.getElementById('genre').value = book.genre || '';
  document.getElementById('coverImage').value = book.coverImage || '';
  document.getElementById('totalPages').value = book.totalPages || '';
  document.getElementById('currentPage').value = book.currentPage || '';
  document.getElementById('status').value = book.status || 'want-to-read';
  document.getElementById('dateStarted').value = book.dateStarted || '';
  document.getElementById('dateFinished').value = book.dateFinished || '';
  document.getElementById('favorite').checked = Boolean(book.favorite);
  document.getElementById('notes').value = book.notes || '';
  formErrors.innerHTML = '';
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function openBookDetail(bookId) {
  activeBookId = bookId;
  openBookModal(state, bookId, bookModalContent);
  bookModal.classList.remove('hidden');
  bookModal.setAttribute('aria-hidden', 'false');
}

function closeBookModal() {
  bookModal.classList.add('hidden');
  bookModal.setAttribute('aria-hidden', 'true');
}

function closeFormModal() {
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  form.reset();
  editingBookId.value = '';
  formTitle.textContent = 'Add New Book';
  formErrors.innerHTML = '';
  activeBookId = null;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(form).entries());
  payload.favorite = document.getElementById('favorite').checked;
  const errors = validateBook(payload);
  if (errors.length) {
    formErrors.innerHTML = errors.map((message) => `<div>${message}</div>`).join('');
    return;
  }

  saveBook(state, payload, editingBookId.value || null);
  persist();
  render();
  closeFormModal();
  createToast('Book saved successfully.', 'success');
});

document.getElementById('addBookBtn').addEventListener('click', () => {
  form.reset();
  editingBookId.value = '';
  formTitle.textContent = 'Add New Book';
  formErrors.innerHTML = '';
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
});

document.getElementById('quickBookBtn').addEventListener('click', () => {
  document.getElementById('addBookBtn').click();
});

document.getElementById('closeBookModal').addEventListener('click', closeBookModal);
document.getElementById('closeBookFormModal').addEventListener('click', closeFormModal);
document.getElementById('cancelBookForm').addEventListener('click', closeFormModal);

document.getElementById('bookModal').addEventListener('click', (event) => {
  if (event.target.id === 'bookModal') closeBookModal();
});
document.getElementById('bookFormModal').addEventListener('click', (event) => {
  if (event.target.id === 'bookFormModal') closeFormModal();
});

themeToggle.addEventListener('click', () => {
  state.preferences.theme = state.preferences.theme === 'dark' ? 'light' : 'dark';
  persist();
  applyTheme();
});

exportBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'reading-tracker.json';
  link.click();
  URL.revokeObjectURL(url);
  createToast('Reading data exported.', 'success');
});

importInput.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      Object.assign(state, imported);
      persist();
      render();
      createToast('Reading data imported.', 'success');
    } catch (error) {
      createToast('Unable to import file.', 'error');
    }
  };
  reader.readAsText(file);
});

[searchInput, statusFilter, genreFilter, favoriteFilter, sortFilter].forEach((element) => {
  element.addEventListener('input', renderFilteredBooks);
  element.addEventListener('change', renderFilteredBooks);
});

clearFiltersBtn.addEventListener('click', () => {
  searchInput.value = '';
  statusFilter.value = 'all';
  genreFilter.value = 'all';
  favoriteFilter.value = 'all';
  sortFilter.value = 'recent';
  renderFilteredBooks();
});

function renderFilteredBooks() {
  const search = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;
  const genre = genreFilter.value;
  const favorite = favoriteFilter.value;
  const sort = sortFilter.value;

  let filtered = [...state.books];
  if (search) {
    filtered = filtered.filter((book) => `${book.title} ${book.author}`.toLowerCase().includes(search));
  }
  if (status !== 'all') filtered = filtered.filter((book) => book.status === status);
  if (genre !== 'all') filtered = filtered.filter((book) => book.genre === genre);
  if (favorite !== 'all') filtered = filtered.filter((book) => String(book.favorite) === favorite);

  filtered.sort((left, right) => {
    switch (sort) {
      case 'title':
        return left.title.localeCompare(right.title);
      case 'progress':
        return Number(right.currentPage || 0) - Number(left.currentPage || 0);
      case 'started':
        return new Date(right.dateStarted || 0) - new Date(left.dateStarted || 0);
      case 'finished':
        return new Date(right.dateFinished || 0) - new Date(left.dateFinished || 0);
      case 'recent':
      default:
        return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
    }
  });

  renderBooks(filtered, booksList, {
    onEdit: openEditModal,
    onDelete: (bookId) => {
      if (window.confirm('Remove this book from your library?')) {
        deleteBook(state, bookId);
        persist();
        renderFilteredBooks();
      }
    },
    onOpen: (bookId) => openBookDetail(bookId),
    onToggleFavorite: (bookId) => {
      state.books = state.books.map((book) => (book.id === bookId ? { ...book, favorite: !book.favorite } : book));
      persist();
      renderFilteredBooks();
      createToast('Favorite updated.', 'success');
    }
  });
}

render();
renderFilteredBooks();
