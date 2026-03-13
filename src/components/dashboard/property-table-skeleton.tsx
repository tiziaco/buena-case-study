import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const COLUMNS = ['Name', 'Type', 'Property No.', 'Manager', 'Created']

export function PropertyTableSkeleton() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((col) => (
              <TableHead key={col}>{col}</TableHead>
            ))}
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-40" /></TableCell>
              <TableCell><Skeleton className="h-5 w-12" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-28" /></TableCell>
              <TableCell />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
