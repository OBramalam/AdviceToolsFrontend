// Simulation API functions

import { apiClient } from './client'
import type { SimulationRequest, SimulationResponse } from '@/types/api'

export async function runSimulation(
  request: SimulationRequest
): Promise<SimulationResponse> {
  const response = await apiClient.post<SimulationResponse>(
    '/simulate',
    request
  )
  return response.data
}

