import {server} from '../server.js'
import {client} from '../client.js'

export async function apply(cli) {
	cli
		.command('disconnect')
		.action(async () => {
			server.restart()
		})
}
