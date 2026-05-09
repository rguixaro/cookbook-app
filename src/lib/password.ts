import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt)
const KEY_LENGTH = 64
const HASH_ALGORITHM = 'scrypt'

export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16).toString('hex')
	const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer

	return `${HASH_ALGORITHM}:${salt}:${derivedKey.toString('hex')}`
}

export async function verifyPassword(
	password: string,
	passwordHash: string | null | undefined,
): Promise<boolean> {
	if (!passwordHash) return false

	const [algorithm, salt, key] = passwordHash.split(':')
	if (algorithm !== HASH_ALGORITHM || !salt || !key) return false

	const storedKey = Buffer.from(key, 'hex')
	if (storedKey.length !== KEY_LENGTH) return false

	const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer

	return timingSafeEqual(storedKey, derivedKey)
}
