import { UserError } from './deps.ts'

export interface GetFsPathOptions {
	requireKey?: boolean
}

async function getFSPath(path: string, options: GetFsPathOptions = {}) {
	const [project, key] = path.split('/').filter(section => {
		if (!section.length) return false
		if (/^\.+$/.test(section)) return false

		return true
	})

	if (!project) throw new UserError('Expected a project to be specified')

	const root = 'data'
	const base = `${root}/${project}`

	try {
		await Deno.stat(base)
	} catch (_) {
		await Deno.mkdir(base, { recursive: true })
	}

	if (!key) {
		if (options.requireKey) throw new UserError('This operation cannot be performed on a project as a whole.  A key must be specified.')

		return `${base}.json`
	}
	return `${base}/${key}.json`
}

export async function set(path: string, value: string) {
	await Deno.writeTextFile(await getFSPath(path, { requireKey: true }), value)
}

export async function get(path: string) {
	const fsPath = await getFSPath(path, { requireKey: true })

	try {
		return await Deno.readTextFile(fsPath)
	} catch (_) {
		return null
	}
}

export async function remove(path: string) {
	await Deno.remove(await getFSPath(path), { recursive: true })
}
