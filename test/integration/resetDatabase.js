import { exec } from 'child_process'

export default function resetDatabase() {
  return exec('npm run db:reset')
}
