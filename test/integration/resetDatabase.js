import { promisify } from 'util'
import { exec as execCallback } from 'child_process'

const exec = promisify(execCallback)

export default function resetDatabase() {
  return exec('npm run db:reset')
}
