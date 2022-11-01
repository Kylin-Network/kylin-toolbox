import { Command, CreateCommandParameters, program } from '@caporal/core'
import { Keyring } from '@polkadot/api'
import { blake2AsHex } from '@polkadot/util-crypto'
import { getApi, getCouncilThreshold, nextNonce } from '../../utils'

export default function ({ createCommand }: CreateCommandParameters): Command {
  return createCommand('create a specific feed')
    .option('-p, --para-ws [url]', 'the parachain API endpoint', {
      default: 'ws://10.2.3.102:8845'
    })
    .option('-c, --collection_id: [value]', 'any number', {
      default: '0'
    })
    .option('-o, --oracle_paraid: [value]', 'max amount', {
      default: '2102'
    })
    .option('-k, --key [hash]', "any hex data", {
      default: '0x4343417069'
    })
    .option('-u, --url [hash]', "any hex data", {
      default: '0x68747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d627463267473796d733d75736474'
    })
    .option('-d, --dry-run [boolean]', 'whether to execute using ACCOUNT_KEY', {
      validator: program.BOOLEAN,
      default: true
    })
    .action(async actionParameters => {
      const {
        logger,
        options: { paraWs, dryRun, collection_id, oracle_paraid, key, url }
      } = actionParameters
      
      const api = await getApi(paraWs.toString())
      const signer = new Keyring({ type: 'sr25519' }).addFromUri(
        `${process.env.ACCOUNT_KEY || '//Alice'}`
      )
    
        const delay = ms => new Promise(res => setTimeout(res, ms));
        logger.warn(`Connected to WS endpoint: ${paraWs}`)
        await delay(4000);
        

      const tx = api.tx.kylinFeed.createFeed(collection_id, oracle_paraid, key, url)
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
