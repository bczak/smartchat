import {getName, getUUID, getIP} from './memory.js'

export async function handshake() {
	return JSON.stringify({
		uuid: await getUUID(),
		name: await getName(),
		address: `${await getIP()}:${process.env.PORT || 7777}`
	})
}

export async function updateMembers(members) {
	return JSON.stringify(members)
}