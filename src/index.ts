import TelegramBot, {InlineKeyboardButton, InlineKeyboardMarkup} from 'node-telegram-bot-api';
import {TELEGRAM_API_TOKEN} from '../config';
import {API_URL} from '../config';
import axios from 'axios';
import *  as https from 'https';
import {TextCommand, Button} from './interfaces/TextCommand';
import {listenToUpgates} from './endpoints';
import {randomIntFromInterval} from './utils/random';
import {RoleOnboarding, User, UserOnboarding} from './interfaces/onboarding';

import dotenv from 'dotenv';

dotenv.config();

import './api';

export const bot = new TelegramBot(TELEGRAM_API_TOKEN, {polling: true});

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
                    }).then(async (result) => {


                        for await (const image of command.images) {
                            if (image != "") {
                                await bot.sendPhoto(chatId, image)
                                    .catch((error) => {
                                        console.error('Error sending image');
                                    });
                            }
                        }

                        for await (const link of command.urls) {
                            if (link != "")
                                await bot.sendMessage(chatId, link);
                        }

                        let tempQuizes = command.quizes.sort(() => Math.random() - 0.5).slice(0, Math.min(command.quizesCount, command.quizes.length));

                        for (let index = 0; index < tempQuizes.length; index++) {

                            await bot.sendPoll(chatId, tempQuizes[index].text, tempQuizes[index].options,
                                {
                                    type: 'quiz',
                                    is_anonymous: false,
                                    correct_option_id: tempQuizes[index].rightOptionID - 1
                                }
                            );

                        }


                        bot.sendMessage(chatId, command.text, {
                            reply_markup: keyboard,
                        });

                    }).catch((err) => {
                        try {
                            if (err.response.status == 404)
                                bot.sendMessage(chatId, "Вы не авторизованы.");
                            else
                                console.log(err);
                        } catch (error) {

                            console.log(err);
                        }

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


    console.log("synced");
};

const resyncOnTimer = async () => {
    setTimeout(() => {
            sync();
            resyncOnTimer();
        },
        5000);
}

let init = async () => {
    await sync();

    listenToUpgates(sync, bot);
    resyncOnTimer();

    bot.setMyCommands([{
        command: '/menu',
        description: 'В главное меню',
    }, {
        command: '/info',
        description: 'Информация о пользователе',
    }, {
        command: '/question',
        description: 'Задать вопрос',
    }, {
        command: '/onboarding',
        description: 'Перейти к онбордигу',
    }]).catch((error) => {
        console.error('Error adding command suggestions:', error);
    });
};

init();


bot.on('message', async (message: TelegramBot.Message) => {
    await axios.get(`${API_URL}/api/User/tg?id=${message.from.id}`, {
        httpsAgent: httpsAgent
    }).catch((err) => {
        try {
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
                } else {
                    bot.sendMessage(message.chat.id, "Чтобы начать введите свой код.");
                }
            }
        } catch (error) {
            console.log("hzerr");

        }

    });
});


