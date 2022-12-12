import {
  createXcm,
  getApi,
  getRelayApi,
  nextNonce,
  sovereignRelayOf,
  getDefaultRelayChainWsUrl,
  getDefaultParachainWsUrl
} from '../../utils'
import { Command, CreateCommandParameters, ActionParameters, program } from '@caporal/core'
import { Keyring } from '@polkadot/api'
import { PolkadotRuntimeParachainsConfigurationHostConfiguration } from '@polkadot/types/lookup'

export default function ({ createCommand }: CreateCommandParameters): Command {
  const relayChainUrl: string = getDefaultRelayChainWsUrl()
  return createCommand('open hrmp channel for specific parachains')
    .argument('<source>', 'paraId of source chain', {
      validator: program.NUMBER
    })
    .argument('<target>', 'paraId of target chain', {
      validator: program.NUMBER
    })
    .option('-r, --relay-ws [url]', 'the relaychain API endpoint', {
      default: `${process.env.RCHAIN_WS || relayChainUrl}` 
    })
    .option('-d, --dry-run [boolean]', 'whether to execute using SUDO_KEY', {
      validator: program.BOOLEAN,
      default: false
    })
    .action(HrmpOpen)
}

async function HrmpTest(ap: ActionParameters) {
  const {
    logger,
    args: { source, target },
    options: { relayWs, dryRun }
  } = ap
  const relayApi = await getRelayApi(relayWs.toString())
  const configuration =
    (await relayApi.query.configuration.activeConfig()) as unknown as PolkadotRuntimeParachainsConfigurationHostConfiguration
  
  const Alice = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
  const Bob = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';
  const CC = '5FZunkiwWGvrLm7hijjUnhq7AroeQaBdykd19Lu8bui6Qyf5';

  const signer = new Keyring({ type: 'sr25519' }).addFromUri(
    `${process.env.SUDO_KEY || '//Alice'}`
  )

  const unsub = await relayApi.tx.balances
    .transfer(CC, 1000000000)
    .signAndSend(signer, ({ events = [], status, txHash }) => {
      console.log(`Current status is ${status.type}`);

      if (status.isInBlock) {
        console.log(`Transaction included at blockHash ${status.asInBlock}`);
        console.log(`Transaction hash ${txHash.toHex()}`);

        // Loop through Vec<EventRecord> to display all events
        events.forEach(({ phase, event: { data, method, section } }) => {
          console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
        });

        unsub();
      }
    });
  
  const delay = ms => new Promise(res => setTimeout(res, ms));
  await delay(8000);

  var val = await relayApi.query.system.account(Alice);
  console.log(`Alice:`, val.toString())
  var val = await relayApi.query.system.account(Bob);
  console.log(`Bob:`, val.toString())
  var val = await relayApi.query.system.account(CC);
  console.log(`CC:`, val.toString())
  process.exit(0)

}

async function HrmpOpen(ap: ActionParameters) {
  const {
    logger,
    args: { source, target },
    options: { relayWs, dryRun }
  } = ap
  const relayApi = await getRelayApi(relayWs.toString())
  const configuration =
    (await relayApi.query.configuration.activeConfig()) as unknown as PolkadotRuntimeParachainsConfigurationHostConfiguration
  const etx = relayApi.tx.parasSudoWrapper
    .sudoEstablishHrmpChannel(
      source.valueOf() as number,
      target.valueOf() as number,
      configuration.hrmpChannelMaxCapacity,
      configuration.hrmpChannelMaxMessageSize
    )
  const tx = relayApi.tx.sudo.sudo(etx)
  const signer = new Keyring({ type: 'sr25519' }).addFromUri(
    `${process.env.SUDO_KEY || '//Alice'}`
  )

  if (dryRun) {
    return logger.info(`hex-encoded call: ${tx.toHex()}`)
  }

  const unsub = await tx.signAndSend(signer, ({ events = [], status, txHash }) => {
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
    })
    .catch(err => {
      logger.error(err.message)
      process.exit(1)
    })

  // logger.warn(`Wait for extrinsic state`)
  // const delay = ms => new Promise(res => setTimeout(res, ms));
  // await delay(8000);
  // unsub();
  // process.exit(0)
  
}
