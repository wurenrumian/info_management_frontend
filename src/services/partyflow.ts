import { request } from './request'
import type { PartyProgress, PartyReminder } from '@/types/partyflow'
import { API_PARTYFLOW_PROGRESS, API_PARTYFLOW_REMINDERS } from '@/constants/api'

export function getPartyProgress() {
  return request<PartyProgress>({
    url: API_PARTYFLOW_PROGRESS,
    method: 'GET',
  })
}

export function getPartyReminders() {
  return request<PartyReminder[]>({
    url: API_PARTYFLOW_REMINDERS,
    method: 'GET',
  })
}
