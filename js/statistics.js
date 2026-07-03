export function buildStatistics(state) {
  const months = [];
  const completedPerMonth = [];
  const pagesPerMonth = [];
  const genreDistribution = {};
  const statusDistribution = { 'want-to-read': 0, 'currently-reading': 0, finished: 0, dropped: 0 };
  const ratingDistribution = [0, 0, 0, 0, 0];

  const now = new Date();
  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    months.push(date.toLocaleDateString(undefined, { month: 'short' }));
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const completedThisMonth = state.books.filter((book) => book.dateFinished && book.dateFinished.startsWith(monthKey)).length;
    const pagesThisMonth = state.books.filter((book) => book.dateFinished && book.dateFinished.startsWith(monthKey)).reduce((sum, book) => sum + Number(book.currentPage || 0), 0);
    completedPerMonth.push(completedThisMonth);
    pagesPerMonth.push(pagesThisMonth);
  }

  state.books.forEach((book) => {
    if (book.genre) genreDistribution[book.genre] = (genreDistribution[book.genre] || 0) + 1;
    if (book.status) statusDistribution[book.status] = (statusDistribution[book.status] || 0) + 1;
    if (book.rating) ratingDistribution[book.rating - 1] += 1;
  });

  return { months, completedPerMonth, pagesPerMonth, genreDistribution, statusDistribution, ratingDistribution };
}
