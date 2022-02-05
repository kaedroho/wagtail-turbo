import React, { ReactElement } from "react";
import "./App.css";

import Shell from "./shell";
import { TurboResponse } from "./shell/fetch";
import IFrameView from "./views/IFrame";

const views = new Map();
views.set('iframe', IFrameView);

function App(): ReactElement {
    const rootElement = document.getElementById("root");
    const initialResponse = rootElement?.dataset.initialResponse;

    if (initialResponse) {
        return (
            <Shell
                views={views}
                initialResponse={JSON.parse(initialResponse) as TurboResponse}
            />
        );
    }
    return <>Unable to render</>;
}

export default App;
