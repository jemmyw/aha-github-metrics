import { EXTENSION_ID } from "../extension";

aha.on("webhook", async ({ headers, payload }) => {
  const event = headers.HTTP_X_GITHUB_EVENT;
  aha.triggerServer(`${EXTENSION_ID}.webhook`, { event, payload });
});
