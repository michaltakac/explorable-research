import { Template, waitForPort } from 'e2b'

export const template = Template()
  .fromNodeImage('24-slim')
  .aptInstall(['curl', 'git']) // required for waitForPort()
  .setWorkdir('/home/user')
  .skipCache()
  .copy('index.html', 'index.html')
  .copy('style.css', 'style.css')
  .copy('main.js', 'main.js')
  .runCmd('ls -al')
  .setStartCmd('npx http-server . -a 0.0.0.0 -p 3000 --cors', waitForPort(3000))

