import * as status from './status.js'
import * as connect from './connect.js'
export default async function applyCommands(cli) {
	await status.apply(cli)
	await connect.apply(cli)
}