/** Typed client-side validation / transport error codes (not REST detail codes). */
export const ClientErrorCode = {
	INVALID_REQUEST_BODY: 'invalid_request_body',
	INVALID_SESSION_ID: 'invalid_session_id',
	INVALID_HISTORY_LIST_PARAMS: 'invalid_history_list_params',
	INVALID_INFERENCE_QUERY_PARAMS: 'invalid_inference_query_params',
	INVALID_INFERENCE_BUCKET_PARAMS: 'invalid_inference_bucket_params',
	INVALID_HISTORY_EVENTS_PARAMS: 'invalid_history_events_params',
	INVALID_API_RESPONSE_SHAPE: 'invalid_api_response_shape',
	REQUEST_TIMED_OUT: 'request_timed_out',
	NO_INTERNET: 'no_internet',
	BACKEND_MODEL_NOT_READY: 'backend_model_not_ready',
} as const;

export type ClientErrorCodeName =
	(typeof ClientErrorCode)[keyof typeof ClientErrorCode];

/** @deprecated Prefer ClientErrorCodeName — alias kept for call-site types. */
export type ClientErrorCodeValue = ClientErrorCodeName;

export function isClientErrorCode(
	value: string,
): value is ClientErrorCodeName {
	return (Object.values(ClientErrorCode) as string[]).includes(value);
}
