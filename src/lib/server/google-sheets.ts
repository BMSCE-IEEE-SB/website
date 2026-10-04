import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';

export async function appendRegistrationToSheet(data: {
  fullName: string;
  email: string;
  phone: string;
  usn: string;
  department: string;
  year: string;
  orderReference: string;
  amount: number;
  tshirtSize: string | null;
  chapters: string;
}) {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!serviceAccountEmail || !privateKey || !sheetId) {
    console.warn('Google Sheets environment variables are missing. Skipping sync.');
    return;
  }

  try {
    const auth = new JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(sheetId, auth);
    await doc.loadInfo();

    const sheet = doc.sheetsByIndex[0];

    // Check if headers exist, if not, set them
    try {
      await sheet.loadHeaderRow();
    } catch {
      await sheet.setHeaderRow([
        'First Name',
        'Last Name',
        'Email',
        'Phone',
        'USN',
        'Department',
        'Year of Study',
        'Order Reference',
        'Amount',
        'T-Shirt Size',
        'Chapters',
        'Timestamp'
      ]);
    }

    await sheet.addRow({
      'First Name': data.fullName.trim().split(/\s+/)[0] || '',
      'Last Name': data.fullName.trim().split(/\s+/).length > 1 ? data.fullName.trim().split(/\s+/).slice(1).join(' ') : '',
      'Email': data.email,
      'Phone': data.phone || 'N/A',
      'USN': data.usn,
      'Department': data.department,
      'Year of Study': data.year || 'N/A',
      'Order Reference': data.orderReference,
      'Amount': data.amount,
      'T-Shirt Size': data.tshirtSize || 'N/A',
      'Chapters': data.chapters,
      'Timestamp': new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to append row to Google Sheet:', error);
  }
}
