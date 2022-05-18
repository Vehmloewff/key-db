import { UserError, mongo } from './deps.ts'

const DATABASE_URI = Deno.env.get('DATABASE_URI')
if (!DATABASE_URI) throw new Error('Expected env var DATABASE_URI to be set')

const client = new mongo.MongoClient()
const database = await client.connect(DATABASE_URI)

export interface GetFsPathOptions {
	requireKey?: boolean
}

function getFSPath(path: string, options: GetFsPathOptions = {}) {
	const [project, key] = path.split('/').filter(section => {
		if (!section.length) return false
		if (/^\.+$/.test(section)) return false

		return true
	})

	if (!project) throw new UserError('Expected a project to be specified')

	if (!key && options.requireKey)
		throw new UserError('This operation cannot be performed on a project as a whole.  A key must be specified.')

	return { project, key }
}

export async function set(path: string, value: string) {
	const { key, project } = getFSPath(path, { requireKey: true })

	const collection = database.collection(project)
	await collection.insertOne({ data: value, key })
}

export async function get(path: string) {
	const { project, key } = getFSPath(path, { requireKey: true })

	const collection = database.collection(project)

	const res = await collection.findOne({ key })
	if (!res) return null

	return res.data
}

export async function remove(path: string) {
	const { project, key } = getFSPath(path)

	const collection = database.collection(project)

	if (!key) await collection.drop()
	return await collection.deleteOne({ key })
}
