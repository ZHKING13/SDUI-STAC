import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiFetch = vi.fn();
vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/session', () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
  ApiError: class ApiError extends Error {},
}));

const { decideJoinRequestAction } = await import('./actions');

const form = (entries: Record<string, string | string[]>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    for (const v of Array.isArray(value) ? value : [value]) data.append(key, v);
  }
  return data;
};

describe('decideJoinRequestAction', () => {
  beforeEach(() => apiFetch.mockReset().mockResolvedValue(null));

  it("n'appelle jamais l'API sans décision explicite", async () => {
    const state = await decideJoinRequestAction({ status: 'idle' }, form({ id: 'abc', decision: '' }));
    expect(state.status).toBe('error');
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('accepte avec les groupes cochés', async () => {
    await decideJoinRequestAction({ status: 'idle' }, form({ id: 'abc', decision: 'approve', groupIds: ['g1', 'g2'] }));
    expect(apiFetch).toHaveBeenCalledWith('/admin/join-requests/abc/approve', { body: { groupIds: ['g1', 'g2'] } });
  });

  it('refuse seulement sur demande explicite', async () => {
    await decideJoinRequestAction({ status: 'idle' }, form({ id: 'abc', decision: 'reject' }));
    expect(apiFetch).toHaveBeenCalledWith('/admin/join-requests/abc/reject', { method: 'POST' });
  });
});
