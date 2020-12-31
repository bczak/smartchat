import inquirer from 'inquirer'
import vorpal from 'vorpal'
import {getIP, getName, getUUID} from './memory.js'
import server from './server.js'
import chalk from 'chalk'

const port = process.env.PORT || 7777
const hostnamePromt = [
	{
		type: 'input',
		name: 'host',
		message: 'Enter hostname:',
		default: '192.168.0.132'
	}
]
const portPromt = [
	{
		type: 'number',
		name: 'port',
		message: 'Enter port:',
		default: 7777
	}
]
const members = async (data) => {
	return {
		type: 'checkbox',
		name: 'recipient',
		message: 'Choose one or more recipients:',
		choices: data.map(e => `${e.name} : ${e.uuid}`)
	}
}
const msg = [{
	type: 'input',
	name: 'message',
	message: 'You:'
}]


const cli = vorpal()
const listeners = process.stdin.removeAllListeners('keypress')

cli
	.command('connect', 'Connect to existing network')
	.option('-h, --host <host>', 'Host\'s IP to connect')
	.option('-p, --port <port>', 'Host\'s port to connect. Default is 7777')
	.action(async (args) => {
		const options = {host: args.options.host || 'localhost', port: args.options.port || 7777}
		if (args.options.host === undefined) options.host = (await inquirer.prompt(hostnamePromt)).host
		if (args.options.port === undefined) options.port = (await inquirer.prompt(portPromt)).port
		await server.connect(options)
	})
cli
	.command('disconnect', 'Disconnect from network')
	.action(async (args, callback) => {
		await server.disconnect()
	})

cli
	.command('status')
	.cancel(function () {
		this.log('Didn\'t mother teach you to be patient?')
	})
	.action(async (args) => {
		console.log(`You are ${chalk.green(await getName())}`)
		console.log(`Your URL: ${chalk.green(await getIP())}:${chalk.red(port)}`)
		console.log(`Your UUID: ${chalk.green(await getUUID())}`)
		console.log(chalk.blue('Connected nodes:'))
		console.log(chalk.green(`\tPrevious: ${server.incoming.name} (${server.incoming.host}:${chalk.red(server.incoming.port)})`))
		console.log(chalk.green(`\tNext: ${server.client.name} (${server.client.host}:${chalk.red(server.client.port)})`))
		console.log(chalk.blue('Leader node: ') + chalk.green(server.le.uuid))
	})
cli
	.command('chat', 'Start messaging to someone')
	.cancel(async () => {
		cli.hide()
		console.log('stopped')
	})
	.action(async (args) => {
		console.log('chat')
	})

cli
	.catch('[words...]', 'Catches incorrect commands')
	.action(function (args, cb) {
		this.log(args.words.join(' ') + ' is not a valid command.')
		cb()
	})

export async function messaging() {
	let {message} = await inquirer.prompt(msg)
	if (message.length === 0) return
	// cli.ui.redraw(chalk.bgGreen(`[${DateTime.local().toFormat('dd/LL/yyyy HH:mm:ss')}] You:`))
	// console.log(message + '\n')
	await messaging()
}

export async function start() {
	const name = await getName()
	await cli
		.delimiter(`${name} >`)
		.show()
}


export default cli