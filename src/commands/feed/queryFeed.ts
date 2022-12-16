import axios from 'axios'
import https from 'https'
import { Command, CreateCommandParameters, program } from '@caporal/core'
import { Keyring } from '@polkadot/api'
import { TypeRegistry } from '@polkadot/types'
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
    .option('-k, --key [key]', "key string", {
      default: 'PriceBtcUsdt'
    })
    .option('-d, --dry-run [boolean]', 'whether to execute using ACCOUNT_KEY', {
      validator: program.BOOLEAN,
      default: false
    })
    .action(async actionParameters => {
      const {
        logger,
        options: { paraWs, dryRun, collectionId, nftId, key }
      } = actionParameters

      const api = await getApi(
        paraWs.toString()
      )

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
            // events.forEach(({ phase, event: { data, method, section } }) => {
            //   console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
            // });

            unsub();
          }
        }).catch(err => {
          logger.error(err.message)
          process.exit(1)
        })
      
      // clear old events
      const evts = await api.query.system.events()
      console.log(`Clear old events (${evts.length})`);
      // value before query
      let value = await api.query.kylinFeed.values(key)
      console.log(`Value before query: ${value}`)

      api.query.system.events((events) => {
        //console.log(`\nReceived ${events.length} events:`);

        // Loop through the Vec<EventRecord>
        events.forEach(async (record) => {
          // Extract the phase, event and the event types
          const { event, phase } = record;
          const types = event.typeDef;

          if (event.section == 'kylinFeed' && event.method == 'QueryFeedBack') {
            console.log(`${event.section}:${event.method}:`);
            event.data.forEach((data, index) => {
              console.log(`\t${types[index].type}: ${data.toString()}`);
            });

            // let value = await api.query.kylinFeed.values(key)
            // console.log(`updated value: ${value}`)
            process.exit(0)
          }
        });
      });

      // const delay = ms => new Promise(res => setTimeout(res, ms));
      // await delay(800000);
      // process.exit(0)
      
    })
}
