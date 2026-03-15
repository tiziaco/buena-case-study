import { DashboardClient } from '@/components/dashboard/dashboard-client'

type SearchParams = Promise<{
  type?: string
  sizeMin?: string
  sizeMax?: string
  yearMin?: string
  yearMax?: string
}>

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const initialFilters = {
    type: params.type,
    sizeMin: params.sizeMin,
    sizeMax: params.sizeMax,
    yearMin: params.yearMin,
    yearMax: params.yearMax,
  }

  return <DashboardClient initialFilters={initialFilters} />
}
