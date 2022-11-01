import { Command, CreateCommandParameters, program } from '@caporal/core'
import { Keyring } from '@polkadot/api'
import { blake2AsHex } from '@polkadot/util-crypto'
import { getApi, getCouncilThreshold, nextNonce } from '../../utils'

export default function ({ createCommand }: CreateCommandParameters): Command {
  return createCommand('create collection of feeds')
    .option('-p, --para-ws [url]', 'the parachain API endpoint', {
      default: 'ws://10.2.3.102:8845'
    })
    .option('-m, --metadata [name]', 'any hex data', {
      default: '0xaabbcc'
    })
    .option('-x, --max [value]', 'max amount', {
      default: '256'
    })
    .option('-s, --symbol [hash]', "any hex data", {
      default: '0xaabbcc'
    })
    .option('-d, --dry-run [boolean]', 'whether to execute using ACCOUNT_KEY', {
      validator: program.BOOLEAN,
      default: true
    })
    .action(async actionParameters => {
      const {
        logger,
        options: { paraWs, dryRun, metadata, max, symbol }
      } = actionParameters
      
      const api = await getApi(paraWs.toString())
      const signer = new Keyring({ type: 'sr25519' }).addFromUri(
        `${process.env.ACCOUNT_KEY || '//Alice'}`
      )
    
        const delay = ms => new Promise(res => setTimeout(res, ms));
        logger.warn(`Connected to WS endpoint: ${paraWs}`)
        await delay(4000);
        
      //const tx = api.tx.utility.batchAll([
      //  api.tx.kylinFeed.createCollection(metadata,max,symbol),
      //])

      const tx = api.tx.kylinFeed.createCollection(metadata,max,symbol)
      if (dryRun) {
        logger.info(`hex-encoded call: ${tx.toHex()}`)
      }
      await tx
      .signAndSend(signer, { nonce: await nextNonce(api, signer) })
      .then(response => {
        return response;
      })
      .catch(err => {
        logger.error(err.message)
        process.exit(1)
      })
        process.exit(1)
    })
}
