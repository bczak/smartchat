import * as status from './status.js'
import * as connect from './connect.js'
import * as message from './message.js'
import * as disconnect from './disconnect.js'
import * as _export from './export.js'

export default async function applyCommands(cli) {
	await status.apply(cli)
	await connect.apply(cli)
	await message.apply(cli)
	await disconnect.apply(cli)
	await _export.apply(cli)
}