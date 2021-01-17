import {start, stop, updateStatus} from '../cli.js'
import chalk from 'chalk'
import inquirer from 'inquirer'
import {client} from '../client.js'
const msg = [{
	type: 'input',
	name: 'message',
	message: ''
}]

async function messaging(cli) {
	let {message} = await inquirer.prompt(msg)
	if (message.length === 0) return
	await cli.ui.redraw.done()
	await cli.ui.redraw()
	await client.send(message)
	// cli.ui.redraw(chalk.bgGreen.yellowBright(`[${DateTime.local().toFormat('dd/LL/yyyy HH:mm:ss')}] `) + chalk.bgGreen.black.bold(`You:`))
	// console.log(message + '\n')
	await messaging(cli)
}
export async function apply(cli) {
	cli
		.command('message')
		.action(async () => {
			if (client.client.socket === null) {
				return console.log(chalk.red("You are not connected!"))
			}
			await stop()
			cli.ui.redraw(chalk.green('Chating'))
			await updateStatus({message: true})
			await messaging(cli)
			await cli.ui.redraw.clear()
			await cli.ui.redraw.done()
			await updateStatus({message: false})
			await start()
		})
}
