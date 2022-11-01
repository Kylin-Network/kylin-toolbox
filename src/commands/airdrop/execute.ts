import { Command, CreateCommandParameters, program } from '@caporal/core'
import { Keyring } from '@polkadot/api'
import { blake2AsHex } from '@polkadot/util-crypto'
import { BN } from '@polkadot/util'
import { getApi, getCouncilThreshold, nextNonce } from '../../utils'
import { Float } from '@polkadot/types-codec'
import fs from 'fs'
const addresses: string[][] = []
const allContents = fs.readFileSync('distirbution.csv', 'utf-8')
allContents.split(/\r?\n/).forEach(line => {
  if (line) {
    addresses.push(line.split(','))
  }
})


export default function ({ createCommand }: CreateCommandParameters): Command {
  return createCommand('execute the airdrop')
    .option('-p, --para-ws [url]', 'the parachain API endpoint', {
      default: 'wss://pichiu-rococo-01.onebitdev.com'
    })
    .option('-f, --filename [name]', 'file name', {
      default: '0xaabbcc'
    })
     .action(async actionParameters => {
      const {
        logger,
        options: { paraWs, filename }
      } = actionParameters
      
      const api = await getApi(paraWs.toString())
      const signer = new Keyring({ type: 'sr25519' }).addFromUri(
        `${process.env.ACCOUNT_KEY || '//Alice'}`
      )
    
        const delay = ms => new Promise(res => setTimeout(res, ms));
        logger.warn(`Connected to WS endpoint: ${paraWs}`)
        await delay(2000);
        
      //const tx = api.tx.utility.batchAll([
      //  api.tx.kylinFeed.createCollection(metadata,max,symbol),
      //])

 // Form the transaction
function balance (amountInt: Number, decimalsString?: string) {
  const decimalsPadded = (decimalsString || '').padEnd(18, '0')
  return new BN(amountInt.toString() + decimalsPadded)
}
let txs = []

for(let i=0; i<addresses.length; i++){
  console.log(addresses[i][0],addresses[i][1]); //use i instead of 0
//let tx = api.tx.balances
//  .transfer(addresses[i][0], balance(Number(addresses[i][1])))

  txs.push(api.tx.balances.transfer(addresses[i][0], balance(Number(addresses[i][1]))))
  
}
// Retrieve the encoded calldata of the transaction
// let encodedCalldata = tx.method.toHex()
// console.log(encodedCalldata)

// Sign and send the transaction
// let txHash = await tx
//  .signAndSend(signer);

api.tx.utility
  .batch(txs)
  .signAndSend(signer, ({ status }) => {
    if (status.isInBlock) {
      console.log(`included in ${status.asInBlock}`);
    }
  });

  
  logger.warn(`--------------------------------`)
  await delay(13000);

process.exit(1)
    })
}
