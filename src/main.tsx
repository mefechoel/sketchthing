import { hydrate } from "preact";
import App from "./App";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
hydrate(<App />, document.getElementById("root")!);

setTimeout(() => {
	// eslint-disable-next-line no-console
	console.log(
		"\nHello curious visitor! If you want to check out how this thing " +
			"works, have a look at the GitHub repo here:\n" +
			"https://github.com/mefechoel/sketchthing\n",
	);
}, 0);
