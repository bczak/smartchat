import {io} from 'socket.io-client'
import ora from 'ora'
import {start, stop} from './cli.js'
import chalk from 'chalk'
import * as protocol from './protocol.js'
import {getName, getUUID} from './memory.js'
import {server} from './server.js'

class Client {
	client = {socket: null, port: null, host: null, uuid: null, name: null}
	status = 'disconnected'
	spinner = ora('Launching').start()
	_wait = false
	
	/**
	 * Empty constructor
	 */
	constructor() {
		this.spinner.stop()
	}
	
	/**
	 * Function to send message
	 */
	async send(message) {
		const ctx = {
			text: message,
			time: null,
			from: {name: await getName(), uuid: await getUUID()},
			approved: {uuid: null, name: null}
		}
		this.client.socket.emit('message', JSON.stringify(ctx))
	}
	
	/**
	 * Function to resend message
	 */
	async resend(message) {
		this.client.socket.emit('message', JSON.stringify(message))
	}
	
	async emit(action, data) {
		this.client.socket.emit(action, data)
	}
	
	/**
	 * Function to connect to server
	 * @param host IP address to connect
	 * @param port Port to connect
	 */
	async connect(host, port) {
		if (this.status === 'connected') {
			console.log('Already connected')
			return //todo
		}
		this.client.socket = io(`http://${host}:${port}`, {
			forceNew: true,
			reconnection: false
		})
		await stop()
		this.spinner = await ora('Trying to connect...').start()
		setTimeout(() => this.reset('connect'), 1000) // reset connection in 5 seconds if couldn't connect
		
		await this.init()
	}
	
	/**
	 * Function to reset connection
	 */
	async reset(state, verbose = false) {
		this.spinner.stop()
		if (this.status === 'authorized') return
		if (this.client.socket) this.client.socket.disconnect()
		this.client = {socket: null, port: null, host: null, uuid: null, name: null}
		if (!verbose) {
			console.log(chalk.red('Unable to ' + state))
			return start()
		}
	}
	
	/**
	 * Function called when attempting connection
	 */
	async init() {
		this.client.socket.on('connect', () => this.connected())
		this.client.socket.on('handshaked', (data) => this.handshaked(data))
		this.client.socket.on('wait', () => this.wait())
		this.client.socket.on('disconnect', () => {
			if (this._wait) {
				//quit expected
				this.status = 'disconnected'
				this.client.socket.disconnect()
				this.reset(null, true)
			} else {
				this.status = 'disconnected'
				this.reset(null, true)
				//quit unexpected
			}
			this._wait = false
		})
	}
	
	/**
	 * Function called when network is need repairing
	 * When someone exited network or new member connected
	 * Action: if I am the last in ring, connect to new node, otherwise send it forward
	 */
	async repair(data) {
		
		if (client.client.socket && client.client.socket.connected) {
			// send forward if can
			return this.client.socket.emit('repair', data)
		}
		// trying to repair
		if (data.uuid.toString() === (await getUUID()).toString()) {
			// do not repair if you are alone
			return this.off()
		}
		this.client = data
		this.client.socket = io(`http://${data.host}:${data.port}`, {
			forceNew: true,
			reconnection: false
		})
		this.client.socket.on('connect', async () => {
			this.client.socket.emit('repaired', await protocol.handshake())
			this.client.socket.on('repaired', () => this.repaired())
			await this.init()
			
		})
	}
	
	/**
	 * turn off the client
	 */
	async off() {
		this.client = {socket: null, port: null, host: null, uuid: null, name: null}
		this._wait = false
		this.status = 'disconnected'
		await server.off()
	}
	
	async repaired() {
		this.status = 'authorized'
	}
	
	/**
	 * Function is called when recieve wait command from server
	 */
	async wait() {
		this._wait = true
	}
	
	/**
	 * Function called when recieve answer from server
	 * Action: save server's credentials and send repair
	 * @param data server's credentials
	 */
	async handshaked(data) {
		this.spinner.stop()
		this.status = 'authorized'
		console.log(chalk.green('Authorized'))
		this.client.name = data.name
		this.client.uuid = data.uuid
		this.client.host = data.host
		this.client.port = data.port
		await start()
		this.client.socket.emit('repair', await protocol.handshake())
	}
	
	/**
	 * Function called when sucessfully connected to server
	 * Action: send authorize request(handshake)
	 */
	async connected() {
		this.spinner.stop()
		this.status = 'connected'
		console.log(chalk.green('Connected'))
		this.spinner.start('Trying to authorize...')
		setTimeout(() => this.reset('authorize'), 1000) // reset connection in 5 seconds if couldn't authorize
		this.client.socket.emit('handshake', await protocol.handshake())
	}
}

export const client = new Client()