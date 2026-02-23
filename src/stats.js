const api = typeof globalThis.browser !== "undefined" ? globalThis.browser : globalThis.chrome;
const THEME_KEYS = new Set(["calm_teal", "deep_blue", "soft_amber", "mono"]);
const THEME_ACCENT_RGB = {
  calm_teal: "34, 197, 94",
  deep_blue: "59, 130, 246",
  soft_amber: "245, 158, 11",
  mono: "156, 163, 175"
};

const TEXT = {
  ru: {
    title: "Статистика",
    cycles: "Фокус-циклов сегодня",
    brains: "Задач сегодня",
    focus: "Минут фокуса сегодня",
    streak: "Текущая серия (дней)",
    record: "Лучший день (задач)",
    calendarTitle: "Календарь месяца",
    monthTotals: "За месяц: {{cycles}} циклов, {{brains}} задач, {{focus}} мин фокуса",
    dayCycles: "Циклы",
    dayBrains: "Задачи",
    dayFocus: "Фокус",
    noDataDay: "В этот день активности не было.",
    selectedDay: "Детали за {{date}}",
    weekdays: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
    months: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"]
  },
  en: {
    title: "Statistics",
    cycles: "Focus cycles today",
    brains: "Tasks completed today",
    focus: "Focus minutes today",
    streak: "Current streak (days)",
    record: "Best day (tasks)",
    calendarTitle: "Month calendar",
    monthTotals: "This month: {{cycles}} cycles, {{brains}} tasks, {{focus}} focus min",
    dayCycles: "Cycles",
    dayBrains: "Tasks",
    dayFocus: "Focus",
    noDataDay: "No activity for this day.",
    selectedDay: "Details for {{date}}",
    weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  }
};

const ZERO_DAY = { cycles: 0, brains: 0, focusMinutes: 0 };

let state = {
  daily: {},
  lang: "ru",
  monthDate: new Date(),
  minMonthDate: null,
  selectedKey: null,
  theme: "calm_teal"
};

function tr() {
  return TEXT[state.lang] || TEXT.ru;
}

