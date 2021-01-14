import {start} from './cli.js'
import clear from 'clear'
async function main() {
	
	await clear()
	return start()
}

main().then()