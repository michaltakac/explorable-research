import { Template, waitForPort } from 'e2b'

export const template = Template()
  .fromNodeImage('24-slim')
  .aptInstall(['curl', 'git']) // required for waitForPort()
  .setWorkdir('/home/user/repo')
  .gitClone('https://github.com/michaltakac/explorable-research.git')
  .runCmd('mv /home/user/repo/sandbox-templates/explorable-research-developer/template* /home/user/ && rm -rf /home/user/repo')
  .setWorkdir('/home/user')
  .runCmd(
    'npm install',
  )
  .runCmd(
    'ls -al',
  )
  .setStartCmd('npm run dev', waitForPort(3000))
