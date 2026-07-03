export function initCalendar(state, calendarGrid, detailsPanel) {
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
  calendarGrid.innerHTML = days.map((day) => {
    if (!day) return '<div></div>';
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const entry = historyByDay.get(dateString);
    return `<button type="button" class="day ${entry ? 'has-activity' : ''}" data-date="${dateString}">${day}<span>${entry ? '●' : ''}</span></button>`;
  }).join('');

  calendarGrid.querySelectorAll('.day').forEach((button) => {
    button.addEventListener('click', () => {
      const date = button.getAttribute('data-date');
      const entry = historyByDay.get(date);
      detailsPanel.innerHTML = entry ? `<h3>${date}</h3><p><strong>Pages:</strong> ${entry.pages || 0}</p><p><strong>Book:</strong> ${entry.title || 'Updated'}</p>` : '<p class="subtle">No reading activity.</p>';
    });
  });
}
