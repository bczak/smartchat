import {getLogs} from '../memory.js'

export async function apply(cli) {
	cli
		.command('election')
		.action(async () => {
			console.log((await getLogs()).join('\n'))
		})
}
