import { request } from './request'
import type { PartyflowMyStatus } from '@/types/partyflow'
import { API_PARTYFLOW_ME } from '@/constants/api'

export function getPartyflowMine() {
  return request<PartyflowMyStatus[]>({
    url: API_PARTYFLOW_ME,
    method: 'GET',
  })
}
