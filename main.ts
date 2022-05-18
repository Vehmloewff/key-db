import { serve, isUserError } from './deps.ts'
import { set, get, remove } from './db.ts'

serve(handle, {
	port: 2500,
	// deno-lint-ignore no-explicit-any
	onError(error: any) {
		if (isUserError(error)) return new Response(error.message, { status: 406 })

		console.log(error)
		return new Response('internal error', { status: 500 })
	},
})

async function handle(request: Request): Promise<Response> {
	const path = new URL(request.url).pathname

	if (path === '/favicon.ico') return makeResponse('favicon.ico is not allowed as a project', { status: 400 })

	if (request.method === 'PUT') {
		await set(path, await request.text())

		return makeResponse('ok')
	}

	if (request.method === 'DELETE') {
		await remove(path)

		return makeResponse('ok')
	}

	if (request.method === 'GET') {
		const result = await get(path)
		if (result === null) return makeResponse('resource does not exist', { status: 404 })

		return makeResponse(result)
	}

	if (request.method === 'OPTIONS') return makeResponse('ok')

	return makeResponse('invalid operation', { status: 400 })
}

function makeResponse(body: BodyInit | null = null, init: ResponseInit = {}) {
	const headers = new Headers(init.headers)

	headers.set('Access-Control-Allow-Origin', '*')
	headers.set('Access-Control-Allow-Methods', '*')
	headers.set('Access-Control-Allow-Headers', '*')

	init.headers = headers

	return new Response(body, init)
}
