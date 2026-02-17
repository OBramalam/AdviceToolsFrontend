// Simulation React Query hooks

import { useMutation } from '@tanstack/react-query'
import type { SimulationRequest, SimulationResponse } from '@/types/api'
import * as simulationApi from '@/lib/api/simulation'

export function useRunSimulation() {
  return useMutation({
    mutationFn: (request: SimulationRequest) =>
      simulationApi.runSimulation(request),
  })
}

