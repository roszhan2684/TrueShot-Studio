import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { editorApi } from '@/lib/api'
import { useEditorStore } from '@/stores/editor.store'
import { POLLING_INTERVAL_MS } from '@/lib/constants'
import type { EditType, EditParameters } from '@trueshot/types'

export function useCreateEdit() {
  const queryClient = useQueryClient()
  const { setActiveEditJob } = useEditorStore()

  return useMutation({
    mutationFn: ({
      headshotId,
      editType,
      parameters,
    }: {
      headshotId: string
      editType: EditType
      parameters: EditParameters
    }) => editorApi.createEditJob(headshotId, editType, parameters),
    onSuccess: (job) => {
      setActiveEditJob(job)
      queryClient.invalidateQueries({ queryKey: ['edit-jobs'] })
    },
    onError: () => {
      toast.error('Edit failed. Please try again.')
    },
  })
}

export function useEditJobStatus(jobId: string | null) {
  return useQuery({
    queryKey: ['edit-job', jobId],
    queryFn: () => editorApi.getEditJob(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'processing' || status === 'queued' ? POLLING_INTERVAL_MS : false
    },
  })
}
