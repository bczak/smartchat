import io from 'socket.io-client'
import {handshake} from './protocol.js'
import chalk from 'chalk'

export default class Client {
	host
	port
	socket
	
	constructor(props) {
		this.host = props.host
		this.port = props.port
	}
	
	async connect(callback) {
		const socket = io(`http://${this.host}:${this.port}`)
		this.socket = socket
		this.socket.on('connect', function () {
			socket.send(handshake())
			console.log(chalk.green('Connected'))
			return callback()
		})
	}
}