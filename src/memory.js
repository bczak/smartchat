import Keyv from 'keyv'
import randanimal from 'randanimal'
import {KeyvFile} from 'keyv-file'
import os from 'os'
import uuidv4 from 'uuid'

const port = process.env.PORT || 7777
const memory = new Keyv({
	store: new KeyvFile({filename: 'db' + port})
})

export async function getName() {
	let name = await memory.get('name')
	if (name === undefined) name = await randanimal.randanimal()
	await memory.set('name', name)
	return name
}

export async function getUUID() {
	let uuid = await memory.get('uuid')
	if (uuid === undefined) uuid = uuidv4()
	await memory.set('uuid', uuid)
	return uuid
}

export async function getIP() {
	const ip = await memory.get('ip')
	if (ip !== undefined) return ip
	const ifaces = os.networkInterfaces()
	let address = '127.0.0.1'
	Object.keys(ifaces).forEach(dev => {
		ifaces[dev].filter((details) => {
			if (details.family === 'IPv4' && details.internal === false) {
				address = details.address
			}
		})
	})
	await memory.set('ip', address)
	return address
}

export default memory

