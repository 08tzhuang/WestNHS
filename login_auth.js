const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const spreadsheetId = '1UsqyeMhIihMWYK9JWfIoGK-TX7kU1tk-r0yj3kP01_8'; // from sheet URL
const range = 'People!A2:J'; // Adjust if needed

// Lazy-load credentials from environment variable
function getCredentials() {
  const credsPath = path.join(__dirname, 'credentials.json');

  if (!fs.existsSync(credsPath)) {
    fs.writeFileSync(credsPath, process.env.GOOGLE_CREDENTIALS);
  }

  return JSON.parse(fs.readFileSync(credsPath, 'utf8'));
}

async function getSheetData() {
  const credentials = getCredentials();

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  return response.data.values; // [[ID, FName, LastName], ...]
}

module.exports = getSheetData;