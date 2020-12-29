import server from './server.js'
import {getName} from './memory.js'

export async function handshake() {
	return JSON.stringify({uuid: server._uuid, name: await getName()})
}
export async function updateMembers(members) {
	return JSON.stringify(members)
}