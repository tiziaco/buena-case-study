'use client'

import { useQuery } from '@tanstack/react-query'

export type User = {
  id: string
  name: string
  email: string
}

async function fetchUsers(): Promise<User[]> {
  const res = await fetch('/api/users')
  if (!res.ok) throw new Error('Failed to fetch users')
  const json = await res.json()
  return json.data
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
