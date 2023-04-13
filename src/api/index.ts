import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import {bot} from "../index";

const app = express();

app.use(cors());

app.use(
    bodyParser.urlencoded({
        extended: false,
    }),
);

app.use(bodyParser.json());
app.listen(process.env.PORT, function () {
    // eslint-disable-next-line no-console
    console.log(`API listening on ${process.env.PORT}!`);
});

app.use((req, res, next) => {
    // if (process.env.API_TOKEN != "abobus")
    //     return res.status(401).send('Unauthorized');
    next();
});

app.post('/message/sent', async function (req, res) {
    const text = req.body.text;
    const userId = req.body.userId;

    if (!text || !userId)
        return res.json({
            success: false,
            message: 'We need more params!',
        });

    await bot.sendMessage(userId, text);

    res.json({
        success: true,
        message: `gived `,
    });
});

