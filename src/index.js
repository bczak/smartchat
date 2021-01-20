import {start} from './cli.js'
import clear from 'clear'
import {addLog} from './memory.js'
async function main() {
	addLog("I was created")
	await clear()
	return start()
}

main().then()