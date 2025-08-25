// info_data.js
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const SPREADSHEET_ID = '1UsqyeMhIihMWYK9JWfIoGK-TX7kU1tk-r0yj3kP01_8';
const SHEET_NAME = 'Info'; // Adjust if your sheet has a different name

function getCredentials() {
  return JSON.parse(process.env.GOOGLE_CREDENTIALS);
}

async function getSheetsClient() {
  const credentials = getCredentials();
  const auth = new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
  const client = await auth.getClient();
  return google.sheets({ version: 'v4', auth: client });
}

async function getCalendarEvents() {
  const sheets = await getSheetsClient();

  // Image
  const imageRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!B2`,
  });
  let imageUrl = imageRes.data.values?.[0]?.[0] || null;
  if (imageUrl && imageUrl.includes('drive.google.com')) {
    const match = imageUrl.match(/\/d\/(.*?)\//);
    if (match && match[1]) {
      imageUrl = `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
  }

  // Events (bullets)
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2:A6`, // Adjust to where your events are
  });
  const rows = response.data.values;
  return { imageUrl, events: rows ? rows.flat() : [] };
}

async function getNotifications() {
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A9:A13`,
  });
  const rows = response.data.values;
  return rows ? rows.flat() : [];
}

module.exports = { getCalendarEvents, getNotifications };