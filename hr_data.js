const { google } = require('googleapis');
const path = require('path');

// Load Google service account credentials
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, 'credentials.json'), // Replace with your actual path
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheetName = 'Hour Log'; // Change if your sheet is named differently
const spreadsheetId = '1UsqyeMhIihMWYK9JWfIoGK-TX7kU1tk-r0yj3kP01_8'; // Replace with your Google Sheet ID

let sheets;

// Initialize sheets client
async function initSheets() {
  if (!sheets) {
    const client = await auth.getClient();
    sheets = google.sheets({ version: 'v4', auth: client });
  }
}

// Fetch user hours from the sheet
async function getUserHours(userId) {
  await initSheets();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A2:E`,
  });

  const rows = res.data.values || [];

  const entries = rows
    .filter(row => row[0] === userId)
    .map(row => ({
      id: row[0],
      date: row[1],
      hours: parseFloat(row[2]),
      description: row[3],
      fullName: row[4]
    }));

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);

  return { entries, totalHours };
}

// Add a user hour entry to the sheet
async function addUserHour(userId, date, hours, description, firstName, lastName) {
  await initSheets();

  const fullName = `${firstName} ${lastName}`;
  const row = [userId, date, hours, description, fullName];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:E`,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [row]
    }
  });
}

// Delete a user's hour entry by index (row number in filtered list)
async function deleteUserHour(userId, indexToDelete) {
    await initSheets();
  
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A2:E`, // adjust range if needed
    });
  
    const rows = res.data.values || [];
  
    const userRowsWithSheetIndex = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const sheetRowNumber = i + 2; // because A2:E is offset by 1 for header
      if (row[0] === userId) {
        userRowsWithSheetIndex.push({ row, sheetRowNumber });
      }
    }
  
    // Validate index
    if (indexToDelete < 0 || indexToDelete >= userRowsWithSheetIndex.length) {
      throw new Error(`Index out of bounds. Index: ${indexToDelete}, Entries found: ${userRowsWithSheetIndex.length}`);
    }
  
    const sheetRowToDelete = userRowsWithSheetIndex[indexToDelete].sheetRowNumber;
    const rangeToClear = `${sheetName}!A${sheetRowToDelete}:E${sheetRowToDelete}`;
  
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: rangeToClear,
    });
}  

module.exports = {
  getUserHours,
  addUserHour,
  deleteUserHour,
};