function toDateKey(date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function fromDateKey(key) {
  const [y, m, d] = key.split("-").map((n) => Number(n));
  return new Date(y, m - 1, d);
}

function todayKey() {
  return toDateKey(new Date());
}

function monthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function sameMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function addMonths(date, delta) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function weekdayMondayFirst(date) {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

function calcStreak(daily) {
  let streak = 0;
  const cursor = new Date();

  for (let i = 0; i < 3650; i += 1) {
    const key = toDateKey(cursor);
    const item = daily[key] || ZERO_DAY;
    const hasActivity = item.cycles > 0 || item.brains > 0 || item.focusMinutes > 0;
    if (!hasActivity) {
      break;
    }
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function findHistoryBounds(daily) {
  const keys = Object.keys(daily).sort();
  if (!keys.length) {
    const now = monthStart(new Date());
    return { min: now, max: now };
  }
  return {
    min: monthStart(fromDateKey(keys[0])),
    max: monthStart(fromDateKey(keys[keys.length - 1]))
  };
}

function setStaticCopy() {
  const text = tr();
  document.getElementById("title").textContent = text.title;
  document.getElementById("label-cycles").textContent = text.cycles;
  document.getElementById("label-brains").textContent = text.brains;
  document.getElementById("label-focus").textContent = text.focus;
  document.getElementById("label-streak").textContent = text.streak;
  document.getElementById("label-record").textContent = text.record;
  document.getElementById("calendar-title").textContent = text.calendarTitle;

  const weekdaysEl = document.getElementById("weekdays");
  weekdaysEl.innerHTML = "";
  text.weekdays.forEach((day) => {
    const el = document.createElement("div");
    el.className = "weekday";
    el.textContent = day;
    weekdaysEl.appendChild(el);
  });
}

function renderSummary() {
  const daily = state.daily;
  const today = daily[todayKey()] || ZERO_DAY;

  document.getElementById("today-cycles").textContent = today.cycles || 0;
  document.getElementById("today-brains").textContent = today.brains || 0;
  document.getElementById("today-focus").textContent = today.focusMinutes || 0;

  const record = Object.values(daily).reduce((acc, item) => Math.max(acc, item.brains || 0), 0);
  document.getElementById("record").textContent = record;
  document.getElementById("streak").textContent = calcStreak(daily);
}

function monthLabel(date) {
  const text = tr();
  return `${text.months[date.getMonth()]} ${date.getFullYear()}`;
}

function buildMonthCells(date) {
  const first = monthStart(date);
  const startShift = weekdayMondayFirst(first);
  const firstCellDate = new Date(first);
  firstCellDate.setDate(firstCellDate.getDate() - startShift);

  const cells = [];
  for (let i = 0; i < 42; i += 1) {
    const cellDate = new Date(firstCellDate);
    cellDate.setDate(firstCellDate.getDate() + i);
    cells.push(cellDate);
  }
  return cells;
}

function monthStats(date) {
  let cycles = 0;
  let brains = 0;
  let focus = 0;
  Object.entries(state.daily).forEach(([key, item]) => {
    const d = fromDateKey(key);
    if (sameMonth(d, date)) {
      cycles += item.cycles || 0;
      brains += item.brains || 0;
      focus += item.focusMinutes || 0;
    }
  });
  return { cycles, brains, focus };
}

function activityScore(item) {
  if (!item) return 0;
  return (item.focusMinutes || 0) + (item.cycles || 0) * 8 + (item.brains || 0) * 5;
}

function renderDayDetail(dateKey) {
  const text = tr();
  const detailEl = document.getElementById("day-detail");
  const item = state.daily[dateKey] || ZERO_DAY;
  const date = fromDateKey(dateKey);
  const header = text.selectedDay.replace("{{date}}", `${`${date.getDate()}`.padStart(2, "0")}.${`${date.getMonth() + 1}`.padStart(2, "0")}.${date.getFullYear()}`);

  detailEl.innerHTML = `
    <div class="detail-title">${header}</div>
    <div class="day-stats">${text.dayCycles}: ${item.cycles || 0}<br>${text.dayBrains}: ${item.brains || 0}<br>${text.dayFocus}: ${item.focusMinutes || 0} min</div>
    ${(item.cycles || item.brains || item.focusMinutes) ? "" : `<div class=\"day-stats\" style=\"margin-top:6px\">${text.noDataDay}</div>`}
  `;
}

function renderCalendar() {
  const text = tr();
  const currentMonth = monthStart(state.monthDate);
  const minMonth = state.minMonthDate;
  const thisMonth = monthStart(new Date());

  document.getElementById("month-title").textContent = monthLabel(currentMonth);

  const prevBtn = document.getElementById("month-prev");
  const nextBtn = document.getElementById("month-next");
  prevBtn.disabled = minMonth ? sameMonth(currentMonth, minMonth) : true;
  nextBtn.disabled = sameMonth(currentMonth, thisMonth);

  const calendarEl = document.getElementById("calendar");
  calendarEl.innerHTML = "";

  const cells = buildMonthCells(currentMonth);
  const today = new Date();
  const fallbackKey = sameMonth(today, currentMonth) ? toDateKey(today) : toDateKey(currentMonth);
  const selectedKey = state.selectedKey && sameMonth(fromDateKey(state.selectedKey), currentMonth)
    ? state.selectedKey
    : fallbackKey;
  state.selectedKey = selectedKey;

  cells.forEach((cellDate) => {
    const key = toDateKey(cellDate);
    const same = sameMonth(cellDate, currentMonth);
    const item = state.daily[key];
    const score = activityScore(item);
    const intensity = Math.min(0.62, score / 280);

    const dayEl = document.createElement("button");
    dayEl.type = "button";
    dayEl.className = `day${same ? "" : " outside"}${item ? " has-data" : ""}${key === state.selectedKey ? " selected" : ""}`;
    dayEl.disabled = !same;
    if (same && score > 0) {
      const rgb = THEME_ACCENT_RGB[state.theme] || THEME_ACCENT_RGB.calm_teal;
      dayEl.style.background = `rgba(${rgb},${0.08 + intensity})`;
    }

    const cycles = item?.cycles || 0;
    const brains = item?.brains || 0;
    const focus = item?.focusMinutes || 0;

    dayEl.innerHTML = `
      <div class="day-num">${cellDate.getDate()}</div>
      <div class="day-stats">${text.dayCycles}: ${cycles}<br>${text.dayBrains}: ${brains}<br>${text.dayFocus}: ${focus}</div>
    `;

    if (same) {
      dayEl.addEventListener("click", () => {
        state.selectedKey = key;
        renderCalendar();
      });
    }

    calendarEl.appendChild(dayEl);
  });

  const totals = monthStats(currentMonth);
  document.getElementById("month-totals").textContent = text.monthTotals
    .replace("{{cycles}}", totals.cycles)
    .replace("{{brains}}", totals.brains)
    .replace("{{focus}}", totals.focus);

  renderDayDetail(state.selectedKey);
}

function bindMonthControls() {
  document.getElementById("month-prev").addEventListener("click", () => {
    state.monthDate = addMonths(state.monthDate, -1);
    renderCalendar();
  });
  document.getElementById("month-next").addEventListener("click", () => {
    state.monthDate = addMonths(state.monthDate, 1);
    renderCalendar();
  });
}

async function init() {
  const data = await api.storage.local.get(["brainflow_daily", "brainflow_settings"]);
  state.daily = data.brainflow_daily || {};
  state.lang = data.brainflow_settings?.language === "en" ? "en" : "ru";
  const theme = THEME_KEYS.has(data.brainflow_settings?.theme) ? data.brainflow_settings.theme : "calm_teal";
  state.theme = theme;
  document.body.dataset.theme = theme;

  const bounds = findHistoryBounds(state.daily);
  state.minMonthDate = bounds.min;
  state.monthDate = monthStart(new Date());

  setStaticCopy();
  renderSummary();
  bindMonthControls();
  renderCalendar();
}

init().catch(console.error);
