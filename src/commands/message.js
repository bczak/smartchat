import chalk from 'chalk'
import {stop} from '../cli.js'
import {getIP, getName, getUUID} from '../memory.js'
import {server} from '../server.js'
import {client} from '../client.js'

export async function apply(cli) {
	cli
		.command('message')
		.action(async () => {
            await stop();
			
		})
}
