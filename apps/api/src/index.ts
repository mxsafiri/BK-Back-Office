import { buildServer } from "./server.js";

/** Entrypoint: build and start the API service. */
const { app, config } = buildServer({ logger: true });

app
  .listen({ port: config.port, host: "0.0.0.0" })
  .then((address) => app.log.info(`FIMCO BBO API listening on ${address}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
