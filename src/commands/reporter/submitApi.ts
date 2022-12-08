import { Command, CreateCommandParameters, program } from '@caporal/core'
import { Keyring } from '@polkadot/api'
import { blake2AsHex } from '@polkadot/util-crypto'
import { getApi, getCouncilThreshold, nextNonce } from '../../utils'

export default function ({ createCommand }: CreateCommandParameters): Command {
  return createCommand('submit an API key and Url')
    .option('-p, --para-ws [url]', 'the parachain API endpoint', {
      default: 'ws://10.2.3.102:8846'
    })
    .option('-k, --key [key]', 'key hex data', {
      default: '0x507269636542746355736474'
    })
    .option('-u, --url [url]', 'url hex data', {
      default: '0x68747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d627463267473796d733d75736474'
    })
    .option('-v, --vpath [vpath]', 'vpath hex data', {
      default: '0x2f55534454'
    })
    .option('-d, --dry-run [boolean]', 'whether to execute using ACCOUNT_KEY', {
      validator: program.BOOLEAN,
      default: false
    })
    .action(async actionParameters => {
      const {
        logger,
        options: { paraWs, key, url, vpath, dryRun }
      } = actionParameters
      
      const api = await getApi(paraWs.toString())
      const signer = new Keyring({ type: 'sr25519' }).addFromUri(
        `${process.env.ACCOUNT_KEY || '//Alice'}`
      )
    
      const tx = api.tx.kylinReporterPallet.submitApi(key, url, vpath)
      if (dryRun) {
        logger.info(`hex-encoded call: ${tx.toHex()}`)
        return
      }

      const unsub = await tx.signAndSend(
        signer, { nonce: await nextNonce(api, signer) },
        ({ events = [], status, txHash }) => {
          console.log(`Current status is ${status.type}`);

          if (status.isInBlock) {
            logger.info(`Call succeeded - API successfully submitted`)
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
