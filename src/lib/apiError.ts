import { ApiError, WsCloseError } from '@/api';

export function formatApiError(error: unknown): string {
	if (error instanceof ApiError) {
		if (error.status === 429 || error.code === 'session_limit_reached') {
			return 'Session limit reached. Stop an active session or try again later.';
		}
		if (error.code === 'session_not_found') {
			return 'Session not found.';
		}
		return error.message;
	}
	if (error instanceof WsCloseError) {
		if (error.isAlreadyAttached) {
			return 'Another client is already attached to this session.';
		}
		if (error.isSessionNotFound) {
			return 'Session not found on server.';
		}
		if (error.isServerError) {
			return 'Server error during live session.';
		}
		return error.message;
	}
	if (error instanceof TypeError && error.message.includes('fetch')) {
		return 'Cannot reach backend. Check network and EXPO_PUBLIC_API_URL.';
	}
	if (error instanceof Error) {
		return error.message;
	}
	return 'Something went wrong';
}
