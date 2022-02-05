import { ReactElement } from "react";
import { Message } from "./fetch";
import { Mode } from "./modes";
import { Frame } from "./navigation";

export interface ShellViewProps<Context = Record<string, unknown>> {
    frame: Frame<Context>;
    mode: Mode;
    pushMessage(message: Message): void;
}

export type ShellViewFunction<Context = Record<string, unknown>> = (
    props: ShellViewProps<Context>
) => ReactElement;
