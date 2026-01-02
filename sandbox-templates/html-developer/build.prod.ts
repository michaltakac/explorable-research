import { template } from './template'
import { config } from 'dotenv'
import { defaultBuildLogger, Template } from 'e2b'

config({ path: '../../.env' })

Template.build(template, {
    alias: `html-developer`,
    cpuCount: 4,
    memoryMB: 1024,
    onBuildLogs: defaultBuildLogger(),
  })
  