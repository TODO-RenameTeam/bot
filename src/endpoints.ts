import http from 'http';
import TelegramBot from 'node-telegram-bot-api';

export const listenToUpgates = (sync: () => Promise<void>, bot: TelegramBot) => {
    const webhookOptions = {
        host: '0.0.0.0',
        port: 3033,
        path: '/telegram-bot',
    };

    // Create a HTTP server
    const server = http.createServer((req, res) => {
        if (req.url === webhookOptions.path && req.method === 'GET') {

            req.on('data', (chunk) => {
                console.log('data get');

            });
            req.on('end', () => {
                sync();

                console.log('end get');

                // Pass the update to the bot
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('OK');
            });
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        }


        if (req.url === '/telegram-bot/send_message' && req.method === 'POST') {

            let requestBody = '';

            req.on('data', (chunk) => {
                requestBody += chunk.toString();

                console.log('data');

            });
            req.on('end', () => {
                const requestJSON = JSON.parse(requestBody);

                console.log(requestBody);


                console.log('end');

                bot.sendMessage(requestJSON["userId"], requestJSON["text"]);

                // Pass the update to the bot
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('OK');
            });
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        }
    });

    // Start the server
    server.listen(webhookOptions.port, webhookOptions.host, () => {
        console.log(`Telegram bot webhook listening at http://${webhookOptions.host}:${webhookOptions.port}${webhookOptions.path}`);
    });
};

// export const listenToMessages = (bot: TelegramBot) => {
//     const webhookOptions = {
//         host: '0.0.0.0',
//         port: 3033,
//         path: '/telegram-bot/message',
//     };

//     // Create a HTTP server
//     const server = http.createServer((req, res) => {
//         if (req.url === webhookOptions.path && req.method === 'POST') {

//             req.on('data', (chunk) => {
//                 console.log('data');

//             });
//             req.on('end', () => {


//                 console.log('end');

//                 // Pass the update to the bot
//                 res.writeHead(200, { 'Content-Type': 'text/plain' });
//                 res.end('OK');
//             });
//         } else {
//             res.writeHead(404, { 'Content-Type': 'text/plain' });
//             res.end('Not Found');
//         }
//     });

//     // Start the server
//     server.listen(webhookOptions.port, webhookOptions.host, () => {
//         console.log(`Telegram bot webhook listening at http://${webhookOptions.host}:${webhookOptions.port}${webhookOptions.path}`);
//     });
// };