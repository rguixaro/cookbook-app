type ZipSource = Uint8Array | string | AsyncIterable<Uint8Array>

export interface ZipEntry {
	name: string
	source: ZipSource | (() => Promise<ZipSource>)
	modifiedAt?: Date
}

const textEncoder = new TextEncoder()
const crcTable = new Uint32Array(256)

for (let n = 0; n < 256; n++) {
	let c = n
	for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
	crcTable[n] = c >>> 0
}

function updateCrc32(crc: number, chunk: Uint8Array) {
	let c = crc ^ 0xffffffff
	for (let i = 0; i < chunk.length; i++) {
		c = crcTable[(c ^ chunk[i]) & 0xff] ^ (c >>> 8)
	}
	return (c ^ 0xffffffff) >>> 0
}

function uint16(value: number) {
	const bytes = new Uint8Array(2)
	new DataView(bytes.buffer).setUint16(0, value, true)
	return bytes
}

function uint32(value: number) {
	const bytes = new Uint8Array(4)
	new DataView(bytes.buffer).setUint32(0, value >>> 0, true)
	return bytes
}

function concatBytes(parts: Uint8Array[]) {
	const size = parts.reduce((sum, part) => sum + part.byteLength, 0)
	const bytes = new Uint8Array(size)
	let offset = 0

	for (const part of parts) {
		bytes.set(part, offset)
		offset += part.byteLength
	}

	return bytes
}

function getDosDateTime(date = new Date()) {
	const year = Math.max(1980, date.getFullYear())
	const dosTime =
		(date.getHours() << 11) |
		(date.getMinutes() << 5) |
		Math.floor(date.getSeconds() / 2)
	const dosDate =
		((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
	return { dosTime, dosDate }
}

async function resolveSource(source: ZipEntry['source']) {
	const resolved = typeof source === 'function' ? await source() : source
	if (typeof resolved === 'string') return [textEncoder.encode(resolved)]
	if (resolved instanceof Uint8Array) return [resolved]
	return resolved
}

async function* iterateSource(source: ZipEntry['source']) {
	const resolved = await resolveSource(source)
	for await (const chunk of resolved) yield chunk
}

function localFileHeader(nameBytes: Uint8Array, modifiedAt?: Date) {
	const { dosTime, dosDate } = getDosDateTime(modifiedAt)
	return concatBytes([
		uint32(0x04034b50),
		uint16(20),
		uint16(0x0808),
		uint16(0),
		uint16(dosTime),
		uint16(dosDate),
		uint32(0),
		uint32(0),
		uint32(0),
		uint16(nameBytes.byteLength),
		uint16(0),
		nameBytes,
	])
}

function dataDescriptor(crc: number, size: number) {
	return concatBytes([uint32(0x08074b50), uint32(crc), uint32(size), uint32(size)])
}

type CentralEntry = {
	nameBytes: Uint8Array
	crc: number
	size: number
	offset: number
	modifiedAt?: Date
}

function centralDirectoryHeader(entry: CentralEntry) {
	const { dosTime, dosDate } = getDosDateTime(entry.modifiedAt)
	return concatBytes([
		uint32(0x02014b50),
		uint16(20),
		uint16(20),
		uint16(0x0808),
		uint16(0),
		uint16(dosTime),
		uint16(dosDate),
		uint32(entry.crc),
		uint32(entry.size),
		uint32(entry.size),
		uint16(entry.nameBytes.byteLength),
		uint16(0),
		uint16(0),
		uint16(0),
		uint16(0),
		uint32(0),
		uint32(entry.offset),
		entry.nameBytes,
	])
}

function endOfCentralDirectory(
	entryCount: number,
	directorySize: number,
	directoryOffset: number,
) {
	return concatBytes([
		uint32(0x06054b50),
		uint16(0),
		uint16(0),
		uint16(entryCount),
		uint16(entryCount),
		uint32(directorySize),
		uint32(directoryOffset),
		uint16(0),
	])
}

export function createZipStream(entries: ZipEntry[]) {
	return new ReadableStream<Uint8Array>({
		async start(controller) {
			const centralEntries: CentralEntry[] = []
			let offset = 0

			try {
				for (const entry of entries) {
					const nameBytes = textEncoder.encode(
						entry.name.replace(/^\/+/, ''),
					)
					const header = localFileHeader(nameBytes, entry.modifiedAt)
					const entryOffset = offset
					controller.enqueue(header)
					offset += header.byteLength

					let crc = 0
					let size = 0
					for await (const chunk of iterateSource(entry.source)) {
						crc = updateCrc32(crc, chunk)
						size += chunk.byteLength
						controller.enqueue(chunk)
						offset += chunk.byteLength
					}

					const descriptor = dataDescriptor(crc, size)
					controller.enqueue(descriptor)
					offset += descriptor.byteLength
					centralEntries.push({
						nameBytes,
						crc,
						size,
						offset: entryOffset,
						modifiedAt: entry.modifiedAt,
					})
				}

				const directoryOffset = offset
				for (const entry of centralEntries) {
					const header = centralDirectoryHeader(entry)
					controller.enqueue(header)
					offset += header.byteLength
				}

				controller.enqueue(
					endOfCentralDirectory(
						centralEntries.length,
						offset - directoryOffset,
						directoryOffset,
					),
				)
				controller.close()
			} catch (error) {
				controller.error(error)
			}
		},
	})
}
