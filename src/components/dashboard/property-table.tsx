'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useProperties } from '@/hooks/use-properties'
import type { PropertyFilters } from '@/types/property'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DeletePropertyDialog } from '@/components/dashboard/delete-property-dialog'
import { PropertyTableSkeleton } from '@/components/dashboard/property-table-skeleton'
import { PropertyRowActions } from '@/components/dashboard/property-row-actions'

const dateFormatter = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' })

interface PropertyTableProps {
  filters: PropertyFilters
}

export function PropertyTable({ filters }: PropertyTableProps) {
  const { data, isLoading, isError, error } = useProperties(filters)

  const [pendingDelete, setPendingDelete] = useState<{
    id: string
    name: string
  } | null>(null)

  useEffect(() => {
    if (error) {
      toast.error('Failed to load properties')
    }
  }, [error])

  if (isLoading) {
    return <PropertyTableSkeleton />
  }

  if (isError) {
    return (
      <div className="rounded-lg border">
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <p className="text-sm font-medium">Could not load properties</p>
          <p className="text-sm text-muted-foreground">An error occurred. Please try again.</p>
        </div>
      </div>
    )
  }

  const properties = data ?? []

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-80 max-w-80">Name</TableHead>
              <TableHead className="w-30">Type</TableHead>
              <TableHead className="w-35">Property No.</TableHead>
              <TableHead className="w-40">Manager</TableHead>
              <TableHead className="w-15">Created</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6}>
                  <div className="py-12 text-center">
                    <p className="text-sm font-medium">No properties found.</p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Try adjusting your filters or create a new property.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              properties.map((property) => (
                <TableRow key={property.id} className="group">
                  <TableCell className="font-medium max-w-60">
                    <span className="block truncate" title={property.name}>{property.name}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{property.type}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {property.propertyNumber}
                  </TableCell>
                  <TableCell>
                    {property.staff.manager?.name ?? (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {dateFormatter.format(new Date(property.createdAt))}
                  </TableCell>
                  <TableCell className="w-8 text-right">
                    <PropertyRowActions
                      propertyName={property.name}
                      onDelete={() => setPendingDelete({ id: property.id, name: property.name })}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pendingDelete && (
        <DeletePropertyDialog
          propertyId={pendingDelete.id}
          propertyName={pendingDelete.name}
          open={pendingDelete !== null}
          onOpenChange={(open) => {
            if (!open) setPendingDelete(null)
          }}
        />
      )}
    </>
  )
}
