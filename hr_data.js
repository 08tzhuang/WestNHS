// hr_data.js
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SPREADSHEET_ID = '1UsqyeMhIihMWYK9JWfIoGK-TX7kU1tk-r0yj3kP01_8';
const SHEET_NAME = 'Hour Log'; 
const PEOPLE_SHEET = 'People';

function getCredentials() {
  return JSON.parse(process.env.GOOGLE_CREDENTIALS);
}

let sheets;

async function initSheets() {
  if (!sheets) {
    const credentials = getCredentials();
    const auth = new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
    const client = await auth.getClient();
    sheets = google.sheets({ version: 'v4', auth: client });
  }
}

async function getUserHours(userId) {
  await initSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2:E`,
  });
  const rows = res.data.values || [];

  const entries = rows
    .filter(row => row[0] === userId)
    .map(row => ({
      id: row[0],
      date: row[1],
      hours: parseFloat(row[2]),
      description: row[3],
      fullName: row[4],
    }));

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
  return { entries, totalHours };
}

// 🔹 Now accepts peopleRow
async function updatePeopleSheet(peopleRow, totalHours) {
  await initSheets();

  const range = `${PEOPLE_SHEET}!D${peopleRow}`; 
  // no +2, because peopleRow is already the actual sheet row index

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [[totalHours]] },
  });
}

// 🔹 Pass peopleRow into here
async function addUserHour(userId, date, hours, description, firstName, lastName, peopleRow) {
  await initSheets();
  const fullName = `${firstName} ${lastName}`;
  const row = [userId, date, hours, description, fullName];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:E`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [row] },
  });

  const { totalHours } = await getUserHours(userId);
  await updatePeopleSheet(peopleRow, totalHours);
}

async function deleteUserHour(userId, indexToDelete, peopleRow) {
  await initSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2:E`,
  });
  const rows = res.data.values || [];

  const userRowsWithSheetIndex = [];
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === userId) {
      userRowsWithSheetIndex.push({ row: rows[i], sheetRowNumber: i + 2 });
    }
  }

  if (indexToDelete < 0 || indexToDelete >= userRowsWithSheetIndex.length) {
    throw new Error(`Index out of bounds. Index: ${indexToDelete}, Entries found: ${userRowsWithSheetIndex.length}`);
  }

  const sheetRowToDelete = userRowsWithSheetIndex[indexToDelete].sheetRowNumber;
  const rangeToClear = `${SHEET_NAME}!A${sheetRowToDelete}:E${sheetRowToDelete}`;

  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: rangeToClear,
  });

  const { totalHours } = await getUserHours(userId);
  await updatePeopleSheet(peopleRow, totalHours);
}

module.exports = { getUserHours, addUserHour, deleteUserHour };
