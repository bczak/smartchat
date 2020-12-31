import http from 'http'
import * as ioServer from 'socket.io'
import io from 'socket.io-client'
import chalk from 'chalk'
import {getIP, getUUID, init} from './memory.js'
import {getName} from './memory.js'
import ora from 'ora'
import cli, {start} from './cli.js'
import {handshake, repair, leader} from './protocol.js'

class Server {
	httpServer
	incoming = {socket: null, host: null, port: null, name: null, uuid: null} // node who connected to me
	server = {socket: null, host: null, port: null, name: null} // me
	client = {socket: null, host: null, port: null, name: null, uuid: null} // node whom i connected to
	uuid
	members = []
	spinner = null
	port = null
	wait = false
	broken = null
	election = {participant: false, candiadate: null}
	
	constructor() {
		init().then(async () => {
			this.le = {uuid: await getUUID(), elected: true, updated: Date.now()}
		})
		this.httpServer = http.createServer()
		this.server.socket = new ioServer.Server(this.httpServer)
		this.server.socket.on('connection', async incoming => {
			incoming.on('handshake', async (data) => {
				incoming.emit('info', JSON.stringify({name: await getName(), uuid: await getUUID()}))
				await this.handshake(JSON.parse(data), incoming)
			})
			incoming.on('handshaked', (data) => {
				this.handshaked(JSON.parse(data), incoming)
			})
			incoming.on('wait', () => {
				this.wait = true
			})
			incoming.on('disconnect', async () => {
				if (incoming.id === this.incoming.socket.id && !this.wait) {
					this.incoming = {socket: null, host: null, port: null, name: null, uuid: null}
					this.client.socket.emit('repair', await repair())
				}
				this.wait = false
			})
		})
	}
	
	async connectClient(data) {
		this.client.host = data.address.split(':')[0]
		this.client.port = data.address.split(':')[1]
		this.client.name = data.name
		this.client.uuid = data.uuid
		this.client.socket = io.connect(`http://${data.address}`, {
			forceNew: true,
			reconnection: false
		})
		await this.initClient()
		if (this.broken !== null && this.broken.isSpinning) {
			this.broken.stop()
			await start()
		}
		return this.client.socket.emit('handshaked', await handshake())
		
	}
	
	async disconnect() {
		const {host, port, name, uuid} = this.client
		await this.client.socket.emit('wait')
		await this.client.socket.emit('start-election')
		await this.incoming.socket.emit('reconnect', JSON.stringify({
			address: host + ':' + port,
			name: name,
			uuid: uuid
		}))
		await this.reset()
	}
	
	async reset() {
		this.wait = true
		this.client.socket.disconnect()
		this.incoming.socket.disconnect()
		this.client = {socket: null, host: null, port: null, name: null, uuid: null}
		this.incoming = {socket: null, host: null, port: null, name: null, uuid: null}
	}
	
	async reconnect(data) {
		this.wait = true
		if (data.address.split(':')[0] === await getIP() && data.address.split(':')[1] === this.port) {
			return this.reset()
		}
		await this.client.socket.disconnect()
		await this.connectClient(data)
	}
	
	async handshaked(data, client) {
		if (data.uuid === this.uuid) return
		if (this.spinner !== null && this.spinner.isSpinning) {
			this.spinner.stop()
			console.log(chalk.green('Authorized'))
			await start()
		}
		await this.setIncoming(data, client)
		// todo start election
	}
	
	async setIncoming(data, client) {
		this.incoming.host = data.address.split(':')[0]
		this.incoming.port = data.address.split(':')[1]
		this.incoming.name = data.name
		this.incoming.uuid = data.uuid
		this.incoming.socket = client
		await client.emit('update-leader', await leader(this.le))
		this.incoming.socket.on('reconnect', (data) => {
			this.wait = true
		})
		this.incoming.socket.on('repair', (data) => {
			this.repair(JSON.parse(data))
		})
		this.incoming.socket.on('start-election', () => this.startElection())
	}
	
	async startElection() {
	
	}
	
	async repair(data) {
		if (data.uuid === this.uuid) {
			// todo find myself when repairing
			return this.reset()
		} else if (this.client.socket === null || this.client.socket.disconnected) {
			await this.connectClient(data)
		} else {
			// send to next
			this.client.socket.emit('repair', JSON.stringify(data))
		}
	}
	
	async handshake(data, client) {
		if (this.client.socket === null && this.incoming.socket === null) {
			// register new node as client and incoming, if i am alone in network
			await this.setIncoming(data, client)
			return await this.connectClient(data)
		} else if (this.incoming.socket !== null) {
			this.wait = true
			await this.incoming.socket.emit('reconnect', JSON.stringify(data))
			return this.setIncoming(data, client)
		}
		await this.setIncoming(data, client)
		
	}
	
	async updateLeader(leader) {
		if (leader.updated > this.le.updated) {
			this.le = leader
			await start()
		}
	}
	
	async initClient() {
		this.client.socket.on('update-leader', (data) => {
			this.updateLeader(JSON.parse(data))
		})
		this.client.socket.on('reconnect', (data) => {
			this.reconnect(JSON.parse(data))
		})
		this.client.socket.on('disconnect', async () => {
			if (!this.wait) {
				this.wait = false
				await cli.hide()
				if (this.client.uuid !== this.incoming.uuid) {
					this.broken = ora('Trying to reconnect...').start()
				} else {
					this.client = {socket: null, host: null, port: null, name: null, uuid: null}
				}
			}
			
		})
	}
	
	async listen(port) {
		this.port = port
		this.httpServer.listen(port)
		this.uuid = await getUUID()
		this.members.push({name: await getName(), uuid: this.uuid})
		console.log(chalk.yellow('Listening on ') + chalk.green(await getIP()) + ':' + chalk.red(port))
	}
	
	async updateClient(data) {
		this.client.name = data.name
		this.client.uuid = data.uuid
	}
	
	async connect(options) {
		if (this.client.socket !== null) {
			this.spinner.stop()
			return console.log(chalk.red('You are already in network'))
		}
		this.client.host = options.host
		this.client.port = options.port
		this.client.socket = io.connect(`http://${this.client.host}:${this.client.port}`, {
			forceNew: true,
			reconnection: false
		})
		
		
		this.client.socket.on('connect', async () => {
			this.client.socket.on('info', data => {
				this.updateClient(JSON.parse(data))
			})
			this.spinner.stop()
			console.log(chalk.green('Connected'))
			this.spinner = ora('Trying to authorize...').start()
			setTimeout(() => {
				if (this.spinner.isSpinning) {
					this.spinner.stop()
					console.log(chalk.red('Unable to authorize'))
				}
			}, 5000)
			this.client.socket.emit('handshake', await handshake())
			await start()
		})
		await this.initClient()
		
		this.spinner = ora('Trying to connect...').start()
		setTimeout(() => {
			if (this.spinner.isSpinning) {
				this.spinner.stop()
				console.log(chalk.red('Unable to connect'))
			}
		}, 5000)
	}
	
}

const server = new Server()

export default server

