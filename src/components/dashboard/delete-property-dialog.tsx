'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { buttonVariants } from '@/components/ui/button'

interface DeletePropertyDialogProps {
  propertyId: string
  propertyName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

async function deleteProperty(id: string): Promise<void> {
  const res = await fetch(`/api/properties/${id}`, { method: 'DELETE' })
  if (!res.ok && res.status !== 204) throw new Error('Failed to delete property')
}

export function DeletePropertyDialog({
  propertyId,
  propertyName,
  open,
  onOpenChange,
}: DeletePropertyDialogProps) {
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: () => deleteProperty(propertyId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['properties'] })
      toast.success(`"${propertyName}" has been deleted`)
      onOpenChange(false)
    },
    onError: () => {
      toast.error('Failed to delete property. Please try again.')
    },
  })

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete property?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{propertyName}</strong> and all associated data.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: 'destructive' })}
            onClick={() => mutate()}
            disabled={isPending}
          >
            {isPending ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
