import { name as templateAlias } from './package.json'
import { template } from './template'
import { config } from 'dotenv'
import { defaultBuildLogger, Template } from 'e2b'

config({ path: '../../.env' })

Template.build(template, {
  alias: templateAlias,
  cpuCount: 4,
  memoryMB: 4096,
  onBuildLogs: defaultBuildLogger(),
})
