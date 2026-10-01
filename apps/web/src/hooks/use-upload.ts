'use client'

import { useState, useCallback } from 'react'
import { uploadsApi } from '@/lib/api'
import { usePhotoshootStore } from '@/stores/photoshoot.store'
import { MAX_UPLOAD_SIZE_BYTES, ACCEPTED_IMAGE_TYPES } from '@/lib/constants'

export interface UploadError {
  fileName: string
  reason: string
}

export function useUpload(photoshootId: string) {
  const { addUploadItems, updateUploadItem, removeUploadItem, uploadItems } = usePhotoshootStore()
  const [errors, setErrors] = useState<UploadError[]>([])

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return 'File type not supported. Use JPEG, PNG, or WebP.'
    if (file.size > MAX_UPLOAD_SIZE_BYTES) return `File too large. Maximum size is 20 MB.`
    return null
  }, [])

  const uploadFiles = useCallback(
    async (files: File[]) => {
      const valid: File[] = []
      const newErrors: UploadError[] = []

      for (const file of files) {
        const error = validateFile(file)
        if (error) {
          newErrors.push({ fileName: file.name, reason: error })
        } else {
          valid.push(file)
        }
      }

      setErrors(newErrors)
      if (valid.length === 0) return

      addUploadItems(valid)

      await Promise.allSettled(
        valid.map(async (file) => {
          // Find the item we just added by name — safe because we added it above
          const item = usePhotoshootStore.getState().uploadItems.find(
            (i) => i.file === file && i.status === 'pending'
          )
          if (!item) return

          updateUploadItem(item.id, { status: 'uploading', progress: 0 })

          try {
            const { uploadUrl, storageKey, fields } = await uploadsApi.getPresignedUrl(
              photoshootId,
              file.name,
              file.type
            )

            // Upload directly to S3/MinIO with presigned URL
            const formData = new FormData()
            Object.entries(fields).forEach(([k, v]) => formData.append(k, v))
            formData.append('file', file)

            const xhr = new XMLHttpRequest()
            await new Promise<void>((resolve, reject) => {
              xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                  updateUploadItem(item.id, { progress: Math.round((e.loaded / e.total) * 90) })
                }
              }
              xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)))
              xhr.onerror = () => reject(new Error('Network error'))
              xhr.open('POST', uploadUrl)
              xhr.send(formData)
            })

            await uploadsApi.confirmUpload(photoshootId, {
              storageKey,
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type,
            })

            updateUploadItem(item.id, { status: 'done', progress: 100, storageKey })
          } catch (err) {
            updateUploadItem(item.id, {
              status: 'error',
              errorMessage: err instanceof Error ? err.message : 'Upload failed',
            })
          }
        })
      )
    },
    [photoshootId, addUploadItems, updateUploadItem, validateFile]
  )

  return {
    uploadFiles,
    uploadItems,
    errors,
    removeUploadItem,
    doneCount: uploadItems.filter((i) => i.status === 'done').length,
    totalCount: uploadItems.length,
    isUploading: uploadItems.some((i) => i.status === 'uploading'),
  }
}
