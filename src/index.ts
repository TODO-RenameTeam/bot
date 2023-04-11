import TelegramBot, { InlineKeyboardButton, InlineKeyboardMarkup } from 'node-telegram-bot-api';
import { TELEGRAM_API_TOKEN } from '../config';
import { API_URL } from '../config';
import axios from 'axios';
import *  as https from 'https';
import { TextCommand, Button } from './interfaces/TextCommand';
import { listenToUpgates } from './endpoints';

const bot = new TelegramBot(TELEGRAM_API_TOKEN, { polling: true });

const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});


let currentCommandCallbacks: ((msg: any) => void)[] = [];
let currentButtonCallbacks: ((msg: any) => void)[] = [];


const sync = async () => {
    for (const cb of currentCommandCallbacks) {
        bot.removeListener('message', cb);
    }

    for (const cb of currentButtonCallbacks) {
        bot.removeListener('callback_query', cb);
    }


    currentCommandCallbacks = [];
    currentButtonCallbacks = [];

    await axios.get(`${API_URL}/api/TextCommand`, {
        httpsAgent: httpsAgent
    })
        .then(function (response) {
            // console.log(JSON.stringify(response.data));


            let commands: TextCommand[] = response.data;

            for (let command of commands) {
                let buttons: TelegramBot.InlineKeyboardButton[][] = [];

                for (const button of command.buttons) {
                    buttons.push([{
                        text: button.name,
                        callback_data: button.key,
                    }]);
                }

                // Define the keyboard using InlineKeyboardMarkup and add the buttons to it
                let keyboard: InlineKeyboardMarkup = {
                    inline_keyboard: buttons,
                };


                let sendMessage = async (chatId, userId) => {
                    await axios.get(`${API_URL}/api/User/tg?id=${userId}`, {
                        httpsAgent: httpsAgent
                    }).then((result) => {
                        bot.sendMessage(chatId, command.text, {
                            reply_markup: keyboard,
                        });

                    }).catch((err) => {
                        if (err.response.status == 404)
                            bot.sendMessage(chatId, "Вы не авторизованы.");
                    });

                };

                let newCommandCallback = async (message: TelegramBot.Message) => {
                    if (message.text == command.template)
                        sendMessage(message.chat.id, message.from.id);

                };

                let newButtonCallback = (query) => {
                    if (query.data == command.template) {
                        bot.answerCallbackQuery(query.id)
                            .then(() => {
                                sendMessage(query.message.chat.id, query.from.id);
                            });
                    }
                };


                currentCommandCallbacks.push(newCommandCallback);
                currentButtonCallbacks.push(newButtonCallback);

                bot.on('message', newCommandCallback);
                bot.on('callback_query', newButtonCallback);

            }
        })
        .catch(function (error) {
            console.log(error);
        })

};

let init = async () => {
    await sync();

    listenToUpgates(sync, bot);

    bot.setMyCommands([{
        command: '/menu',
        description: 'В главное меню',
    }, {
        command: '/info',
        description: 'Информация о пользователе',
    }]).catch((error) => {
        console.error('Error adding command suggestions:', error);
    });
};

init();




bot.on('message', async (message: TelegramBot.Message) => {
    await axios.get(`${API_URL}/api/User/tg?id=${message.from.id}`, {
        httpsAgent: httpsAgent
    }).catch((err) => {
        if (err.response.status == 404) {
            if (message.text.length == 5) {

                axios.post(`${API_URL}/api/TelegramCode/connect?code=${message.text}&telegramUserId=${message.from.id}`, {}, {
                    httpsAgent: httpsAgent
                })
                    .then((response) => {
                        console.log('Response:', response.data);

                        bot.sendMessage(message.chat.id, "Вы успешно вошли");
                    })
                    .catch((error) => {
                        bot.sendMessage(message.chat.id, "Код неверный либо вы прислали не код. Чтобы начать введите свой код.");
                    });
            }
            else {
                bot.sendMessage(message.chat.id, "Чтобы начать введите свой код.");
            }
        }
    });
});


bot.onText(/\/info/, async (message) => {
    console.log(message.chat.id);



    bot.sendMessage(message.chat.id, `${message.from.id}`);

    await axios.get(`${API_URL}/api/User/tg?id=${message.from.id}`, {
        httpsAgent: httpsAgent
    }).then((res) => {
        console.log(res.data);

        bot.sendMessage(message.chat.id, `${res.data['id']}`);

    }).catch((err) => {
        console.log(err);
    });
});


bot.onText(/\/poll/, async (message) => {
    console.log(message.chat.id);



    bot.sendPoll(message.from.id, 'Which is your favorite color?', ['Red', 'Green', 'Blue'],
        {
            type: 'quiz',
            is_anonymous: false,
            correct_option_id: 1
        }
    )
        .then((sentPoll) => {
            bot.on('poll_answer', (pollAnswer) => {

                console.log(`User ${pollAnswer.user.id} answered the poll with ID ${pollAnswer.poll_id}`);

                if (pollAnswer.poll_id === sentPoll.poll.id) {
                    // Replace USER_ID with the ID of the user who answered the poll
                    bot.sendMessage(message.from.id, 'Thanks for answering the poll!');
                }
            });
        })
        .catch((error) => {
            console.error(`Failed to send poll: ${error}`);
        });
});
