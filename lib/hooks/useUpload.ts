// File upload React Query hook

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { UploadResponse } from '@/types/api'
import { uploadConversationFile } from '@/lib/api/upload'

export function useUploadConversationFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => uploadConversationFile(file),
    onSuccess: (data: UploadResponse) => {
      const newPlan = data.financial_plan

      // Refresh financial plans list
      queryClient.invalidateQueries({ queryKey: ['financialPlans'] })

      // Prime cache for the new plan
      if (newPlan.id) {
        queryClient.setQueryData(['financialPlan', newPlan.id], newPlan)

        // Prime cash flows for the new plan
        queryClient.setQueryData(['cashFlows', newPlan.id], data.cash_flows)
      }

      // Refresh adviser config, since upload may have created/updated it
      queryClient.invalidateQueries({ queryKey: ['adviserConfig'] })
    },
  })
}


