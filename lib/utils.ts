import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 날짜 관련 유틸리티
export function formatDate(date: Date): string {
  return date.toLocaleDateString('ko-KR')
}

export function getMonthDays(year: number, month: number): number[] {
  const daysInMonth = new Date(year, month, 0).getDate()
  return Array.from({ length: daysInMonth }, (_, i) => i + 1)
}

// 시간 관련 유틸리티
export function formatTime(time: string): string {
  const [hour, minute] = time.split(':')
  return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`
}

export function generateTimeOptions(): string[] {
  const times: string[] = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 10) {
      times.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)
    }
  }
  return times
}
