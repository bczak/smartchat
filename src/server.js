import http from 'http'
import * as io from 'socket.io'
import chalk from "chalk";
import {getIP} from "./memory.js";
import uuidv4 from 'uuid';
import cli from './cli.js'

class Server {
    _server = null
    _io = null
    _uuid = uuidv4()
    constructor() {
        this._server = http.createServer()
        this._io = new io.Server(this._server)
        this._io.on('connection', client => {
            cli.hide()
            console.log('Someone has connected')
            client.on('event', this.message)
        })
    }
    async message(data) {
        console.log('message: ' + JSON.stringify(data))
    }

    async listen(port) {
        console.log(chalk.yellow("Listening on ") + chalk.green(await getIP()) + ":" + chalk.red(port))
        this._server.listen(port)
    }
}
const server = new Server()

export default server