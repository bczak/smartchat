import {getLogs} from '../memory.js'

export async function apply(cli) {
	cli
		.command('logs')
		.action(async () => {
			console.log((await getLogs()).join('\n'))
		})
}
