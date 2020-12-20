import Server from './server.js'
import inquirer from 'inquirer'
import {command, connection, login} from './questions.js'
import {isCommand, help, info} from './utils.js'
import {clearName, getName, saveName, getUser} from './memory.js'
import typeorm from 'typeorm'
import {UserSchema} from './models.js'
import chalk from 'chalk'

const port = process.env.PORT || 8001
const server = new Server(port)
server.listen().then(async () => {
	await typeorm.createConnection({
		type: 'sqlite',
		database: 'database.db',
		entities: [UserSchema],
		synchronize: true
	})
	const name = await getName()
	if (name === null) return identification()
	console.log(`Welcome, ${name}`)
	return ask()
})

function identification() {
	inquirer
		.prompt(login)
		.then(async answers => {
			await saveName(answers.name)
			console.log(`Welcome, ${answers.name}`)
			await ask()
		})
}

async function execute(input) {
	const {command} = input
	if (isCommand(command)) {
		if (command === '/help') {
			console.log(help())
		} else if (command === '/logout') {
			let name = await getName()
			await clearName()
			console.log('Bye, ' + name)
			return identification()
		} else if (command === '/close') {
			console.log('Bye, ' + await getName())
			process.exit(0)
		} else if (command === '/getme') {
			let user = await getUser()
			console.log(info(user))
		} else if (command === '/connect') {
			return connect()
		}
		return ask()
	} else {

	}
}

function ask() {
	inquirer.prompt(command).then(execute)
}

export async function connect() {
	let answers = await inquirer.prompt(connection)
	const {host, port} = answers
	try {
		await server.connect(host, port, getName())
		return ask()
	} catch (err) {
		console.log(err)
	}
}

process.on('SIGINT', async function () {
	console.log('\nBye, ' + await getName())
	process.exit()
})

process.on('uncaughtException', (err) => {
	if(err.code === 'ECONNREFUSED') {
		console.log(chalk.red("ERROR: Connection error"))
		return ask()
	}
})
