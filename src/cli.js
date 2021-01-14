import vorpal from 'vorpal'
import {getIP, getName, getUUID} from './memory.js'
import applyCommands from './commands/index.js'

process.stdin.removeAllListeners('keypress')
const status = {line: false, message: false}
const cli = vorpal()
await applyCommands(cli)


async function update() {
	status.name = await getName()
	status.uuid = await getUUID()
	status.ip = await getIP()
}

export async function stop() {
	if (!status.line || status.message) return
	status.line = false
	await update()
	return cli.hide()
}

export async function start() {
	if (status.line || status.message) return
	status.line = true
	await update()
	return cli
		.delimiter(`${await getName()} >`)
		.show()
}
export async function updateStatus(data) {
	status.message = data.message
}
export async function redraw(text) {
	if (!status.message) return
	cli.ui.redraw.clear()
	cli.ui.redraw.done()
	console.log(text)

}