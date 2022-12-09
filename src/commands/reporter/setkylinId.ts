import { Command, CreateCommandParameters, program } from '@caporal/core'
import { Keyring } from '@polkadot/api'
import { blake2AsHex } from '@polkadot/util-crypto'
import { getApi, getCouncilThreshold, nextNonce } from '../../utils'

export default function ({ createCommand }: CreateCommandParameters): Command {
  return createCommand('set kylinId of the Oracle parachain')
    .option('-p, --para-ws [url]', 'the parachain API endpoint', {
      default: `${process.env.PCHAIN1_WS || 'ws://10.2.3.102:8846'}`
    })
    .option('-o, --oracle_paraid: [value]', 'any value', {
      validator: program.NUMBER,
      default: 2000
    })
    .option('-d, --dry-run [boolean]', 'whether to execute using ACCOUNT_KEY', {
      validator: program.BOOLEAN,
      default: false
    })
    .action(async actionParameters => {
      const {
        logger,
        options: { paraWs, oracleParaid, dryRun }
      } = actionParameters

      const api = await getApi(paraWs.toString())
      const signer = new Keyring({ type: 'sr25519' }).addFromUri(
        `${process.env.ACCOUNT_KEY || '//Alice'}`
      )

      //const tx = api.tx.utility.batchAll([
      //  api.tx.kylinFeed.createCollection(metadata,max,symbol),
      //])

      const tx = api.tx.kylinReporterPallet.setKylinId(oracleParaid)
      if (dryRun) {
        logger.info(`hex-encoded call: ${tx.toHex()}`)
        return
      }

      const unsub = await tx.signAndSend(
        signer, { nonce: await nextNonce(api, signer) },
        ({ events = [], status, txHash }) => {
          console.log(`Current status is ${status.type}`);

          if (status.isInBlock) {
            logger.info(`Oracle_paraid succsessfully set`)
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
