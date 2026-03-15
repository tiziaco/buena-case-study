'use client'

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
import { useDeleteProperty } from '@/hooks/use-properties'

interface DeletePropertyDialogProps {
  propertyId: string
  propertyName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeletePropertyDialog({
  propertyId,
  propertyName,
  open,
  onOpenChange,
}: DeletePropertyDialogProps) {
  const { mutate, isPending } = useDeleteProperty(propertyName, () => onOpenChange(false))

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
            onClick={() => mutate(propertyId)}
            disabled={isPending}
          >
            {isPending ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
