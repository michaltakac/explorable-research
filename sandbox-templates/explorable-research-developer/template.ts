import { Template, waitForPort } from 'e2b'

export const template = Template()
  .fromNodeImage('24-slim')
  .aptInstall(['curl', 'git']) // required for waitForPort()
  .setWorkdir('/home/user')
  .skipCache()
  .gitClone('https://github.com/michaltakac/explorable-research.git', 'repo')
  .runCmd('mv /home/user/repo/sandbox-templates/explorable-research-developer/template/* /home/user/ && rm -rf /home/user/repo')
  .setWorkdir('/home/user')
  .runCmd(
    'ls -al',
  )
  .runCmd(
    'npm install',
  )
  .setStartCmd('npm run dev', waitForPort(3000))
