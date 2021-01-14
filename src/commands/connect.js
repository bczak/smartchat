import inquirer from 'inquirer'
import {client} from '../client.js'

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

export async function apply(cli) {
	cli
		.command('connect', 'Connect to existing network')
		.option('-h, --host <host>', 'Host\'s IP to connect')
		.option('-p, --port <port>', 'Host\'s port to connect. Default is 7777')
		.action(async (args) => {
			const options = {host: args.options.host || 'localhost', port: args.options.port || 7777}
			if (args.options.host === undefined) options.host = (await inquirer.prompt(hostnamePromt)).host
			if (args.options.port === undefined) options.port = (await inquirer.prompt(portPromt)).port
			await client.connect(options.host, options.port)
		})
}