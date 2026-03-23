const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

    const TELEGRAM_TOKEN = '8791804941:AAEEYnq4UAf5Tp5lk9frlqI7zZ_OSZQN3W0';
const CHAT_ID = '8128490926';

app.post('/webhook', (req, res) => {
    const message = req.body;

    if (message) {
        const text = `New Notification:\n\nPackage: ${message.package}\nTitle: ${message.title}\nText: ${message.text}`;
        
        axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: text
        })
        .then(() => {
            res.status(200).send('Notification sent to Telegram');
        })
        .catch((error) => {
            console.error('Error sending message to Telegram:', error);
            res.status(500).send('Error sending notification');
        });
    } else {
        res.status(400).send('Invalid notification data');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
