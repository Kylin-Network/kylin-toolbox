import pichiuConfig from './pichiu.json'
import kylinConfig from './kylin.json'

export default function getConfig(network: string) {
  switch (network) {
    case 'vanilla-dev':
    case 'pichiu-dev':
      return pichiuConfig
    case 'kerria-dev':
    case 'kylin-dev':
      return kylinConfig
    default:
      throw new Error(`unsupported network detected: ${network}`)
  }
}
