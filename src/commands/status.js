import chalk from 'chalk'
import {getIP, getName, getUUID} from '../memory.js'
import {server} from '../server.js'
import {client} from '../client.js'

export async function apply(cli) {
	cli
		.command('status')
		.action(async () => {
			console.log(`You are ${chalk.green(await getName())}`)
			console.log(`Your URL: ${chalk.green(await getIP())}:${chalk.red(process.env.PORT || 7777)}`)
			console.log(`Your UUID: ${chalk.green(await getUUID())}`)
			if(server.client.uuid || client.client.uuid) {
				console.log(chalk.blue('Connected nodes:'))
				console.log(chalk.green(`\tPrevious: ${server.client.name} (${server.client.uuid}) ${server._wait}`))
				console.log(chalk.green(`\tNext: ${client.client.name} (${client.client.uuid}) ${client._wait}`))
			}
			console.log(chalk.blue('Leader node: ') + chalk.green(server.leader.uuid))
			
		})
}
