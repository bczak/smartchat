import http from 'http'
import * as io from 'socket.io'
import {client} from './client.js'
import * as protocol from './protocol.js'
import {addMessage, getName, getUUID, addLog} from './memory.js'
import {redraw} from './cli.js'
import * as uuid from 'uuid'
import {DateTime} from 'luxon'
import chalk from 'chalk'

const uuidv4 = uuid.v1

class Server {
	httpServer
	server = {socket: null, port: null}
	client = {socket: null, host: null, port: null, name: null, uuid: null}
	leader = {uuid: null, name: null}
	waiting = null
	_wait = false
	_election = {partitipant: false, candidate: null, me: null}
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
	
	async restart() {
		this.reset()
		client.client.socket.destroy()
		client.off()
	}
	
	/**
	 * Initialize server
	 */
	init() {
		this.server.socket.on('connection', (client) => this.connected(client))
	}
	
	async reset() {
		if(this.client.socket) this.client.socket.disconnect()
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
	 */
	async setup() {
		this.client.socket.on('repair', (data) => client.repair(data))
		this.client.socket.on('disconnect', () => this.disconnected())
		this.client.socket.on('message', (data) => this.message(JSON.parse(data)))
		this.client.socket.on('election', (data) => this.election(JSON.parse(data)))
		this.client.socket.on('elected', (data) => this.elected(JSON.parse(data)))
	}
	
	/**
	 * Function called when server recieve message from previos node
	 * Action: if it is approved, then print(save) it and send to next node,
	 * otherwise just send it next to find leader, so it can approve the message
	 * if you are leader and it is not approved, then approve(save) it and send next
	 * if you are leader and it approved, then ignore it
	 * if you are the sender and it is not approved, then start election
	 */
	async message(message) {
		addLog('I got message - ' + message )
		const me = {name: await getName(), uuid: await getUUID()}
		if (message.approved.uuid !== null && message.approved.uuid === me.uuid) {
			return
		}
		if (message.approved.uuid === null && this.leader.uuid === me.uuid) {
			message.approved = me
			message.time = DateTime.local().toISO()
			addLog("I approve the message - " + message)
		}
		if (message.from.uuid === me.uuid && message.approved.uuid === null) {
			await this.startElection()
			setTimeout((msg) => client.resend(msg), 500, message) // wait 0.5 second and resend it
			return
		}
		if (message.approved.uuid !== null) {
			const sender = (message.from.uuid === me.uuid) ? 'You' : message.from.name
			await redraw(chalk.bgGreen.yellowBright(`[${DateTime.fromISO(message.time).toFormat('dd/LL/yyyy HH:mm:ss')}] `) + chalk.bgGreen.black.bold(`${sender}:`) + '\n' + message.text)
			await addMessage(message)
		}
		await client.resend(message)
		
	}
	
	/**
	 * Function to start eletion
	 */
	async startElection() {
		if (this._election.partitipant) return //todo already a partitipant
		this._election.me = uuidv4()
		this._election.partitipant = true
		this._election.candidate = this._election.me
		const message = {candidate: this._election.me}
		addLog('I started election')
		await client.emit('election', JSON.stringify(message))
		
	}
	
	/**
	 * Function to process election
	 */
	async election(data) {
		if (this._election.me === null) this._election.me = uuidv4().toString()
		// 1
		if (data.candidate > this._election.me) {
			this._election.partitipant = true; // EDITED
			return client.emit('election', JSON.stringify(data))
		}
		// 2
		if (data.candidate < this._election.me && !this._election.partitipant) {
			this._election.partitipant = true; // EDITED
			return client.emit('election', JSON.stringify({candidate: this._election.me}))
		}
		// 3
		if (data.candidate < this._election.me && this._election.partitipant) {
			return
		}
		// 4
		if (data.candidate === this._election.me) {
			this._election = {me: null, partitipant: false, candidate: null}
			this.leader = {name: await getName(), uuid: await getUUID()}
			addLog('I was elected. I will let know others')
			await client.emit('elected', JSON.stringify(this.leader))
		}
	}
	
	/**
	 * Function called when leader was elected
	 */
	async elected(data) {
		if (data.uuid === await getUUID()) return
		addLog("New leader - " + data.name)
		this._election = {me: null, partitipant: false, candidate: null}
		this.leader = data
		await client.emit('elected', JSON.stringify(this.leader))
	}
	
	
	/**
	 * Function called when someone disconnecting
	 */
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
	
	/**
	 * turn off the server
	 */
	async off() {
		this.client = {socket: null, host: null, port: null, name: null, uuid: null}
		this._wait = false
		this.leader = {uuid: null, name: null}
	}
}


export const server = new Server(process.env.PORT || 7777)