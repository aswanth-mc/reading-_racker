import { uid, calculateProgress, formatDate, createToast, getStatusLabel } from './utils.js';

export function renderBooks(itemsOrState, container, { onEdit, onDelete, onOpen, onToggleFavorite }) {
  container.innerHTML = '';
  const books = Array.isArray(itemsOrState) ? itemsOrState : itemsOrState.books || [];

  if (!books.length) {
    container.innerHTML = '<div class="empty-state">No books yet. Add your first title to begin tracking your reading life.</div>';
    return;
  }

  const sortedBooks = [...books].sort((left, right) => {
    const progressLeft = calculateProgress(left).percentage;
    const progressRight = calculateProgress(right).percentage;
    return progressRight - progressLeft;
  });

  sortedBooks.forEach((book) => {
    const card = document.createElement('article');
    card.className = 'book-card';
    const progress = calculateProgress(book);
    const cover = book.coverImage
      ? `<img class="book-cover" src="${book.coverImage}" alt="${book.title}" />`
      : `<div class="book-cover-placeholder">${book.title.slice(0, 1).toUpperCase()}</div>`;

    card.innerHTML = `
      <div class="book-meta">
        <span class="badge">${getStatusLabel(book.status)}</span>
        ${book.favorite ? '<span class="badge favorite">★ Favorite</span>' : ''}
      </div>
      ${cover}
      <div class="progress-row">
        <div class="book-meta">
          <strong>${book.title}</strong>
          <span>${progress.percentage}%</span>
        </div>
        <div class="progress-bar"><span style="width:${progress.percentage}%"></span></div>
        <small>${progress.pagesRead}/${book.totalPages || 0} pages • ${progress.remaining} left</small>
      </div>
      <p class="subtle">by ${book.author}</p>
      <div class="book-actions">
        <button type="button" data-action="open">Details</button>
        <button type="button" data-action="edit">Edit</button>
        <button type="button" data-action="favorite">${book.favorite ? '★' : '☆'}</button>
        <button type="button" data-action="delete">Delete</button>
      </div>
    `;

    card.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) {
        onOpen(book.id);
        return;
      }
      const action = button.getAttribute('data-action');
      if (action === 'open') onOpen(book.id);
      if (action === 'edit') onEdit(book.id);
      if (action === 'favorite') onToggleFavorite(book.id);
      if (action === 'delete') onDelete(book.id);
    });

    container.appendChild(card);
  });
}

export function openBookModal(state, bookId, container) {
  const book = state.books.find((item) => item.id === bookId);
  if (!book) return;

  const progress = calculateProgress(book);
  const content = document.createElement('div');
  content.innerHTML = `
    <div class="book-meta">
      <h3>${book.title}</h3>
      <span class="badge">${getStatusLabel(book.status)}</span>
    </div>
    <p class="subtle">by ${book.author}</p>
    ${book.coverImage ? `<img class="book-cover" src="${book.coverImage}" alt="${book.title}" />` : `<div class="book-cover-placeholder">${book.title.slice(0, 1).toUpperCase()}</div>`}
    <div class="progress-row" style="margin-top: 12px;">
      <div class="book-meta"><strong>Progress</strong><span>${progress.percentage}%</span></div>
      <div class="progress-bar"><span style="width:${progress.percentage}%"></span></div>
      <small>${progress.pagesRead}/${book.totalPages || 0} pages read • ${progress.remaining} remaining</small>
    </div>
    <p><strong>Genre:</strong> ${book.genre || 'Unknown'}</p>
    <p><strong>Started:</strong> ${formatDate(book.dateStarted)}</p>
    <p><strong>Finished:</strong> ${formatDate(book.dateFinished)}</p>
    <p><strong>Notes:</strong> ${book.notes || 'No notes yet.'}</p>
    <p><strong>Favorite:</strong> ${book.favorite ? 'Yes' : 'No'}</p>
  `;
  container.innerHTML = '';
  container.appendChild(content);
}

export function validateBook(book) {
  const errors = [];
  if (!book.title?.trim()) errors.push('Title is required.');
  if (!book.author?.trim()) errors.push('Author is required.');
  if (!book.totalPages || Number(book.totalPages) <= 0) errors.push('Total pages must be a positive number.');
  if (Number(book.currentPage) < 0) errors.push('Current page cannot be negative.');
  if (Number(book.currentPage) > Number(book.totalPages)) errors.push('Current page cannot exceed total pages.');
  return errors;
}

export function saveBook(state, payload, editingId) {
  const trimmed = {
    ...payload,
    title: payload.title.trim(),
    author: payload.author.trim(),
    genre: payload.genre.trim(),
    notes: payload.notes.trim(),
    coverImage: payload.coverImage?.trim() || '',
    totalPages: Number(payload.totalPages),
    currentPage: Number(payload.currentPage),
    favorite: Boolean(payload.favorite),
    status: payload.status,
    dateStarted: payload.dateStarted || '',
    dateFinished: payload.dateFinished || ''
  };

  const progress = calculateProgress(trimmed);
  if (progress.completed) {
    trimmed.status = 'finished';
    if (!trimmed.dateFinished) {
      trimmed.dateFinished = new Date().toISOString().slice(0, 10);
    }
  }

  if (editingId) {
    state.books = state.books.map((book) => (book.id === editingId ? { ...book, ...trimmed, id: editingId } : book));
  } else {
    state.books.push({ id: uid(), ...trimmed, createdAt: new Date().toISOString() });
  }

  state.readingHistory.push({ date: new Date().toISOString().slice(0, 10), pages: progress.pagesRead, title: trimmed.title });
  return trimmed;
}

export function deleteBook(state, bookId) {
  state.books = state.books.filter((book) => book.id !== bookId);
  createToast('Book removed from your library.', 'success');
}
