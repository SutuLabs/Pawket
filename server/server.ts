import 'dotenv/config'
import express from 'express'
import cluster from 'cluster'
import os from 'os'
import app from './app'

// Check the number of available CPU.
let maxThreads = Number(process.env.MAX_THREAD ?? Number.MAX_SAFE_INTEGER);
maxThreads = maxThreads == 0 ? Number.MAX_SAFE_INTEGER : maxThreads;
const numCPUs = Math.min(os.cpus().length, maxThreads);

const port = Number(process.env.PORT ?? 3030);

// For Master process
if (cluster.isPrimary && numCPUs > 1) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // This event is firs when worker died
  cluster.on('exit', (worker, _code, _signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
}

// For Worker
else {

  app.use((_req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "*")
    res.header("Access-Control-Allow-Headers", "*");
    next();
  })

  app.listen(port, () => {
    console.log(`Start on port ${port}.`)
  })

}