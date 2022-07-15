import 'dotenv/config'
import express from 'express'
import puzzle from "../src/services/crypto/puzzle";
import { Instance } from "../src/services/util/instance";

const app: express.Express = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "*")
    res.header("Access-Control-Allow-Headers", "*");
    next();
})

app.listen(process.env.PORT, () => {
    console.log(`Start on port ${process.env.PORT}.`)
})

Instance.init().then(() => {
    app.get('/test', async (req: express.Request, res: express.Response) => {
        res.send(JSON.stringify(await puzzle.getAddressFromPuzzleHash("0xce8a53f46946e5c5e2aa835d700745d9be3879bc5f6a029a965b7663a5c1f74c", "xch")))
    })
});