/* eslint-disable react/require-default-props */

import React, { ReactElement } from "react";
import { SetSidebarModulesContext } from "../shell";
import { ShellNavigationContext } from "../shell/components/Browser";
import { ShellViewProps } from "../shell/views";
import { ModuleDefinition } from "../sidebar/Sidebar";
import telepath from "../telepath";

interface LoadIFrameEvent {
    id: number;
    type: "load";
    title: string;
}

interface SetSidebarModulesEvent {
    id: number;
    type: "set-sidebar-modules";
    sidebarModules: any[];
}

interface NavigateIFrameEvent {
    id: number;
    type: "navigate";
    path: string;
}

interface ReplacePathIFrameEvent {
    id: number;
    type: "replace-path";
    path: string;
}

interface OpenModalIFrameEvent {
    id: number;
    type: "open-modal";
    path: string;
}

type IFrameEvent =
    | LoadIFrameEvent
    | SetSidebarModulesEvent
    | NavigateIFrameEvent
    | ReplacePathIFrameEvent
    | OpenModalIFrameEvent;

const iFrameCallbacks: { [id: number]: (event: IFrameEvent) => void } = {};

const isIFrameEvent = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    variableToCheck: any
): variableToCheck is IFrameEvent => {
    const castVar = variableToCheck as IFrameEvent;
    return castVar.id !== undefined && castVar.type !== undefined;
};

window.addEventListener("message", (event) => {
    if (isIFrameEvent(event.data) && event.data.id in iFrameCallbacks) {
        iFrameCallbacks[event.data.id](event.data);
    }
});


interface EnvironmentViewerViewContext {
    html: string;
    frameUrl: string;
}

function IFrameView({
    frame,
}: ShellViewProps<EnvironmentViewerViewContext>): ReactElement {
    const { navigate, replacePath, openModal } = React.useContext(
        ShellNavigationContext
    );

    const setSidebarModules = React.useContext(SetSidebarModulesContext);

    const onIframeLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
        if (e.target instanceof HTMLIFrameElement && e.target.contentWindow) {
            e.target.contentWindow.postMessage(
                {
                    type: "load",
                    mode: "browser",
                    frameId: frame.id,
                    path: frame.path,
                    html: frame.context.html,
                },
                window.origin
            );

            iFrameCallbacks[frame.id] = (event) => {
                if (event.type === "load") {
                    // if (onLoad) {
                    //     onLoad(event.title);
                    // }
                }

                if (event.type === "set-sidebar-modules") {
                    setSidebarModules(telepath.unpack(event.sidebarModules) as ModuleDefinition[]);
                }

                if (event.type === "navigate") {
                    navigate(event.path);
                }

                if (event.type === "replace-path") {
                    replacePath(frame.id, event.path);
                }

                if (event.type === "open-modal") {
                    openModal(event.path);
                }
            };
        }
    };

    return (
        // eslint-disable-next-line jsx-a11y/iframe-has-title
        <iframe
            onLoad={onIframeLoad}
            style={{
                border: 0,
                width: "100%",
                height: "100%",
            }}
            src={frame.context.frameUrl}
            sandbox="allow-scripts allow-same-origin allow-downloads allow-forms"
        />
    );
}

export default IFrameView;
