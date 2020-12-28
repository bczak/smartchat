import io from 'socket.io-client'
import {handshake} from './protocol.js'
import chalk from 'chalk'
import ora from 'ora'

export default class Client {
	host
	port
	socket

	constructor (props) {
		this.host=props.host
		this.port=props.port
	}

	async connect (callback) {
		const socket=io(`http://${this.host}:${this.port}`)
		this.socket=socket
		const spinner=ora("Trying to connect...").start()
		this.socket.on('connect',function() {
			socket.send(handshake())
			console.log(chalk.green('Connected'))
			spinner.stop()
			return callback()
		})
		setTimeout(function() {
			spinner.stop()
			console.log(chalk.red('Connection failed'));
			return callback()
		},5000)

	}
}