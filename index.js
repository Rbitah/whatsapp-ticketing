const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(bodyParser.json());

const ACCESS_TOKEN = 'EAAIZCPFZAYWO8BO2wbZC2VYjHdrDTo8GcWWpanDTIbKljZB0y3akkrZB8TAosCodZAE1ZAKQJKeGrcFwzWKpTugH8H1mDsriHIrAZAXWPKio8wevIf6XHkvjmZBaqvSr3OITs9lJJPebvEqKdQiFM6490XV8GnGEdpRiisO2nQ28w62aB2aATDWRZBHYspP69x0ZBUYh2yrD1CmHWYiINZCJvGxQMEN0vGYZD';
const PHONE_NUMBER_ID = '524888984044537';

let users = {};
let events = [
  { id: 1, name: 'Concert A' },
  { id: 2, name: 'Concert B' },
];

app.post('/webhook', async (req, res) => {
  const incomingMessage = req.body.messages[0];
  const from = incomingMessage.from;
  const messageText = incomingMessage.text.body;

  if (messageText.toLowerCase() === 'hi') {
    if (!users[from]) {
      users[from] = { step: 'ASK_USERNAME' };
      return sendWhatsAppMessage(from, 'Hello! Please provide your username.');
    } else {
      return sendWhatsAppMessage(from, 'Welcome back! Here are the available events:\n' + listEvents());
    }
  }

  if (users[from]?.step === 'ASK_USERNAME') {
    users[from].username = messageText;
    users[from].step = 'CHOOSE_EVENT';
    return sendWhatsAppMessage(from, 'Thank you, ' + messageText + '! Here are the available events:\n' + listEvents());
  }

  if (users[from]?.step === 'CHOOSE_EVENT') {
    const eventId = parseInt(messageText);
    if (!events[eventId - 1]) {
      return sendWhatsAppMessage(from, 'Invalid event number. Please try again.');
    }
    users[from].event = events[eventId - 1];
    users[from].step = 'CHOOSE_PAYMENT';
    return sendWhatsAppMessage(from, 'You selected ' + events[eventId - 1].name + '. Choose a payment method:\n1. Airtel Money\n2. Mpamba');
  }

  if (users[from]?.step === 'CHOOSE_PAYMENT') {
    if (messageText !== '1' && messageText !== '2') {
      return sendWhatsAppMessage(from, 'Invalid choice. Please select 1 for Airtel Money or 2 for Mpamba.');
    }
    const paymentMethod = messageText === '1' ? 'Airtel Money' : 'Mpamba';
    users[from].paymentMethod = paymentMethod;
    users[from].step = 'PAYMENT';
    // Implement payment processing here
    // On success, proceed to generate a ticket
    const ticketId = uuidv4();
    const qrCode = await generateQRCode(ticketId);
    sendWhatsAppMessage(from, 'Payment successful! Here is your ticket QR code:');
    return sendWhatsAppMessage(from, qrCode);
  }

  res.sendStatus(200);
});

function sendWhatsAppMessage(to, message) {
  return axios.post(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: message },
  }, {
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });
}

function listEvents() {
  return events.map((e, index) => `${index + 1}. ${e.name}`).join('\n');
}

async function generateQRCode(ticketId) {
  try {
    const qrCodeUrl = await QRCode.toDataURL(ticketId);
    return qrCodeUrl;
  } catch (err) {
    console.error(err);
  }
}

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
