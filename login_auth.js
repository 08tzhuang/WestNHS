// login_auth.js
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const SPREADSHEET_ID = '1UsqyeMhIihMWYK9JWfIoGK-TX7kU1tk-r0yj3kP01_8'; // Replace with your sheet ID
const RANGE = 'People!A2:J'; // Adjust as needed

function getCredentials() {
  return JSON.parse(process.env.GOOGLE_CREDENTIALS);
}

async function getSheetData() {
  const credentials = getCredentials();
  const auth = new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
  });

  return res.data.values || [];
}

module.exports = getSheetData;