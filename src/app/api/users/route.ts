import { getUsers } from '@/lib/services/user'
import { apiSuccess, apiError } from '@/lib/api/response'

export async function GET(): Promise<Response> {
  try {
    const users = await getUsers()
    return apiSuccess(users)
  } catch {
    return apiError('Failed to fetch users', 500)
  }
}
