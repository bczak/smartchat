import http from 'http'
import * as io from 'socket.io'
import {client} from './client.js'
import * as protocol from './protocol.js'

class Server {
	httpServer
	server = {socket: null, port: null}
	client = {socket: null, host: null, port: null, name: null, uuid: null}
	leader = {uuid: null, name: null}
	waiting = null
	_wait = false
	
	/**
	 * Create server and listen on gven port
	 * @param port port to listen on
	 */
	constructor(port) {
		this.httpServer = http.createServer()
		this.server.port = port
		this.server.socket = new io.Server(this.httpServer)
		this.httpServer.listen(port)
		this.init()
	}
	
	/**
	 * Initialize server
	 */
	init() {
		this.server.socket.on('connection', (client) => this.connected(client))
	}
	
	async reset() {
		this.client.socket.disconnect()
		this.client = {socket: null, host: null, port: null, name: null, uuid: null}
	}
	
	
	/**
	 * Function called when someone connected to server
	 */
	async connected(incoming) {
		this.waiting = incoming // add new connection to waiting
		setTimeout(() => this.waiting = null, 5000) // if new connection couldn't authorize, the remove
		incoming.on('handshake', (data) => this.handshake(data))
		incoming.on('repaired', (data) => this.repaired(data))
	}
	
	/**
	 * Function is called when client repaired network
	 */
	async repaired(data) {
		this.client = data
		this.client.socket = this.waiting
		this.waiting = null
		this.client.socket.emit('repaired')
		this._wait = false
		await this.setup()
	}
	
	
	/**
	 * Function called when someone sends handshake
	 * Action: add new client to network
	 */
	async handshake(data) {
		// check if someone has connection to this node
		if (this.client.socket) {
			// if client exists, tell it to reconnect to new node
			this._wait = true
			this.client.socket.emit('wait')
			this.client.socket.disconnect()
		}
		this.client = data
		this.client.socket = this.waiting
		this.waiting = null
		this.client.socket.emit('handshaked', await protocol.handshake())
		await this.setup()
	}
	
	/**
	 * Set up new client
	 * @returns {Promise<void>}
	 */
	async setup() {
		this.client.socket.on('repair', (data) => client.repair(data))
		this.client.socket.on('disconnect', () => this.disconnected())
	}
	
	async disconnected() {
		if (this._wait) {
			// quit exprected
			await this.reset()
		} else {
			// quit unexpected
			await client.repair(await protocol.handshake())
		}
		this._wait = false
		
	}
	async off() {
		this.client = {socket: null, host: null, port: null, name: null, uuid: null}
		this._wait = false
	}
}


export const server = new Server(process.env.PORT || 7777)