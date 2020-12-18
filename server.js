import WebSocket from 'ws'
import clear from 'clear'
import {connected, getIP} from './utils.js'

export default class Server {
	_server
	_connections = []
	_port

	constructor(port) {
		this._port = port
		this._server = new WebSocket.Server({
			port,
			perMessageDeflate: false
		})
		this._server.on('connection', this.connection)
		this._server.on('message', this.message)
	}

	async connect(host, port) {
		const ws = new WebSocket(`ws://${host}:${port}`)
		this._connections.push(ws)
	}

	async connection(ws, req) {
		console.log('connected')
	}

	async message(text) {
		console.log(text)
	}

	async listen() {
		clear()
		console.log(connected(getIP(), this._port))
	}
}
