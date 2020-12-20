import WebSocket from 'ws'
import clear from 'clear'
import {connected, getIP, init} from './utils.js'
import uuid from 'uuid'
import chalk from 'chalk'
import {getName} from './memory.js'

export default class Server {
	_server
	_queue = {} // {id: ws}
	_connections = {} //{uuid: ws}
	_incomings = {} // {id: ws}
	_port
	_messages = []
	_users = []

	constructor(port) {
		this._port = port
		this._server = new WebSocket.Server({
			port,
			perMessageDeflate: false
		})
		this._server.on('connection', (...args) => this.connection(...args))
		this._server.on('message', (...args) => this.message(...args))
	}

	async connect(host, port) {
		const ws = new WebSocket(`ws://${host}:${port}`)
		const id = uuid().toString()
		this._connections[id] = ws
		//try to conenct
		ws.on('message', (text) => this.message(id, text))
	}

	async connection(ws, req) {
		console.log(chalk.green('\n>>> Someone has connected to chat'))
		const id = uuid().toString()
		this._queue[id] = ws
		// require idenitification
		await ws.send(JSON.stringify({type: 'init', id}))
	}

	async message(user_id, text) {
		let message = JSON.parse(text)
		const user = this._connections[user_id]
		if (message.type === 'init') {
			// answer to identification
			user.send(JSON.stringify({type: 'reinit', id: message.id, user: {name: getName(), ip: getIP()}}))
		} else if (message.type === 'reinit') {
			//new member
			if (this._queue[message.id] === undefined) return console.log("INVALID MESSAGE");
			this._incomings[message.id] = this._queue[message.id];
			this._queue[message.id] = undefined
			this._incomings[message.id].send(JSON.stringify({type: 'welcome', users: _users}));

		} else if(message.type === 'welcome') {
			console.log(chalk.green('CONNECTED'))
			console.log(message.users)
		}
	}

	async listen() {
		clear()
		console.log(connected(getIP(), this._port))
	}
}
