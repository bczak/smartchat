import {getName, getUUID, getIP} from './memory.js'

export async function handshake() {
	return JSON.stringify({
		uuid: await getUUID(),
		name: await getName(),
		address: `${await getIP()}:${process.env.PORT || 7777}`
	})
}

export async function repair() {
	return JSON.stringify({
		uuid: await getUUID(),
		name: await getName(),
		address: `${await getIP()}:${process.env.PORT || 7777}`
	})
}
export async function leader(le) {
	return JSON.stringify({...le})
}