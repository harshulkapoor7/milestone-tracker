import { createApp } from "./app";
import { env } from "./env";
import { logger } from "./logger";

const app = createApp();

app.listen(env.PORT, () => {
  logger.info(`API listening on http://localhost:${env.PORT}`);
});
