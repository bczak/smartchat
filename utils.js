import chalk from 'chalk'
import os from 'os'
const N = '\n'
let uptime = Date.now()
export function isCommand(input) {
	if (input === undefined) return false
	if (input.length === 0) return false
	if (input[0] === '/') return true
}
export function help() {

	return chalk.green("HELP") + N +
		chalk.red('Commands') + N +
		chalk.yellow('\t/help ') + chalk.green("\t\t - print this message") + N +
		chalk.yellow('\t/getme ') + chalk.green("\t\t - print info about you") + N +
		chalk.yellow('\t/logout ') + chalk.green("\t - logout you from SmartChat") + N +
		chalk.yellow('\t/close ') + chalk.green("\t\t - close SmartChat") + N +
		chalk.yellow('\t/connect ') + chalk.green("\t - connect to network")
}

export const connected = (host, port) => {
	let message = chalk.blue("SmartChat launched") + '\n'
	message += chalk.green(`Your URL is `)
	message += chalk.red(host) + ':'
	message += chalk.yellow(port)
	return message
}

let ip = null;
export function getIP() {
	if (ip !== null) return ip;
	const ifaces = os.networkInterfaces()
	let address = '127.0.0.1'

	Object.keys(ifaces).forEach(dev => {
		ifaces[dev].filter((details) => {
			if (details.family === 'IPv4' && details.internal === false) {
				address = details.address
			}
		})
	})
	ip = address
	return address
}

export function info(user) {
	let out = ""
	for(let key of Object.keys(user)) {
		out += 	chalk.green(key) + ": " + chalk.blue(user[key]) + "\n"
	}
	out += chalk.red('uptime') +':' + (Date.now() - uptime)/1000 + 's'
	return out
}


export function init(name) {
	return {
		name,
		ip: getIP(),
		status: 'new'
	}
}

