import http from 'http'
import * as ioServer from 'socket.io'
import io from 'socket.io-client'
import chalk from 'chalk'
import {getIP, getUUID, init} from './memory.js'
import {getName} from './memory.js'
import ora from 'ora'
import cli, {start} from './cli.js'
import {handshake} from './protocol.js'

class Server {
	httpServer
	incoming = {socket: null, host: null, port: null, name: null} // node who connected to me
	server = {socket: null, host: null, port: null, name: null} // me
	client = {socket: null, host: null, port: null, name: null} // node whom i connected to
	uuid
	members = []
	spinner = null
	
	constructor() {
		init()
		this.httpServer = http.createServer()
		this.server.socket = new ioServer.Server(this.httpServer)
		this.server.socket.on('connection', async client => {
			client.on('handshake', (data) => {
				this.handshake(JSON.parse(data), client)
			})
			client.on('handshaked', (data) => {
				this.handshaked(JSON.parse(data), client)
			})
			client.on('reconnect', (data) => {
				this.reconnect(data)
			})
		})
	}
	async connectClient(data) {
		this.client.host = data.address.split(':')[0]
		this.client.port = data.address.split(':')[1]
		this.client.name = data.name
		this.client.socket = io.connect(`http://${data.address}`, {
			forceNew: true,
			reconnection: false
		})
	}
	
	async reconnect(data) {
		await this.client.socket.disconnect()
		await this.connectClient(data)
		await this.client.socket.emit('handshaked', await handshake())
	}
	
	async handshaked(data, client) {
		if (this.spinner !== null && this.spinner.isSpinning) {
			this.spinner.stop()
			console.log(chalk.green('Authorized'))
			await start()
			this.incoming = {
				socket: client,
				port: data.address.split(':')[1],
				host: data.address.split(':')[0],
				name: data.name
			}
		}
	}
	async setIncoming(data, client) {
		this.incoming.host = data.address.split(':')[0]
		this.incoming.port = data.address.split(':')[1]
		this.incoming.name = data.name
		this.incoming.socket = client
	}
	
	async handshake(data, client) {
		if (this.client.socket === null && this.incoming.socket === null) {
			// register new node as incoming, if i am alone in network
			await this.setIncoming(data, client)
			await this.connectClient(data)
			return this.client.socket.emit('handshaked', await handshake())
		} else if (this.incoming.socket !== null) {
			await this.incoming.socket.emit('reconnect', data)
			return this.setIncoming(data,client)
		}
		await this.setIncoming(data,client)
		
		
	}
	
	async sendNext(...data) {
		if (this.client.socket === null) return
		this.client.socket.emit(...data)
	}
	
	async listen(port) {
		this.httpServer.listen(port)
		this.uuid = await getUUID()
		this.members.push({name: await getName(), uuid: this.uuid})
		console.log(chalk.yellow('Listening on ') + chalk.green(await getIP()) + ':' + chalk.red(port))
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
			this.spinner.stop()
			console.log(chalk.green('Connected'))
			this.spinner = ora('Trying to authorize...').start()
			setTimeout(() => {
				if(this.spinner.isSpinning) {
					this.spinner.stop()
					console.log(chalk.red("Unable to authorize"))
				}
			}, 5000)
			this.client.socket.emit('handshake', await handshake())
			await start()
		})
		this.client.socket.on('reconnect', (data) => {
			this.reconnect(data)
		})
		this.spinner = ora('Trying to connect...').start()
		setTimeout(() => {
			if(this.spinner.isSpinning) {
				this.spinner.stop()
				console.log(chalk.red("Unable to connect"))
			}
		}, 5000)
	}
	
}

const server = new Server()

export default server

