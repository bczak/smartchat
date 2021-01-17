import * as fs from 'fs'
import chalk from 'chalk'
import {getMessages} from '../memory.js'
export async function apply(cli) {
	cli
		.command('export', 'export message history')
		.action(async (args) => {
			const name = `messages_${process.env.PORT || 7777}_${new Date().toISOString()}.txt`
			let messages = await getMessages();
			messages.sort((a, b) => (new Date(a.time) > new Date(b.time)) ? 1: -1)
			messages = messages.map(message => `[${message.time}](${message.from.name}): ${message.text}`)
			messages = messages.join('\n')
			fs.writeFileSync(name, messages)
			console.log(chalk.yellowBright(`Exported to ${name}`))
		})
}