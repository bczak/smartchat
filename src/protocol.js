import {getIP, getName, getUUID} from './memory.js'

export async function handshake() {
	return {uuid: await getUUID(), name: await getName(), host: await getIP(), port: process.env.PORT || 7777}
}
