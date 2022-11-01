import axios from 'axios'
import https from 'https'
import { Command, CreateCommandParameters, program } from '@caporal/core'
import { Keyring } from '@polkadot/api'
import { blake2AsHex } from '@polkadot/util-crypto'
import { getApi, getCouncilThreshold, nextNonce } from '../../utils'

export default function ({ createCommand }: CreateCommandParameters): Command {
  return createCommand('query a specific feed')
    .option('-p, --para-ws [url]', 'the parachain API endpoint', {
      default: 'ws://10.2.3.102:8845'
    })
    .option('-c, --collection_id [value]', 'any value', {
      default: '0xaabbcc'
    })
    .option('-n, --nft_id [value]', 'any value', {
      default: '256'
    })
    .option('-d, --dry-run [boolean]', 'whether to execute using ACCOUNT_KEY', {
      validator: program.BOOLEAN,
      default: true
    })
    .action(async actionParameters => {
      const {
        logger,
        options: { paraWs, dryRun, collection_id, nft_id }
      } = actionParameters
      
      const api = await getApi(paraWs.toString())
      const signer = new Keyring({ type: 'sr25519' }).addFromUri(
        `${process.env.ACCOUNT_KEY || '//Alice'}`
      )
      const tx = api.tx.kylinFeed.queryFeed(collection_id,nft_id)

      const delay = ms => new Promise(res => setTimeout(res, ms));
        logger.warn(`Connected to WS endpoint: ${paraWs}`)
       await delay(4000);
        
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
