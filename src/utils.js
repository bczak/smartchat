import time from 'uuid-time'
export async function extractTime(uuid) {
	return time.v1(uuid)
}