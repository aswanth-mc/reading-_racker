import { calculateProgress, formatDate, getStatusLabel } from './utils.js';

export function renderSummaryCards(state, container) {
  const books = state.books;
  const readCount = books.filter((book) => book.status === 'finished').length;
  const currentlyReading = books.filter((book) => book.status === 'currently-reading').length;
  const wantToRead = books.filter((book) => book.status === 'want-to-read').length;
  const dropped = books.filter((book) => book.status === 'dropped').length;
  const totalPages = books.reduce((sum, book) => sum + Number(book.currentPage || 0), 0);
  const progress = books.length ? Math.round((readCount / books.length) * 100) : 0;
  const streak = state.streak || { current: 0, longest: 0 };

  const cards = [
    { label: 'Total Books', value: books.length },
    { label: 'Books Read', value: readCount },
    { label: 'Currently Reading', value: currentlyReading },
    { label: 'Want to Read', value: wantToRead },
    { label: 'Dropped', value: dropped },
    { label: 'Total Pages Read', value: totalPages },
    { label: 'Reading Progress (%)', value: `${progress}%` },
    { label: 'Current Reading Streak', value: streak.current },
    { label: 'Longest Reading Streak', value: streak.longest }
  ];

  container.innerHTML = cards.map((card) => `
    <article class="summary-card">
      <span class="value">${card.value}</span>
      <span class="label">${card.label}</span>
    </article>
  `).join('');
}

export function renderGoals(state, container) {
  const goal = state.goals || { targetBooks: 24, targetPages: 3000 };
  const finishedBooks = state.books.filter((book) => book.status === 'finished').length;
  const pagesRead = state.books.reduce((sum, book) => sum + Number(book.currentPage || 0), 0);
  const booksPercent = Math.min(100, Math.round((finishedBooks / goal.targetBooks) * 100));
  const pagesPercent = Math.min(100, Math.round((pagesRead / goal.targetPages) * 100));

  container.innerHTML = `
    <div class="goals-card">
      <div class="goal-row"><strong>Target Books</strong><span>${finishedBooks}/${goal.targetBooks}</span></div>
      <div class="progress-bar"><span style="width:${booksPercent}%"></span></div>
      <div class="goal-row"><strong>Target Pages</strong><span>${pagesRead}/${goal.targetPages}</span></div>
      <div class="progress-bar"><span style="width:${pagesPercent}%"></span></div>
      <p class="subtle">Books target: ${booksPercent}% • Pages target: ${pagesPercent}%</p>
    </div>
  `;
}

export function renderCalendar(state, calendarContainer, detailsContainer) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const totalDays = lastDay.getDate();
  const days = [];

  for (let index = 0; index < startOffset; index += 1) {
    days.push(null);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    days.push(day);
  }

  const historyByDay = new Map((state.readingHistory || []).map((entry) => [entry.date, entry]));
  calendarContainer.innerHTML = days.map((day) => {
    if (!day) return '<div></div>';
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const entry = historyByDay.get(dateString);
    const hasActivity = Boolean(entry);
    return `<button type="button" class="day ${hasActivity ? 'has-activity' : ''}" data-date="${dateString}">${day}<span>${hasActivity ? '●' : ''}</span></button>`;
  }).join('');

  calendarContainer.querySelectorAll('.day').forEach((button) => {
    button.addEventListener('click', () => {
      const date = button.getAttribute('data-date');
      renderCalendarDetails(state, date, detailsContainer);
    });
  });

  const firstActive = calendarContainer.querySelector('.day.has-activity');
  if (firstActive) {
    renderCalendarDetails(state, firstActive.getAttribute('data-date'), detailsContainer);
  } else {
    detailsContainer.innerHTML = '<p class="subtle">No reading activity yet for this month.</p>';
  }
}

function renderCalendarDetails(state, date, detailsContainer) {
  const entry = (state.readingHistory || []).find((item) => item.date === date);
  if (!entry) {
    detailsContainer.innerHTML = '<p class="subtle">No reading activity recorded for this day.</p>';
    return;
  }

  detailsContainer.innerHTML = `
    <h3>${formatDate(date)}</h3>
    <p><strong>Books:</strong> ${entry.title || 'Book updated'}</p>
    <p><strong>Pages:</strong> ${entry.pages || 0}</p>
    <p class="subtle">Reading activity for this day is highlighted on the calendar.</p>
  `;
}

export function renderStatistics(state, charts) {
  const chartData = buildChartData(state);
  const sharedOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } }
  };
  const chartPool = window.__readingTrackerCharts || (window.__readingTrackerCharts = {});

  const renderChart = (canvas, config) => {
    if (!canvas) return;
    if (chartPool[canvas.id]) {
      chartPool[canvas.id].destroy();
    }
    chartPool[canvas.id] = new Chart(canvas, config);
  };

  if (charts.booksByMonthChart) {
    renderChart(charts.booksByMonthChart, { type: 'bar', data: { labels: chartData.months, datasets: [{ data: chartData.booksByMonth, backgroundColor: '#4f46e5' }] }, options: sharedOptions });
  }

  if (charts.pagesByMonthChart) {
    renderChart(charts.pagesByMonthChart, { type: 'line', data: { labels: chartData.months, datasets: [{ data: chartData.pagesByMonth, borderColor: '#818cf8', fill: false, tension: 0.4 }] }, options: sharedOptions });
  }

  if (charts.genreChart) {
    const genreLabels = Object.keys(chartData.genreDistribution);
    const genreData = Object.values(chartData.genreDistribution);
    renderChart(charts.genreChart, { type: 'doughnut', data: { labels: genreLabels, datasets: [{ data: genreData, backgroundColor: ['#4f46e5', '#818cf8', '#f59e0b', '#22c55e', '#ef4444'] }] }, options: { responsive: true, maintainAspectRatio: false } });
  }

  if (charts.statusChart) {
    const statusLabels = Object.keys(chartData.statusDistribution);
    const statusData = Object.values(chartData.statusDistribution);
    renderChart(charts.statusChart, { type: 'pie', data: { labels: statusLabels, datasets: [{ data: statusData, backgroundColor: ['#4f46e5', '#818cf8', '#22c55e', '#ef4444'] }] }, options: { responsive: true, maintainAspectRatio: false } });
  }

}

function buildChartData(state) {
  const months = [];
  const booksByMonth = [];
  const pagesByMonth = [];
  const genreDistribution = {};
  const statusDistribution = { 'want-to-read': 0, 'currently-reading': 0, finished: 0, dropped: 0 };
  const now = new Date();

  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const label = date.toLocaleDateString(undefined, { month: 'short' });
    months.push(label);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const completedThisMonth = state.books.filter((book) => book.dateFinished && book.dateFinished.startsWith(monthKey)).length;
    const pagesThisMonth = state.books.filter((book) => book.dateFinished && book.dateFinished.startsWith(monthKey)).reduce((sum, book) => sum + Number(book.currentPage || 0), 0);
    booksByMonth.push(completedThisMonth);
    pagesByMonth.push(pagesThisMonth);
  }

  state.books.forEach((book) => {

  // Keep the status chart counting every book
  statusDistribution[book.status] =
    (statusDistribution[book.status] || 0) + 1;

  // Only count genres for Currently Reading and Finished books
  if (
    (book.status === "currently-reading" ||
     book.status === "finished") &&
    book.genre
  ) {
    genreDistribution[book.genre] =
      (genreDistribution[book.genre] || 0) + 1;
  }

});


  return { months, booksByMonth, pagesByMonth, genreDistribution, statusDistribution };
}
