import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiFetch, ApiError } from '../client'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function makeResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response
}

beforeEach(() => {
  mockFetch.mockReset()
})

describe('apiFetch', () => {
  it('uses relative URL and sends JSON Content-Type header', async () => {
    mockFetch.mockResolvedValue(makeResponse({ id: 1 }))
    await apiFetch('/players/')
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/players/',
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    )
  })

  it('returns parsed JSON on success', async () => {
    mockFetch.mockResolvedValue(makeResponse({ id: 1, name: 'Alice' }))
    const result = await apiFetch<{ id: number; name: string }>('/players/1')
    expect(result).toEqual({ id: 1, name: 'Alice' })
  })

  it('throws ApiError with status on non-2xx response', async () => {
    mockFetch.mockResolvedValue(makeResponse({ detail: 'Not found' }, 404))
    await expect(apiFetch('/players/999')).rejects.toBeInstanceOf(ApiError)
    await expect(apiFetch('/players/999')).rejects.toMatchObject({ status: 404 })
  })

  it('returns undefined for 204 No Content', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 204, text: () => Promise.resolve('') } as Response)
    const result = await apiFetch('/players/1', { method: 'DELETE' })
    expect(result).toBeUndefined()
  })

  it('merges caller-supplied options', async () => {
    mockFetch.mockResolvedValue(makeResponse({ id: 2 }))
    await apiFetch('/players/', { method: 'POST', body: '{"name":"Bob"}' })
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/players/',
      expect.objectContaining({ method: 'POST', body: '{"name":"Bob"}' }),
    )
  })
})
