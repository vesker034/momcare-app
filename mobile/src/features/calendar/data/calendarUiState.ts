import type { TrimesterId } from './pregnancyWeeks';

type CalendarUiState = {
  selectedTrimester: TrimesterId | null;
  focusWeek: number | null;
  openCurrentWeek: boolean;
};

let calendarUiState: CalendarUiState = {
  selectedTrimester: null,
  focusWeek: null,
  openCurrentWeek: false,
};

export function rememberCalendarTrimester(trimester: TrimesterId) {
  calendarUiState = {
    ...calendarUiState,
    selectedTrimester: trimester,
  };
}

export function rememberCalendarReturn(trimester: TrimesterId, week: number) {
  calendarUiState = {
    selectedTrimester: trimester,
    focusWeek: week,
    openCurrentWeek: false,
  };
}

export function requestCurrentCalendarWeek() {
  calendarUiState = { ...calendarUiState, openCurrentWeek: true };
}

export function consumeCurrentCalendarWeekRequest(): boolean {
  const requested = calendarUiState.openCurrentWeek;
  calendarUiState = { ...calendarUiState, openCurrentWeek: false };
  return requested;
}

export function peekCalendarTrimester(): TrimesterId | null {
  return calendarUiState.selectedTrimester;
}

export function consumeCalendarFocusWeek(): number | null {
  const week = calendarUiState.focusWeek;
  calendarUiState = {
    ...calendarUiState,
    focusWeek: null,
  };
  return week;
}
