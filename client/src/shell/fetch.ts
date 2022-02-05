/* eslint-disable @typescript-eslint/no-explicit-any */

import { Mode } from "./modes";

export interface TextMessage {
    level: "success" | "warning" | "error";
    text: string;
}

export interface HTMLMessage {
    level: "success" | "warning" | "error";
    html: string;
}

export type Message = TextMessage | HTMLMessage;

interface TurboResponseLoadIt {
    status: "load-it";
}

interface TurboResponseRedirect {
    status: "redirect";
    path: string;
}

interface TurboResponseRender {
    status: "render";
    mode: Mode;
    title: string;
    view: string;
    context: any;
    messages: Message[];
}

interface TurboResponseCloseModal {
    status: "close-modal";
}

interface TurboResponseServerError {
    status: "server-error";
}

interface TurboResponseNotFound {
    status: "not-found";
}

interface TurboResponsePermissionDenied {
    status: "permission-denied";
}

export type TurboResponse =
    | TurboResponseLoadIt
    | TurboResponseRedirect
    | TurboResponseRender
    | TurboResponseCloseModal
    | TurboResponseServerError
    | TurboResponseNotFound
    | TurboResponsePermissionDenied;

export async function shellGet(
    url: string,
    mode: Mode
): Promise<TurboResponse> {
    const response: Response = await fetch(url, {
        headers: { "X-Requested-With": "WagtailTurbo", "X-WagtailTurbo-Mode": mode },
    });
    if (response.status === 500) {
        return {
            status: "server-error",
        };
    }
    if (!response.headers.get("X-WagtailTurbo-Status")) {
        // eslint-disable-next-line no-console
        console.warn(
            "Turbo Warning: A non-JSON response was returned from the server. Did you forget to add the 'download' attribute to an '<a>' tag?"
        );
        return {
            status: "load-it",
        };
    }
    return response.json() as Promise<TurboResponse>;
}

export async function shellPost(
    url: string,
    data: FormData,
    mode: Mode
): Promise<TurboResponse> {
    const response = await fetch(url, {
        method: "post",
        headers: { "X-Requested-With": "WagtailTurbo", "X-WagtailTurbo-Mode": mode },
        body: data,
    });
    if (response.status === 500) {
        return {
            status: "server-error",
        };
    }
    if (!response.headers.get("X-WagtailTurbo-Status")) {
        // eslint-disable-next-line no-console
        console.warn(
            "Turbo Warning: A non-JSON response was returned from the server. Did you forget to add the 'download' attribute to an '<a>' tag?"
        );
        return {
            status: "load-it",
        };
    }
    return response.json() as Promise<TurboResponse>;
}
