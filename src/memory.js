import Keyv from 'keyv'
import randanimal from 'randanimal';
import {KeyvFile} from 'keyv-file'
import os from 'os'


const memory = new Keyv({
    store: new KeyvFile({filename: 'db'})
})

export async function getName() {
    let name = await memory.get('name')
    if (name === undefined) name = await randanimal.randanimal();
    await memory.set('name', name)
    return name
}

export async function getIP() {
    const ip = await memory.get('ip')
    if (ip !== undefined) return ip
    const ifaces = os.networkInterfaces()
    let address = '127.0.0.1'
    Object.keys(ifaces).forEach(dev => {
        ifaces[dev].filter((details) => {
            if (details.family === 'IPv4' && details.internal === false) {
                address = details.address
            }
        })
    })
    await memory.set('ip', address)
    return address
}

export default memory

