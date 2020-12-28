import inquirer from 'inquirer'
import vorpal from 'vorpal'
import {getName} from './memory.js'
import Client from './client.js'

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

const cli = vorpal()
cli
	.command('connect', 'Connect to existing network')
	.option('-h, --host <host>', 'Host\'s IP to connect')
	.option('-p, --port <port>', 'Host\'s port to connect. Default is 7777')
	.action((args, callback) => {
		(async (callback) => {
			const options = {host: args.options.host || 'localhost', port: args.options.port || 7777}
			if (args.options.host === undefined) options.host = (await inquirer.prompt(hostnamePromt)).host
			if (args.options.port === undefined) options.port = (await inquirer.prompt(portPromt)).port
			const client = new Client(options)
			await client.connect(callback)
		})(callback)
	})

export async function start() {
	const name = await getName()
	cli
		.delimiter(`${name} >`)
		.show()
}


export default cli