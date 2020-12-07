import nodeFetch from "node-fetch";

type fetchInterface = (input: RequestInfo, init?: RequestInit) => Promise<Response>;


/**
 * Creates a async request to a given url
 *
 * @param input
 * @param options
 */
export default function fetchRequest(input: string, options?: RequestInit): Promise<Response> {
    const requestOptions: RequestInit = {
        ...options,
        method: options?.method || 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    };

    let fetch: fetchInterface;

    if (typeof window !== 'undefined') {
        fetch = window.fetch;
    } else {
        // @ts-ignore
        fetch = nodeFetch;
    }

    return fetch(input, requestOptions);
}
