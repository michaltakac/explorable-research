import { template } from './template'
import { config } from 'dotenv'
import { defaultBuildLogger, Template } from 'e2b'

config({ path: '../../.env.local' })

Template.build(template, {
    alias: `html-developer-dev`,
    cpuCount: 4,
    memoryMB: 1024,
    onBuildLogs: defaultBuildLogger(),
  })
  