import pkg from 'randanimal';
const {randanimalSync} = pkg
export const connection = [
	{
		type: 'input',
		name: 'host',
		message: 'Enter hostname:',
		default: () => 'localhost'
	}, {
		type: 'input',
		name: 'port',
		message: 'Enter port:',
		default: () => '3000'
	}
]

export const command =  [
	{
		type: 'input',
		name: 'command',
		message: '>>>',
		default: () => "/help"
	}
]
export const login = [
	{
		type: 'input',
		name: 'name',
		message: 'Identify yourself:',
		default: () => randanimalSync()
	}
]


