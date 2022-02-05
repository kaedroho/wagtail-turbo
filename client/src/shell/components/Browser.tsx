import React, { ReactElement } from "react";
import { Message } from "../fetch";

import { NavigationController } from "../navigation";
import { ShellViewFunction } from "../views";

export interface ShellNavigation {
    navigate: (path: string) => Promise<void>;
    pushFrame: (
        path: string,
        title: string,
        view: string,
        context: Record<string, unknown>,
        serverMessages: Message[],
        pushState?: boolean
    ) => void;
    replacePath: (frameId: number, path: string) => void;
    submitForm: (path: string, data: FormData) => Promise<void>;
    openModal: (path: string, onClose?: () => void) => void;
}

export const ShellNavigationContext = React.createContext<ShellNavigation>({
    navigate: () => {
        // eslint-disable-next-line no-console
        console.error("navigate() called from outside a Shell Browser");

        return Promise.resolve();
    },
    pushFrame: () => {
        // eslint-disable-next-line no-console
        console.error("pushFrame() called from outside a Shell Browser");

        return Promise.resolve();
    },
    replacePath: () => {
        // eslint-disable-next-line no-console
        console.error("replacePath() called from outside a Shell Browser");
    },
    submitForm: () => {
        // eslint-disable-next-line no-console
        console.error("submitForm() called from outside a Shell Browser");

        return Promise.resolve();
    },
    openModal: () => {
        // eslint-disable-next-line no-console
        console.error("openModal() called from outside a Shell Browser");

        throw new Error("Modal cannot be opened here");
    },
});

export interface BrowserProps {
    views: Map<string, ShellViewFunction>;
    navigationController: NavigationController;
    openModal(path: string, onClose?: () => void): void;
    pushMessage(frameId: number, message: Message): void;
}

function Browser({
    views,
    navigationController,
    openModal,
    pushMessage,
}: BrowserProps): ReactElement {
    const { currentFrame, navigate, pushFrame, replacePath, submitForm } =
        navigationController;

    const framePushMessage = (message: Message) => {
        pushMessage(currentFrame.id, message);
    };

    let style: React.CSSProperties = {};

    if (navigationController.mode === "browser") {
        style = {
            width: "100%",
            height: "100%",
            position: "absolute",
            top: 0,
            left: 0,
        };
    }

    const ShellNavigationUtils = React.useMemo(
        () => ({ navigate, pushFrame, replacePath, submitForm, openModal }),
        [navigate, pushFrame, replacePath, submitForm, openModal]
    );

    // If loading, render nothing
    if (currentFrame.view === "loading") {
        return <></>;
    }

    // Get the view component
    const View = views.get(currentFrame.view);
    if (!View) {
        return <p>Unknown view &apos;{currentFrame.view}&apos;</p>;
    }

    // eslint-disable-next-line react/jsx-no-useless-fragment
    return (
        <ShellNavigationContext.Provider value={ShellNavigationUtils}>
            <div key={currentFrame.id} style={style}>
                <View
                    mode={navigationController.mode}
                    frame={currentFrame}
                    pushMessage={framePushMessage}
                />
            </div>
        </ShellNavigationContext.Provider>
    );
}

export default Browser;
