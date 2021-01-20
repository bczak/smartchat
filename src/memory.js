import Keyv from 'keyv'
import randanimal from 'randanimal'
import {KeyvFile} from 'keyv-file'
import os from 'os'
import * as uuid from 'uuid'

const uuidv4 = uuid.v1

const logs = []

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

export async function addLog(log) {
	logs.push(log);
}

export async function getLogs() {
	return logs;
}



export async function setRecipients(recipients) {
	await memory.set('recipients', recipients)
}

export async function getRecipients() {
	let recipients = await memory.get('recipients')
	return (recipients === undefined) ? [] : recipients
}

export async function setMode() {
	await memory.set('mode', 'messaging')
}

export async function getMode() {
	await memory.get('mode')
}

export async function getMessages() {
	return memory.get('messages')
}

//message = {from: uuid, to:uuid, text: text, date: unixtime, status: (read|unread|tobesent)}
export async function addMessage(message) {
	let messages = await memory.get('messages')
	if (messages === undefined) messages = []
	messages.push(message)
	await memory.set('messages', messages)
}

export async function init() {
	await memory.set('notifications', await memory.get('notifications') || [])
	await memory.set('messages', await memory.get('messages') || [])
	await memory.set('mode', 'cli')
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

export async function addNotification(notification) {
	let notifications = await memory.get('notifications')
	notifications.push(notification)
	await memory.set('notifications', notifications)
}

export default memory

