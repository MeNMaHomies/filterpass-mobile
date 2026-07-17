import type { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createAppQueryClient } from './client';

export function createTestQueryClient(): QueryClient {
	return new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				gcTime: Infinity,
				staleTime: 0,
			},
			mutations: {
				retry: false,
			},
		},
	});
}

export function wrapWithQueryClient(
	ui: ReactElement,
	client: QueryClient = createTestQueryClient(),
): ReactElement {
	return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

export function QueryClientTestProvider({
	children,
	client = createTestQueryClient(),
}: {
	children: ReactNode;
	client?: QueryClient;
}) {
	return (
		<QueryClientProvider client={client}>{children}</QueryClientProvider>
	);
}

export { createAppQueryClient };
