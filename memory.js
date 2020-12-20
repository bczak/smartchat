import {User} from './models.js'
import {getIP} from './utils.js'

export async function getUser() {
	let user = await User.findOne({ip: getIP()})
	if (user === undefined) {
		user = new User()
		user.name = undefined
		user.ip = getIP()
	}
	await user.save()
	return user

}

export async function getName() {
	return (await getUser()).name
}

export async function saveName(name) {
	let user = await getUser()
	user.name = name
	user.save()
}

export async function clearName() {
	await User.update({ip: getIP()}, {name: undefined})
}

function execute() {

}
