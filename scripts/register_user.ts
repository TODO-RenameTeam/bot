import { API_URL } from '../src/config'
import axios from 'axios';
import *  as https from 'https';

const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

const requestBody = {
    lastName: 'Doe',
    firstName: 'John',
    middleName: 'Smith',
    role: 'User',
};

axios.post(`${API_URL}/api/User`, requestBody, {
    httpsAgent: httpsAgent
})
    .then((response) => {
        console.log('Response:', response.data);

        // console.log('Response:', response.data["id"]);

        const id = response.data["id"];

        console.log(id);


        axios.post(`${API_URL}/api/TelegramCode/generate?userId=${id}`, {}, {
            httpsAgent: httpsAgent
        })
            .then((response) => {
                console.log('Response:', response.data);


            })
            .catch((error) => {
                console.log('gen');
                
                console.error('Error:', error);
            });
    })
    .catch((error) => {
        console.error('Error:', error);
    });