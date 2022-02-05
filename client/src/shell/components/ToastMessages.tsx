import React, { ReactElement } from "react";
import styled, { css } from "styled-components";
import { Message } from "../fetch";

const ToastMessagesWrapper = styled.div`
    position: absolute;
    bottom: 50px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
    margin-top: 10px;
    z-index: var(--z-index--toast-messages);
`;

const ToastMessageWrapper = styled.div<{ level: Message["level"] }>`
    padding: 14px 21px;
    text-align: center;
    border-radius: 5px;

    font-size: 14px;
    font-weight: 700;

    svg {
        display: inline;
        width: 16px;
        vertical-align: bottom;
        margin-right: 5px;
    }

    ${(props) => {
        if (props.level === "success") {
            return css`
                background-color: #bcebec;
                color: #251657;

                svg {
                    color: #251657;
                }
            `;
        }

        if (props.level === "warning") {
            return css`
                background-color: var(--color--amber-tint);
                color: #251657;

                svg {
                    color: var(--color--amber);
                }
            `;
        }

        if (props.level === "error") {
            return css`
                background-color: #ffdadd;
                color: var(--color--red);

                svg {
                    color: var(--color--red);
                }
            `;
        }

        return css``;
    }}

    // Fadeout animation
    animation: 5s ease 0s normal forwards 1 fadeout;
    @keyframes fadeout {
        0% {
            opacity: 1;
        }
        66% {
            opacity: 1;
        }
        100% {
            opacity: 0;
        }
    }
`;

interface ToastMessagesProps {
    messages: Message[];
}

function ToastMessages({ messages }: ToastMessagesProps): ReactElement {
    return (
        <ToastMessagesWrapper>
            {messages.map((message) => {
                // const icon =
                //     message.level === "success" ? (
                //         <Icon name="check-circle-solid" />
                //     ) : (
                //         <Icon name="exclamation-triangle-solid" />
                //     );

                if ("html" in message) {
                    return (
                        <ToastMessageWrapper
                            level={message.level}
                            dangerouslySetInnerHTML={{ __html: message.html }}
                        />
                    );
                }

                return (
                    <ToastMessageWrapper level={message.level}>
                        {/* {icon} */}
                        {message.text}
                    </ToastMessageWrapper>
                );
            })}
        </ToastMessagesWrapper>
    );
}

export default ToastMessages;
