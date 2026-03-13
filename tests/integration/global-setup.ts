import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { execSync } from 'child_process'

export async function setup({ provide }: { provide: (key: string, value: string) => void }) {
  const container = await new PostgreSqlContainer('postgres:16').start()
  const databaseUrl = container.getConnectionUri()

  execSync(`npx prisma migrate deploy`, {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
    cwd: process.cwd(),
  })

  provide('databaseUrl', databaseUrl)

  return async () => {
    await container.stop()
  }
}
