import { getUsers } from '@/lib/services/user'
import { apiSuccess, apiError } from '@/lib/api/response'

export async function GET(): Promise<Response> {
  try {
    const users = await getUsers()
    return apiSuccess(users)
  } catch (e) {
    console.error('[GET /api/users]', e)
    return apiError('Failed to fetch users', 500)
  }
}
