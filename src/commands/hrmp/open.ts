import {
  createXcm,
  getApi,
  getRelayApi,
  nextNonce,
  sovereignRelayOf,
  getDefaultRelayChainWsUrl,
  getDefaultParachainWsUrl,
  getCouncilThreshold
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
    .option('-p, --para-ws [url]', 'the parachain API endpoint', {
      default: paraChainUrl
    })
    .option('-d, --dry-run [boolean]', 'whether to execute using ACCOUNT_KEY', {
      validator: program.BOOLEAN,
      default: true
    })
    .action(HrmpOpen)
}

async function HrmpOpen(ap: ActionParameters) {
  const {
    logger,
    args: { source, target },
    options: { relayWs, paraWs, dryRun }
  } = ap
  const relayApi = await getRelayApi(relayWs.toString())
  const api = await getApi(paraWs.toString())
  const configuration =
    (await relayApi.query.configuration.activeConfig()) as unknown as PolkadotRuntimeParachainsConfigurationHostConfiguration
  const encoded = relayApi.tx.hrmp
    .hrmpInitOpenChannel(
      target.valueOf() as number,
      configuration.hrmpChannelMaxCapacity,
      configuration.hrmpChannelMaxMessageSize
    )
    .toHex()
  const signer = new Keyring({ type: 'sr25519' }).addFromUri(
    `${process.env.ACCOUNT_KEY || '//Alice'}`
  )
  const proposal = api.tx.ormlXcm.sendAsSovereign(
    {
      V1: {
        parents: 1,
        interior: 'Here'
      }
    },
    createXcm(`0x${encoded.slice(6)}`, sovereignRelayOf(source.valueOf() as number))
  )
  const tx = api.tx.generalCouncil.propose(
    await getCouncilThreshold(api),
    proposal,
    proposal.length
  )

  if (dryRun) {
    return logger.info(`hex-encoded call: ${tx.toHex()}`)
  }

  await tx
    .signAndSend(signer, { nonce: await nextNonce(api, signer) })
    .then(() => process.exit(0))
    .catch(err => {
      logger.error(err.message)
      process.exit(1)
    })
}
