import React, { useRef, ReactElement } from "react";
import styled, { keyframes } from "styled-components";
import FocusTrap from "focus-trap-react";

export interface ModalWindowControls {
    close: () => void;
}

export const ModalWindowControlsContext =
    React.createContext<ModalWindowControls>({
        close: () => {
            // eslint-disable-next-line no-console
            console.error(
                "ModalWindowControls.close() called from outside a Modal"
            );
        },
    });

const fadeInOverlay = keyframes`
    from {
        opacity: 0;
    }

    to {
        opacity: 0.5;
    }
`;

const fadeOutOverlay = keyframes`
    from {
        opacity: 0.5;
    }

    to {
        opacity: 0;
    }
`;

const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: var(--z-index--modals);
    background-color: #000;
    opacity: 0.5;
    animation: ${fadeInOverlay} 0.2s ease;

    &.closing {
        animation: ${fadeOutOverlay} 0.2s ease;
        opacity: 0;
    }
`;

const slideInBody = keyframes`
    from {
        right: -1000px;
    }

    to {
        right: 0;
    }
`;

const slideOutBody = keyframes`
    from {
        right: 0
    }

    to {
        right: -1000px;
    }
`;

const ModalWindowWrapper = styled.div`
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: calc(var(--z-index--modals) + 1);
    overflow: hidden;
    animation: ${slideInBody} 0.2s ease;

    &.closing {
        animation: ${slideOutBody} 0.2s ease;
        right: -1000px;
    }
`;

const ModalLayout = styled.div`
    display: flex;
    flex-flow: row nowrap;
`;

const ModalBody = styled.div`
    box-sizing: border-box;
    margin-left: auto;
    padding: 0;
    z-index: calc(var(--z-index--modals) + 10);
    height: 100vh;
    max-width: 600px;
    background-color: var(--color--white);
    overflow-y: auto;
`;

let nextModalId = 1;

interface ModalWindowProps {
    onClose(): void;
    requestClose?: boolean;
}

function ModalWindow({
    children,
    onClose,
    requestClose = false,
}: React.PropsWithChildren<ModalWindowProps>): ReactElement {
    const id = useRef<string | null>(null);
    if (!id.current) {
        id.current = `modal-${nextModalId}`;
        nextModalId += 1;
    }

    // Closing state
    const [closing, setClosing] = React.useState(false);
    React.useEffect(() => {
        if (closing) {
            const timeout = setTimeout(onClose, 200);

            return () => {
                clearTimeout(timeout);
            };
        }

        return () => {};
    });
    React.useEffect(() => {
        if (requestClose) {
            setClosing(true);
        }
    }, [requestClose]);

    const ModalWindowControls = React.useMemo(
        () => ({ close: () => setClosing(true) }),
        [setClosing]
    );

    // Close modal on click outside
    const bodyRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        const clickEventListener = (e: MouseEvent) => {
            // Close modal on click outside
            if (
                bodyRef.current &&
                e.target instanceof HTMLElement &&
                !bodyRef.current.contains(e.target)
            ) {
                e.preventDefault();
                setClosing(true);
            }
        };

        document.body.addEventListener("mouseup", clickEventListener);

        return () => {
            document.body.removeEventListener("mouseup", clickEventListener);
        };
    });

    return (
        <>
            <ModalOverlay className={closing ? "closing" : ""} />
            <ModalWindowWrapper
                tabIndex={-1}
                role="dialog"
                aria-modal
                aria-hidden={false}
                aria-labelledby={`${id.current}-title`}
                className={closing ? "closing" : ""}
            >
                <ModalWindowControlsContext.Provider
                    value={ModalWindowControls}
                >
                    <FocusTrap>
                        <ModalLayout>
                            <ModalBody ref={bodyRef}>{children}</ModalBody>
                        </ModalLayout>
                    </FocusTrap>
                </ModalWindowControlsContext.Provider>
            </ModalWindowWrapper>
        </>
    );
}

export default ModalWindow;
