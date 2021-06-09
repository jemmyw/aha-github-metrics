import { EXTENSION_ID } from "../extension";

aha.on("webhook", async ({ headers, payload }) => {
  console.log("hello");
  // const event = headers.HTTP_X_GITHUB_EVENT;
  // console.log(`Received webhook '${event}' ${payload.action || ""}`);
  // aha.triggerServer(`${EXTENSION_ID}.webhook`, { event, payload });
});
