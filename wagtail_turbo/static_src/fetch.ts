import { Mode } from "./main";

interface TurboResponseLoadIt {
    status: 'load-it';
}

interface TurboResponseRender {
    status: 'render';
    mode: Mode;
    view: string;
    context: any;
}

interface TurboResponseNotFound {
    status: 'not-found';
}

interface TurboResponsePermissionDenied {
    status: 'permission-denied';
}

export type TurboResponse = TurboResponseLoadIt
                          | TurboResponseRender
                          | TurboResponseNotFound
                          | TurboResponsePermissionDenied;

export async function turboGet(url: string, mode: Mode): Promise<TurboResponse> {
    const response = await fetch(url, { headers: { 'X-Requested-With': 'WagtailTurbo', 'X-WagtailTurbo-Mode': mode } });
    if (!response.headers.get('X-WagtailTurbo-Status')) {
        console.warn("WagtailTurbo Warning: A non-JSON response was returned from the server. Did you forget to add the 'download' attribute to an '<a>' tag?");
        return {
            status: 'load-it',
        };
    }
    return response.json();
}

export async function turboPost(url: string, data: FormData, mode: Mode): Promise<TurboResponse> {
    const response = await fetch(url, { method: 'post', headers: { 'X-Requested-With': 'WagtailTurbo', 'X-WagtailTurbo-Mode': mode }, body: data });
    if (!response.headers.get('X-WagtailTurbo-Status')) {
        console.warn("WagtailTurbo Warning: A non-JSON response was returned from the server. Did you forget to add the 'download' attribute to an '<a>' tag?");
        return {
            status: 'load-it',
        };
    }
    return response.json();
}
