import { apiRequest } from './client';
import {
	createSessionRequestSchema,
	createSessionResponseSchema,
	liveSessionSchema,
	requireSessionId,
} from './schemas';
import type {
	CreateSessionRequest,
	CreateSessionResponse,
	LiveSession,
} from '@/types/api';
import { FIXED_SESSION_CONFIG } from '@/config/session';

export function createSession(
	body: CreateSessionRequest = {},
): Promise<CreateSessionResponse> {
	return apiRequest<CreateSessionResponse>('/sessions', {
		method: 'POST',
		body: { ...body, ...FIXED_SESSION_CONFIG },
		bodySchema: createSessionRequestSchema,
		schema: createSessionResponseSchema,
	});
}

export function getSession(sessionId: string): Promise<LiveSession> {
	const id = requireSessionId(sessionId);
	return apiRequest<LiveSession>(`/sessions/${id}`, {
		schema: liveSessionSchema,
	});
}

export function deleteSession(sessionId: string): Promise<void> {
	const id = requireSessionId(sessionId);
	return apiRequest<void>(`/sessions/${id}`, { method: 'DELETE' });
}
