import server from './server.js'

export function handshake() {
	return JSON.stringify({type: 'handshake', from: server._uuid})
}