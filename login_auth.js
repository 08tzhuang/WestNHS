const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const sheetId = '1UsqyeMhIihMWYK9JWfIoGK-TX7kU1tk-r0yj3kP01_8'; // Replace with your calendar sheet ID
const sheetName = 'Info'; // Replace if yours is named differently

// Helper to load credentials dynamically
function getCredentials() {
    const credsPath = path.join(__dirname, 'credentials.json');

    // Write the credentials.json if it doesn't exist
    if (!fs.existsSync(credsPath)) {
        fs.writeFileSync(credsPath, process.env.GOOGLE_CREDENTIALS);
    }

    return JSON.parse(fs.readFileSync(credsPath, 'utf8'));
}

async function getCalendarEvents() {
    const credentials = getCredentials();

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: SCOPES,
    });

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // image
    const imageRes = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${sheetName}!B2`,
    });
    let imageUrl = imageRes.data.values?.[0]?.[0] || null;
    if (imageUrl && imageUrl.includes("drive.google.com")) {
        const match = imageUrl.match(/\/d\/(.*?)\//);
        if (match && match[1]) {
            imageUrl = `https://drive.google.com/uc?export=view&id=${match[1]}`;
        }
    }

    // bullets
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${sheetName}!A2:A6`,
    });

    const rows = response.data.values;
    return { imageUrl, events: rows ? rows.flat() : [] };
}

async function getNotifications() {
    const credentials = getCredentials();

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: SCOPES,
    });

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${sheetName}!A9:A13`,
    });

    const rows = response.data.values;
    return rows ? rows.flat() : [];
}

module.exports = { getCalendarEvents, getNotifications };