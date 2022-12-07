import {
  createXcm,
  getApi,
  getRelayApi,
  nextNonce,
  sovereignRelayOf,
  getDefaultRelayChainWsUrl,
  getDefaultParachainWsUrl
} from '../../utils'
import { Command, CreateCommandParameters, ActionParameters, program } from '@caporal/core'
import { Keyring } from '@polkadot/api'
import { PolkadotRuntimeParachainsConfigurationHostConfiguration } from '@polkadot/types/lookup'

export default function ({ createCommand }: CreateCommandParameters): Command {
  const relayChainUrl: string = getDefaultRelayChainWsUrl()
  const paraChainUrl: string = getDefaultParachainWsUrl()
  return createCommand('open hrmp channel to specific chain')
    .argument('<source>', 'paraId of source chain', {
      validator: program.NUMBER
    })
    .argument('<target>', 'paraId of target chain', {
      validator: program.NUMBER
    })
    .option('-r, --relay-ws [url]', 'the relaychain API endpoint', {
      default: relayChainUrl
    })
    .option('-d, --dry-run [boolean]', 'whether to execute using SUDO_KEY', {
      validator: program.BOOLEAN,
      default: true
    })
    .action(HrmpOpen)
}

async function HrmpTest(ap: ActionParameters) {
  const {
    logger,
    args: { source, target },
    options: { relayWs, dryRun }
  } = ap
  const relayApi = await getRelayApi(relayWs.toString())
  const configuration =
    (await relayApi.query.configuration.activeConfig()) as unknown as PolkadotRuntimeParachainsConfigurationHostConfiguration
  
  const Alice = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
  const Bob = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';

  var val = await relayApi.query.system.account(Alice);
  console.log(`Alice:`, val.toString())
  var val = await relayApi.query.system.account(Bob);
  console.log(`Bob:`, val.toString())
  process.exit(0)
  
}


async function HrmpOpen(ap: ActionParameters) {
  const {
    logger,
    args: { source, target },
    options: { relayWs, dryRun }
  } = ap
  const relayApi = await getRelayApi(relayWs.toString())
  const configuration =
    (await relayApi.query.configuration.activeConfig()) as unknown as PolkadotRuntimeParachainsConfigurationHostConfiguration
  const etx = relayApi.tx.parasSudoWrapper
    .sudoEstablishHrmpChannel(
      source.valueOf() as number,
      target.valueOf() as number,
      8,
      32000,
    )

  const tx = relayApi.tx.sudo.sudo(etx)
  const signer = new Keyring({ type: 'sr25519' }).addFromUri(
    `${process.env.SUDO_KEY || '//Alice'}`
  )
  logger.info(`signer address: ${signer.address}`)

  if (dryRun) {
    return logger.info(`hex-encoded call: ${tx.toHex()}`)
  }

  await tx
    .signAndSend(signer, { nonce: await nextNonce(relayApi, signer) })
    .then(() => process.exit(0))
    .catch(err => {
      logger.error(err.message)
      process.exit(1)
    })

  process.exit(0)
  
}
