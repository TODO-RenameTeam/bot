import { API_URL } from '../src/config'
import axios from 'axios';
import *  as https from 'https';

const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

const requestBody = {
    "lastName": "string",
    "firstName": "string",
    "middleName": "string",
    "role": "User"
};

axios.post(`${API_URL}/api/User`, requestBody, {
    httpsAgent: httpsAgent
})
    .then((response) => {
        console.log('Response:', response.data);
    })
    .catch((error) => {
        console.error('Error:', error);
    });