bot.onText(/\/onboarding/, async (message) => {
    await axios.get(`${API_URL}/api/User/tg?id=${message.from.id}`, {
        httpsAgent: httpsAgent
    }).then(async (result) => {
        let user: User = result.data;

        await axios.get(`${API_URL}/api/UserOnboarding/user/id/${user['id']}`, {
            httpsAgent: httpsAgent
        }).then(async (result) => {
            let userOnbords: UserOnboarding[] = result.data;

            if (userOnbords.length == 0) {
                console.log('em');


                await axios.get(`${API_URL}/api/RoleOnboarding/position/${user.positionID}`, {
                    httpsAgent: httpsAgent
                }).then(async (result) => {
                    let roleOnb: RoleOnboarding = result.data;

                    await axios.post(`${API_URL}/api/UserOnboarding`, {
                        "userID": user.id,
                        "roleOnboardingID": roleOnb.id,
                        "userCurrentStepID": roleOnb.steps[0].id
                    }, {
                        httpsAgent: httpsAgent
                    }).then(async (result) => {
                        let command = roleOnb.steps[0];

                        console.log(command);


                        for await (const image of command.images) {
                            if (image != "") {
                                await bot.sendPhoto(message.from.id, image)
                                    .catch((error) => {
                                        console.error('Error sending image');
                                    });
                            }
                        }

                        for await (const link of command.urls) {
                            if (link != "")
                                await bot.sendMessage(message.from.id, link);
                        }

                        let tempQuizes = command.quizes.sort(() => Math.random() - 0.5).slice(0, Math.min(command.quizesCount, command.quizes.length));

                        bot.sendMessage(message.from.id, command.text);

                        for (let index = 0; index < tempQuizes.length; index++) {

                            await bot.sendPoll(message.from.id, tempQuizes[index].text, tempQuizes[index].options,
                                {
                                    type: 'quiz',
                                    is_anonymous: false,
                                    correct_option_id: tempQuizes[index].rightOptionID - 1
                                }
                            );

                        }
                    }).catch((err) => {
                    });
                }).catch((err) => {
                });
            } else {
                await axios.get(`${API_URL}/api/RoleOnboarding/position/${user.positionID}`, {
                    httpsAgent: httpsAgent
                }).then(async (result) => {


                    let onbord: RoleOnboarding = result.data;

                    // console.log(onbord);

                    let id = 0;

                    for (let index = 0; index < onbord.steps.length; index++) {
                        if (onbord.steps[index].id == userOnbords[0].userCurrentStepID) {
                            console.log('id');
                            id = index;
                        }

                    }

                    if (id + 1 == onbord.steps.length) {
                        bot.sendMessage(message.from.id, 'Вы уже прошли онбординг.');
                    } else {
                        let command = onbord.steps[id + 1];


                        for await (const image of command.images) {
                            if (image != "") {
                                await bot.sendPhoto(message.from.id, image)
                                    .catch((error) => {
                                        console.error('Error sending image');
                                    });
                            }
                        }

                        for await (const link of command.urls) {
                            if (link != "")
                                await bot.sendMessage(message.from.id, link);
                        }

                        bot.sendMessage(message.from.id, command.text);

                        let tempQuizes = command.quizes.sort(() => Math.random() - 0.5).slice(0, Math.min(command.quizesCount, command.quizes.length));

                        for (let index = 0; index < tempQuizes.length; index++) {

                            await bot.sendPoll(message.from.id, tempQuizes[index].text, tempQuizes[index].options,
                                {
                                    type: 'quiz',
                                    is_anonymous: false,
                                    correct_option_id: tempQuizes[index].rightOptionID - 1
                                }
                            );

                        }


                        await axios.put(`${API_URL}/api/UserOnboarding?id=${userOnbords[0].id}`,
                            {
                                "userID": user.id,
                                "roleOnboardingID": onbord.id,
                                "userCurrentStepID": onbord.steps[id + 1].id
                            },
                            {
                                httpsAgent: httpsAgent
                            }).then((result) => {
                            console.log('r');

                        }).catch((err) => {
                            console.log(err);

                        });


                        if (id + 2 == onbord.steps.length) {
                            bot.sendMessage(message.from.id, 'Вы прошли онбординг.');
                        }
                    }
                });
            }
        }).catch((err) => {
        });
    }).catch((err) => {
    });
});


bot.onText(/\/question/, async (message) => {
    console.log(message.chat.id);


    bot.sendMessage(message.chat.id, `Введите вопрос.`);


    let callback = async (callbackMessage: TelegramBot.Message) => {
        if (message.from.id == callbackMessage.chat.id) {
            bot.sendMessage(callbackMessage.chat.id, `Вопрос отправлен.`);


            bot.removeListener('message', callback);

            await axios.get(`${API_URL}/api/User/tg?id=${message.from.id}`, {
                httpsAgent: httpsAgent
            }).then(async (result) => {
                await axios.post(`${API_URL}/api/UserQuestion`, {
                    "question": callbackMessage.text,
                    "userQuestionID": result.data['id']
                }, {
                    httpsAgent: httpsAgent
                }).then((result) => {
                    console.log("sent");

                }).catch((err) => {
                    console.log(err);

                });
            }).catch((err) => {
                console.log("c1");

            });
        }
    };


    bot.on('message', callback);
});


bot.onText(/\/info/, async (message) => {
    console.log(message.chat.id);


    bot.sendMessage(message.chat.id, `User telegram id: ${message.from.id}`);

    await axios.get(`${API_URL}/api/User/tg?id=${message.from.id}`, {
        httpsAgent: httpsAgent
    }).then((res) => {
        console.log(res.data);

        bot.sendMessage(message.chat.id, `User system id: ${res.data['id']}`);

    }).catch((err) => {
        console.log(err);
    });
});


