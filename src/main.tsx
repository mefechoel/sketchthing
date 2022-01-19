import { hydrate } from "preact";
import App from "./App";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
hydrate(<App />, document.getElementById("root")!);
