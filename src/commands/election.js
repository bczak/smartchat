import {server} from '../server.js'

export async function apply(cli) {
	cli
		.command('election')
		.action(async () => {
			server.startElection()
		})
}
