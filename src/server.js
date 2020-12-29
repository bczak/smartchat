import http from 'http'
import * as io from 'socket.io'
import chalk from 'chalk'
import {getIP, getUUID} from './memory.js'
import cli, {start} from './cli.js'
import {handshake, updateMembers} from './protocol.js'
import {getName} from './memory.js'
import {timeout} from './utils.js'

class Server {
	_server = null
	_io = null
	_uuid = null
	connections = [] // who conncted to me
	clients = [] // whom I connected to
	members = []
	lastUpdate = Date.now()
	
	getClient(client) {
		for (let conn of this.connections) if (conn.client.id === client.id) return conn
		return null
	}
	
	getMemberByUUID(uuid) {
		for (let member of this.members) if (member.uuid === uuid) return member
		return null
	}
	
	removeByUUID(uuid) {
		this.clients = this.clients.filter(e => e.uuid !== uuid)
		this.connections = this.connections.filter(e => e.uuid !== uuid)
		this.members = this.members.filter(e => e.uuid !== uuid)
	}
	
	constructor() {
		getUUID().then(uuid => this._uuid = uuid)
		this._server = http.createServer()
		this._io = new io.Server(this._server)
		this._io.on('connection', client => {
			client.on('handshake', (data) => {
				this.handshake(JSON.parse(data), client)
			})
			client.on('disconnect', () => {
				this.disconnected(client)
			})
			client.on('exit', () => {
				this.exit(client)
			})
		})
	}
	
	async disconnected(client) {
		const conn = this.getClient(client)
		if (conn === null) return
		this.removeByUUID(conn._uuid)
	}
	
	async updateList(data) {
		this.lastUpdate = Date.now()
		this.members = data
		await start()
	}
	
	async addClient(client) {
		this.clients.push(client)
	}
	
	async handshake(data, client) {
		this.connections.push({client, name: data.name, uuid: data.uuid})
		const member = await this.getMemberByUUID(data.uuid)
		if (member !== null) return
		this.members.push({name: data.name, uuid: data.uuid})
		client.emit('handshake', await handshake())
		this.broadcast('update-members', await updateMembers(this.members))
		await start()
		
	}
	
	async exit(client) {
		const conn = this.getClient(client)
		if (conn === null) return
		await this.removeByUUID(conn.uuid)
		await this.broadcast('update-members', await updateMembers(this.members))
		await client.disconnect()
		await start()
	}
	
	broadcast(...data) {
		for (let client of this.clients) client.client.emit(...data)
		for (let client of this.connections) client.client.emit(...data)
	}
	
	
	async listen(port) {
		console.log(chalk.yellow('Listening on ') + chalk.green(await getIP()) + ':' + chalk.red(port))
		this._server.listen(port)
		this.members.push({name: await getName(), uuid: this._uuid})
	}
	
	async isConnected(host, port) {
		for (let client of this.clients) {
			if (client.host === host && client.port === port && client._connected && client.socket.connected) return true
		}
		return false
	}
	
	async disconnect() {
		for (let client of this.clients) {
			client.emit('exit')
			client.socket.close()
		}
		for (let conn of this.connections) {
			conn.client.close()
		}
		this.clients = []
		this.connections = []
		this.members = [{name: await getName(), uuid: this._uuid}]
	}
}

const server = new Server()

export default server