import inquirer from 'inquirer'
import vorpal from 'vorpal'
import {getIP, getName} from './memory.js'
import Client from './client.js'
import server from './server.js'
import chalk from 'chalk'

const port = process.env.PORT || 7777
const hostnamePromt = [
	{
		type: 'input',
		name: 'host',
		message: 'Enter hostname:',
		default: 'localhost'
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

const cli = vorpal()
const listeners = process.stdin.removeAllListeners('keypress');

cli
	.command('connect', 'Connect to existing network')
	.option('-h, --host <host>', 'Host\'s IP to connect')
	.option('-p, --port <port>', 'Host\'s port to connect. Default is 7777')
	.action(async (args) => {
		const options = {host: args.options.host || 'localhost', port: args.options.port || 7777}
		if (args.options.host === undefined) options.host = (await inquirer.prompt(hostnamePromt)).host
		if (args.options.port === undefined) options.port = (await inquirer.prompt(portPromt)).port
		const client = new Client(options)
		await client.connect()
	})
cli
	.command('disconnect', 'Disconnect from network')
	.action((args, callback) => {
		server.disconnect().then(() => callback())
	})

cli
	.command('status')
	.cancel(function () {
		this.log('Didn\'t mother teach you to be patient?')
	})
	.action(async (args) => {
		console.log(`You are ${chalk.green(await getName())}`)
		console.log(`Your URL: ${chalk.green(await getIP())}:${chalk.red(port)}`)
		console.log(chalk.yellow(`Network members(${server.members.length}):`))
		for (let member of server.members) {
			console.log(`\t${(member.uuid === server._uuid) ? 'You' : member.name} (${member.uuid})`)
		}
	})
cli
	.command('message', 'Start messaging to someone')
	.cancel(async () => {
		console.log('stopped')
	})
	.action(async (args) => {
		let answer = await inquirer.prompt(await members(server.members))
		answer = answer.recipient.map(e => ({name: e.split(' : ')[0], uuid: e.split(' : ')[1]}))
		console.log(answer)
	})

cli
	.catch('[words...]', 'Catches incorrect commands')
	.action(function (args, cb) {
		this.log(args.words.join(' ') + ' is not a valid command.')
		cb()
	})

export async function start(num) {
	const name = await getName()
	if (num !== undefined) {
		cli.ui.cancel()
		cli.hide()
	}
	await cli
		.delimiter(`${name} >`)
		.show()
}


export default cli