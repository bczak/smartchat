import io from 'socket.io-client'
import {handshake} from './protocol.js'
import chalk from 'chalk'
import ora from 'ora'
import cli, {start} from './cli.js'
import server from './server.js'

export default class Client {
	host
	port
	socket
	_connected = false
	_authorized = false
	auth_spinner = null
	conn_spinner = null
	_name
	uuid
	
	constructor(props) {
		this.host = props.host
		this.port = props.port
	}
	
	async connected() {
		this.socket.emit('handshake', await handshake())
		this.conn_spinner.stop()
		console.log(chalk.green('Connected'))
		this._connected = true
		this.auth_spinner = ora('Trying to authorize...').start()
		setTimeout(() => this.authorizingFailed(), 5000)
	}
	
	
	async handshake(data) {
		this.auth_spinner.stop()
		this._authorized = true
		this._name = data.name
		this.uuid = data.uuid
		console.log(chalk.blue(`Authorized. You connected to ${data.name}`))
		await server.addClient(this)
		this.socket.on('update-members', (data) => server.updateList(JSON.parse(data)))
		return start('handshake')
	}
	
	async emit(...data) {
		this.socket.emit(...data)
	}
	
	async connect() {
		if (await server.isConnected(this.host, this.port)) {
			console.log(chalk.green('You already connected to this node'))
			return start()
		}
		this.socket = io.connect(`http://${this.host}:${this.port}`, {forceNew: true, reconnection: false})
		this.conn_spinner = ora('Trying to connect...').start()
		this.socket.on('connect', () => {
			this.connected()
		})
		this.socket.on('handshake', (data) => {
			this.handshake(JSON.parse(data))
		})
		this.socket.on('connect_failed', (data) => {
			this.error(data)
		})
		this.socket.on('disconnect', () => {
			server.disconnected(this)
		})
		setTimeout(() => {
			this.connectionFailed()
		}, 5000)
		cli.hide()
	}
	async error(data) {
		console.log(data)
	}
	
	async connectionFailed() {
		if (this._connected) return
		this.conn_spinner.stop()
		console.log(chalk.red(`Connection failed`))
		await start()
	}
	
	async authorizingFailed() {
		if (this._authorized) return
		this.auth_spinner.stop()
		console.log(chalk.red(`Authorizing failed`))
		await start()
		
	}
}