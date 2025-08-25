const { google } = require('googleapis');
const path = require('path');

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, 'credentials.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

async function getSheetData() {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const spreadsheetId = '1UsqyeMhIihMWYK9JWfIoGK-TX7kU1tk-r0yj3kP01_8'; // from sheet URL
  const range = 'People!A2:J'; // Adjust if needed

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  return response.data.values; // [[ID, FName, LastName], ...]
}

module.exports = getSheetData;