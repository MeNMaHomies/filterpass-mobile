import { apiRequest } from './client';
import {
	createSessionResponseSchema,
	liveSessionSchema,
} from './schemas';
import type {
	CreateSessionRequest,
	CreateSessionResponse,
	LiveSession,
} from '@/types/api';

export function createSession(
	body: CreateSessionRequest = {},
): Promise<CreateSessionResponse> {
	return apiRequest<CreateSessionResponse>('/sessions', {
		method: 'POST',
		body,
		schema: createSessionResponseSchema,
	});
}

export function getSession(sessionId: string): Promise<LiveSession> {
	return apiRequest<LiveSession>(`/sessions/${sessionId}`, {
		schema: liveSessionSchema,
	});
}

export function deleteSession(sessionId: string): Promise<void> {
	return apiRequest<void>(`/sessions/${sessionId}`, { method: 'DELETE' });
}
