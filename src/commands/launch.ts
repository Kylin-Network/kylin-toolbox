import '@polkadot/api-augment'
import { Keyring } from '@polkadot/api'
import {
  chainHeight,
  createAddress,
  nextNonce,
  sleep,
  sovereignRelayOf,
  subAccountId,
  exec,
  getApi,
  getRelayApi
} from '../utils'
import { ActionParameters, Command, CreateCommandParameters } from '@caporal/core'

const GiftPalletId = 'par/gift'

async function para({ logger, options: { paraWs, network } }: ActionParameters) {
  const api = await getApi(paraWs.toString())

  logger.info('Wait for parachain to produce blocks')
  do await sleep(1000)
  while (!(await chainHeight(api)))

  const keyring = new Keyring({ type: 'sr25519' })
  const signer = keyring.addFromUri(`${process.env.PARA_CHAIN_SUDO_KEY || '//Dave'}`)
  const call = []


 

  logger.info('Submit parachain batches.')
  await api.tx.utility.batchAll(call).signAndSend(signer, { nonce: await nextNonce(api, signer) })
}

async function relay({ logger, options: { relayWs, network } }: ActionParameters) {
  
  const api = await getRelayApi(relayWs.toString())

  logger.info('Wait for relaychain to produce blocks')
  do await sleep(1000)
  while (!(await chainHeight(api)))

  const keyring = new Keyring({ type: 'sr25519' })
  const signer = keyring.addFromUri(`${process.env.RELAY_CHAIN_SUDO_KEY || ''}`)


  logger.info('Wait parathread to be onboarded.')
  await sleep(360000)

  logger.info('Start new auction.')
  const call = []


  await api.tx.utility.batchAll(call).signAndSend(signer, { nonce: await nextNonce(api, signer) })
}

export default function ({ createCommand }: CreateCommandParameters): Command {
  return createCommand('run chain initialization scripts')
    .option('-r, --relay-ws [url]', 'the relaychain API endpoint', {
      default: 'ws://127.0.0.1:9944'
    })
    .option('-p, --para-ws [url]', 'the parachain API endpoint', {
      default: 'ws://127.0.0.1:9948'
    })
    .option('-n, --network [name]', 'the parachain network', {
      default: 'vanilla-dev'
    })
    .action(actionParameters => {
      const { logger } = actionParameters
      return relay(actionParameters)
        .then(() => para(actionParameters))
        .then(() => process.exit(0))
        .catch(err => {
          logger.error(err.message)
          process.exit(1)
        })
    })
}
