import { languages } from '../../constants/date-picker-languages.js'
import { DatePickerWithTime } from '../packages/date-time-picker.js'

declare global {
  interface Window {
    DatePicker: DatePickerWithTime
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const datePicker = new DatePickerWithTime({
    autoClose: true,
    elements: {
      container: 'date-picker',
      monthContainer: 'current-month',
      daysContainer: 'calendar-days',
      timeContainer: 'time-container',
      buttons: {
        prev: 'prev-month',
        next: 'next-month',
        reset: 'reset-date',
        resetAll: 'reset-all',
        close: 'close-picker',
      },
    },
    output: {
      fullFormat: true,
      between: ' & ',
      slash: '-',
      order: ['day', 'month', 'year'],
      backendFormat: ['year', 'month', 'day'],
    },
    language: languages,
    timePicker: {
      enabled: true,
      use24HourFormat: true,
      minuteInterval: 30,
      defaultHours: 12,
      defaultMinutes: 0,
    },
  })

  window.DatePicker = datePicker
})
