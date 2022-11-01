import axios from "axios";
import https from "https";
import { Command, CreateCommandParameters, program } from '@caporal/core'
import { getTokenBalances, EthScanOptions } from '@mycrypto/eth-scan'
import { fromWei } from 'web3-utils'

import { decodeAddress, encodeAddress } from '@polkadot/keyring'
import { hexToU8a, isHex } from '@polkadot/util'

function isValidAddress(address: string): boolean {
  try {
    encodeAddress(isHex(address) ? hexToU8a(address) : decodeAddress(address))
    return true
  } catch (error) {
    return false
  }
}
import fs from 'fs'
const addresses: string[] = []
const allContents = fs.readFileSync('tokenHolders.txt', 'utf-8')
allContents.split(/\r?\n/).forEach(line => {
  if (line) {
    addresses.push(line)
  }
})

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
      const provider =
        'https://dry-responsive-wildflower.discover.quiknode.pro/0fd3f35ace685648e47144b6ff8ba3aaa15882f9/'

      // eslint-disable-next-line @typescript-eslint/no-var-requires

      const token = '0x67B6D479c7bB412C54e03dCA8E1Bc6740ce6b99C'
      const options: EthScanOptions = { batchSize: 2 }
      const balances = await getTokenBalances(provider, addresses, token, options)
      // const web3 = new Web3(provider)
      const json = JSON.stringify(balances, (_, v) => (typeof v === 'bigint' ? v.toString() : v))
      const res = JSON.parse(json)
      for (const key in res) {
        const url = `https://airdrop.kylin.network/api?getlast=${key.toString()}`
        const getlast = await axios.get(url, {
          responseType: 'arraybuffer',
          httpsAgent: new https.Agent({ keepAlive: true })
        });
        console.log(
          `${key};${fromWei(res[key], 'ether')};${
            0.034 * Number(fromWei(res[key], 'ether'))
          };${
            isValidAddress(getlast.data.toString().replace(/\s/g, ""))
              ? getlast.data.toString().replace(/\s/g, "")
              : "substrate-address-not-valid"
          }`
        );
      }

      // const balances= getTokenBalances(provider, addresses, token).then(console.log);
    });
}
