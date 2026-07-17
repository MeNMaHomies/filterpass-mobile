import { createSession, deleteSession } from '@/api';
import type { CreateSessionRequest, CreateSessionResponse } from '@/types/api';
import { queryClient } from './client';
import { queryKeys } from './keys';

export async function createLiveSessionMutation(
	body: CreateSessionRequest,
): Promise<CreateSessionResponse> {
	return createSession(body);
}

export async function deleteLiveSessionMutation(
	sessionId: string,
): Promise<void> {
	await deleteSession(sessionId);
	await invalidateAfterLiveSessionChange();
}

/** Refresh history/home caches after a live session ends or is deleted. */
export async function invalidateAfterLiveSessionChange(
	client = queryClient,
): Promise<void> {
	await Promise.all([
		client.invalidateQueries({ queryKey: queryKeys.history.all }),
		client.invalidateQueries({ queryKey: queryKeys.health }),
	]);
}
