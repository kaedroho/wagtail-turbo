/* eslint-disable @typescript-eslint/no-explicit-any */

import { Message, shellGet, shellPost, TurboResponse } from "./fetch";
import { Mode } from "./modes";

let nextFrameId = 1;

export interface Frame<Context = Record<string, unknown>> {
    id: number;
    path: string;
    title: string;
    view: string;
    context: Context;
    serverMessages: Message[];
    pushState: boolean;
}

export class NavigationController {
    mode: Mode;

    parent: NavigationController | null;

    nextFetchId = 1;

    lastReceivedFetchId = 1;

    currentFrame: Frame;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    navigationListeners: ((frame: Frame | null) => void)[] = [];

    serverErrorListeners: (() => void)[] = [];

    closeListeners: (() => void)[] = [];

    constructor(mode: Mode, parent: NavigationController | null) {
        this.mode = mode;
        this.parent = parent;

        nextFrameId += 1;
        this.currentFrame = {
            id: nextFrameId,
            path: window.location.pathname,
            title: "Loading",
            view: "loading",
            context: {},
            serverMessages: [],
            pushState: false,
        };
    }

    // Private
    shellFetch = async (
        fetcher: () => Promise<TurboResponse>,
        url: string,
        pushState: boolean
    ) => {
        // Get a fetch ID
        // We do this so that if responses come back in a different order to
        // when the requests were sent, the older requests don't replace newer ones
        this.nextFetchId += 1;
        const thisFetchId = this.nextFetchId;

        const response = await fetcher();

        if (thisFetchId < this.lastReceivedFetchId) {
            // A subsequent fetch was made but its response came in before this one
            // So ignore this response
            return;
        }

        this.lastReceivedFetchId = thisFetchId;

        if (response === null) {
            return;
        }

        await this.handleResponse(response, url, pushState);
    };

    // Private
    handleResponse = (
        response: TurboResponse,
        path: string,
        pushState = true
    ): Promise<void> => {
        if (response.status === "load-it") {
            if (this.mode === "browser") {
                window.location.href = path;
            } else if (this.mode === "modal" && this.parent) {
                // load-it responses require reloading the entire page.
                // Escalate this response to the page's navigation controller instead
                return this.parent.escalate(path, response);
            } else {
                // eslint-disable-next-line no-console
                console.error("Unable to handle a 'load-it' response here.");
            }
        } else if (response.status === "redirect") {
            return this.navigate(response.path);
        } else if (response.status === "render") {
            // If this navigation controller is handling a modal, make sure the response can be
            // loaded in a modal. Otherwise, escalate it
            if (this.mode === "modal" && response.mode !== "modal") {
                if (this.parent) {
                    return this.parent.escalate(path, response);
                }
                // eslint-disable-next-line no-console
                console.warn(
                    "Response does not support rendering in a modal, but no method of escalation was given."
                );
            }

            this.pushFrame(
                path,
                response.title,
                response.view,
                response.context,
                response.messages,
                pushState
            );
        } else if (response.status === "close-modal") {
            // Call close listeners. One of these should close the modal
            this.closeListeners.forEach((func) => func());
        } else if (response.status === "server-error") {
            this.serverErrorListeners.forEach((func) => func());
        }

        return Promise.resolve();
    };

    navigate = (url: string, pushState = true): Promise<void> => {
        let path = url;

        if (!url.startsWith("/")) {
            const urlObj = new URL(url);

            if (urlObj.origin !== window.location.origin) {
                window.location.href = url;
                return Promise.resolve();
            }

            path = urlObj.pathname + urlObj.search;
        }

        return this.shellFetch(
            () => shellGet(path, this.mode),
            path,
            pushState
        );
    };

    pushFrame = (
        path: string,
        title: string,
        view: string,
        context: Record<string, unknown>,
        serverMessages: Message[],
        pushState = true
    ) => {
        nextFrameId += 1;

        this.currentFrame = {
            id: nextFrameId,
            path,
            title,
            view,
            context,
            serverMessages,
            pushState,
        };

        if (this.mode === "browser") {
            document.title = title;

            if (this.currentFrame.pushState) {
                // eslint-disable-next-line no-restricted-globals
                history.pushState({}, "", this.currentFrame.path);
            }
        }

        this.navigationListeners.forEach((func) => func(this.currentFrame));
    };

    replacePath = (frameId: number, path: string) => {
        if (frameId === this.currentFrame.id) {
            // replace-path called on current frame
            // Change the path using replaceState
            this.currentFrame.path = path;

            if (this.mode === "browser" && this.currentFrame.pushState) {
                // eslint-disable-next-line no-restricted-globals
                history.replaceState({}, "", this.currentFrame.path);
            }
        }
    };

    submitForm = (url: string, data: FormData): Promise<void> =>
        this.shellFetch(() => shellPost(url, data, this.mode), url, true);

    // Called by a child NavigationController when it cannot handle a response.
    // For example, say this NavigationController controls the main window and there's a
    // modal open that has a different NavigationController. If the user clicks a link
    // that needs to navigate the whole page somewhere else, that response is escalated
    // from the modal NavigationController to the main window NavigationController using
    // this method.
    escalate = (url: string, response: TurboResponse): Promise<void> =>
        this.handleResponse(response, url);

    addNavigationListener = (func: (frame: Frame | null) => void) => {
        this.navigationListeners.push(func);
    };

    removeNavigationListener = (func: (frame: Frame | null) => void) => {
        this.navigationListeners = this.navigationListeners.filter(
            (listener) => listener !== func
        );
    };

    addServerErrorListener = (func: () => void) => {
        this.serverErrorListeners.push(func);
    };

    removeServerErrorListener = (func: () => void) => {
        this.serverErrorListeners = this.serverErrorListeners.filter(
            (listener) => listener !== func
        );
    };

    addCloseListener = (func: () => void) => {
        this.closeListeners.push(func);
    };

    removeCloseListener = (func: () => void) => {
        this.closeListeners = this.closeListeners.filter(
            (listener) => listener !== func
        );
    };
}
