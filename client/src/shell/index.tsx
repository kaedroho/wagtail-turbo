import React, { ReactElement } from "react";
import styled from "styled-components";
// eslint-disable-next-line import/no-extraneous-dependencies
import produce from "immer";
import Cookies from 'js-cookie';

import Browser from "./components/Browser";
import ToastMessages from "./components/ToastMessages";
import ModalWindow from "./components/ModalWindow";
import { Message, TurboResponse } from "./fetch";

import { NavigationController } from "./navigation";
import { ShellViewFunction } from "./views";
import { ModuleDefinition, Sidebar } from "../sidebar/Sidebar";

export const SIDEBAR_COLLAPSED_COOKIE_NAME = 'wagtail_sidebar_collapsed';

export const SetSidebarModulesContext = React.createContext<(modules: ModuleDefinition[]) => void>(() => {});

export interface ShellProps {
    views: Map<string, ShellViewFunction>;
    initialResponse: TurboResponse;
}

const ShellWrapper = styled.div`
    height: 100vh;
`;

const BrowserWrapper = styled.div`
    position: absolute;
    width: 100%;
    height: 100%;
`;

function Shell({ views, initialResponse }: ShellProps): ReactElement {
    const [navigationController] = React.useState(
        () => new NavigationController("browser", null)
    );
    const [localMessages, setLocalMessages] = React.useState<
        Map<number, Message[]>
    >(() => new Map());
    const [modal, setModal] = React.useState<{
        navigationController: NavigationController;
        requestClose: boolean;
    } | null>(null);
    const modalCloseListener = React.useRef<(() => void) | null>(null);

    const [render, setRender] = React.useState(0);

    // Create a state to store the sidebar module definitions. This will be set by a view
    const [sidebarModules, setSidebarModules] = React.useState<ModuleDefinition[]>([]);

    // Get list of messages to display at the top by combining server messages with any locally raised messages
    const frameMessages =
        navigationController.currentFrame.serverMessages.slice();

    const localFrameMessages = localMessages.get(
        navigationController.currentFrame.id
    );
    if (localFrameMessages) {
        localFrameMessages.forEach((message) => frameMessages.push(message));
    }

    const pushMessage = (frameId: number, message: Message) => {
        setLocalMessages(
            produce(localMessages, (draft) => {
                if (!draft.has(frameId)) {
                    draft.set(frameId, []);
                }

                draft.get(frameId)?.push(message);
            })
        );
    };

    React.useEffect(() => {
        // Add listener to re-render the app if a navigation event occurs
        navigationController.addNavigationListener(() => {
            // HACK: Update some state to force a re-render
            setRender(render + Math.random());
        });

        // Handle initial response
        // eslint-disable-next-line no-void
        void navigationController
            .handleResponse(initialResponse, window.location.pathname)
            .then(() => {
                // Remove the loading screen
                const loadingScreen = document.querySelector(".loading-screen");
                if (loadingScreen instanceof HTMLElement) {
                    loadingScreen.classList.add("loading-screen--hidden");
                    setTimeout(() => {
                        loadingScreen.remove();
                    }, 200);
                }
            });

        // Add listener to raise any server errors that the navigation controller encounters
        navigationController.addServerErrorListener(() => {
            pushMessage(navigationController.currentFrame.id, {
                level: "error",
                text: "A server error occurred. Please try again later.",
            });
        });

        // Add listener for popState
        // This event is fired when the user hits the back/forward links in their browser
        const navigate = () => {
            // eslint-disable-next-line no-void
            void navigationController.navigate(
                document.location.pathname,
                false
            );
        };

        window.addEventListener("popstate", navigate);
        return () => {
            window.removeEventListener("popstate", navigate);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Call modal close listener if the modal has been closed
    React.useEffect(() => {
        if (modal === null && modalCloseListener.current) {
            modalCloseListener.current();
            modalCloseListener.current = null;
        }
    }, [modal]);

    const openModal = (path: string, onClose?: () => void) => {
        // Set up a new navigation controller
        const modalNavigationController = new NavigationController(
            "modal",
            navigationController
        );
        modalNavigationController.addNavigationListener(() => {
            // HACK: Update some state to force a re-render
            setRender(render + Math.random());
        });
        // eslint-disable-next-line no-void
        void modalNavigationController.navigate(path);

        // Add a listener to listen for when the modal is closed by the server
        // TODO: do this with requestClose instead so the close animation will run
        modalNavigationController.addCloseListener(() => setModal(null));

        if (onClose) {
            modalCloseListener.current = onClose;
        }

        setModal({
            navigationController: modalNavigationController,
            requestClose: false,
        });
    };

    React.useEffect(() => {
        const keydownEventListener = (e: KeyboardEvent) => {
            // Close modal on click escape
            if (e.key === "Escape" && modal) {
                setModal({
                    navigationController: modal.navigationController,
                    requestClose: true,
                });
            }
        };

        document.addEventListener("keydown", keydownEventListener);

        return () => {
            document.removeEventListener("keydown", keydownEventListener);
        };
    });

    // Close modal when we navigate the main window
    React.useEffect(() => {
        const navigationListener = () => {
            if (modal) {
                setModal({
                    navigationController: modal.navigationController,
                    requestClose: true,
                });
            }
        };

        navigationController.addNavigationListener(navigationListener);

        return () => {
            navigationController.removeNavigationListener(navigationListener);
        };
    });

    const collapsedCookie: any = Cookies.get(SIDEBAR_COLLAPSED_COOKIE_NAME);
    // Cast to boolean
    const collapsed = !(
      collapsedCookie === undefined || collapsedCookie === '0'
    );

    const onExpandCollapse = (_collapsed: boolean) => {
      if (_collapsed) {
        document.body.classList.add('sidebar-collapsed');
        Cookies.set(SIDEBAR_COLLAPSED_COOKIE_NAME, "1");
      } else {
        document.body.classList.remove('sidebar-collapsed');
        Cookies.set(SIDEBAR_COLLAPSED_COOKIE_NAME, "0");
      }
    };

    return (
        <ShellWrapper>
            <Sidebar
                modules={sidebarModules}
                collapsedOnLoad={collapsed}
                currentPath={navigationController.currentFrame.path}
                navigate={navigationController.navigate}
                onExpandCollapse={onExpandCollapse}
            />,
            <ToastMessages messages={frameMessages} />
            {modal &&
                modal.navigationController.currentFrame.view !== "loading" && (
                    <ModalWindow
                        onClose={() => setModal(null)}
                        requestClose={modal.requestClose}
                    >
                        <Browser
                            views={views}
                            navigationController={modal.navigationController}
                            openModal={() => {}}
                            pushMessage={pushMessage}
                        />
                    </ModalWindow>
                )}
            <BrowserWrapper>
                <SetSidebarModulesContext.Provider value={setSidebarModules}>
                    <Browser
                        views={views}
                        navigationController={navigationController}
                        openModal={(url, onClose) => openModal(url, onClose)}
                        pushMessage={pushMessage}
                    />
                </SetSidebarModulesContext.Provider>
            </BrowserWrapper>
        </ShellWrapper>
    );
}

export default Shell;
