export function updateGoals(state) {
  const goals = state.goals || { targetBooks: 24, targetPages: 3000 };
  const booksFinished = state.books.filter((book) => book.status === 'finished').length;
  const pagesRead = state.books.reduce((sum, book) => sum + Number(book.currentPage || 0), 0);
  return { booksFinished, pagesRead, goals };
}
