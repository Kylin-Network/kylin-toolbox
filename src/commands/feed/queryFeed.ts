import axios from 'axios'
import https from 'https'
import { Command, CreateCommandParameters, program } from '@caporal/core'
import { Keyring } from '@polkadot/api'
import { blake2AsHex } from '@polkadot/util-crypto'
import { getApi, getCouncilThreshold, nextNonce } from '../../utils'

export default function ({ createCommand }: CreateCommandParameters): Command {
  return createCommand('query a specific feed')
    .option('-p, --para-ws [url]', 'the parachain API endpoint', {
      default: `${process.env.PCHAIN1_WS || 'ws://10.2.3.102:8846'}`
    })
    .option('-c, --collection-id [value]', 'collection id', {
      default: '0'
    })
    .option('-n, --nft-id [value]', 'NFT id', {
      default: '0'
    })
    .option('-d, --dry-run [boolean]', 'whether to execute using ACCOUNT_KEY', {
      validator: program.BOOLEAN,
      default: false
    })
    .action(async actionParameters => {
      const {
        logger,
        options: { paraWs, dryRun, collectionId, nftId }
      } = actionParameters
      
      const api = await getApi(paraWs.toString())
      const signer = new Keyring({ type: 'sr25519' }).addFromUri(
        `${process.env.ACCOUNT_KEY || '//Alice'}`
      )
      const tx = api.tx.kylinFeed.queryFeed(collectionId, nftId)
        
      const unsub = await tx.signAndSend(
        signer,
        ({ events = [], status, txHash }) => {
          console.log(`Current status is ${status.type}`);

          if (status.isInBlock) {
            console.log(`Transaction included at blockHash ${status.asInBlock}`);
            console.log(`Transaction hash ${txHash.toHex()}`);

            // Loop through Vec<EventRecord> to display all events
            events.forEach(({ phase, event: { data, method, section } }) => {
              console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
            });

            unsub();
            process.exit(0)
          }
        }).catch(err => {
          logger.error(err.message)
          process.exit(1)
        })
    })
}
