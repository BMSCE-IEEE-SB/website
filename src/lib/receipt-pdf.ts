import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

export interface ReceiptData {
  studentName: string;
  amount: number | string;
  receiptNumber: string;
  dateStr?: string;
  chapters?: string[];
  treasurerName?: string;
  treasurerRole?: string;
  treasurerPhone?: string;
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function formatReceiptDate(d: Date = new Date()): string {
  const day = getOrdinal(d.getDate());
  const month = d.toLocaleString('en-US', { month: 'long' });
  const year = d.getFullYear();
  return `${day} ${month}, ${year}`;
}

export async function generateReceiptPdf(data: ReceiptData): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const width = 842;
  const height = 480;
  const page = doc.addPage([width, height]);

  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Background
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(0.975, 0.965, 0.945), // soft parchment ivory
  });

  // Subtle border card
  page.drawRectangle({
    x: 18,
    y: 18,
    width: width - 36,
    height: height - 36,
    borderWidth: 1.2,
    borderColor: rgb(0.86, 0.83, 0.77),
    color: rgb(0.99, 0.985, 0.97),
  });

  // Inner fine border accent
  page.drawRectangle({
    x: 23,
    y: 23,
    width: width - 46,
    height: height - 46,
    borderWidth: 0.6,
    borderColor: rgb(0.92, 0.90, 0.85),
  });

  const cwd = process.cwd();

  // 1. Embed Logos
  try {
    const logoPath = path.join(cwd, 'public/brand/logo.png');
    if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath);
      const logoImg = await doc.embedPng(logoBytes);
      const logoDims = logoImg.scale(0.24);
      page.drawImage(logoImg, {
        x: 42,
        y: height - 42 - logoDims.height,
        width: logoDims.width,
        height: logoDims.height,
      });
    }
  } catch (err) {
    console.error('Error embedding logo:', err);
  }

  try {
    const emblemPath = path.join(cwd, 'public/brand/emblem.png');
    if (fs.existsSync(emblemPath)) {
      const emblemBytes = fs.readFileSync(emblemPath);
      const emblemImg = await doc.embedPng(emblemBytes);
      const emblemDims = emblemImg.scale(0.24);
      page.drawImage(emblemImg, {
        x: width - 42 - emblemDims.width,
        y: height - 42 - emblemDims.height,
        width: emblemDims.width,
        height: emblemDims.height,
      });
    }
  } catch (err) {
    console.error('Error embedding emblem:', err);
  }

  // 2. Header Text
  const title = 'BMSCE IEEE Student Branch';
  const titleWidth = fontBold.widthOfTextAtSize(title, 21);
  page.drawText(title, {
    x: (width - titleWidth) / 2,
    y: height - 58,
    size: 21,
    font: fontBold,
    color: rgb(0.04, 0.1, 0.22),
  });

  const address = 'BMSCE, Bull Temple Road, Bengaluru - 19, Karnataka';
  const addrWidth = fontRegular.widthOfTextAtSize(address, 13);
  page.drawText(address, {
    x: (width - addrWidth) / 2,
    y: height - 78,
    size: 13,
    font: fontRegular,
    color: rgb(0.18, 0.22, 0.28),
  });

  const emailText = 'Email: ieee.sb@bmsce.ac.in';
  const emailWidth = fontRegular.widthOfTextAtSize(emailText, 13);
  page.drawText(emailText, {
    x: (width - emailWidth) / 2,
    y: height - 98,
    size: 13,
    font: fontRegular,
    color: rgb(0.18, 0.22, 0.28),
  });

  // 3. Date
  const dateStr = data.dateStr || formatReceiptDate();
  page.drawText('Date: ', {
    x: 55,
    y: height - 142,
    size: 14,
    font: fontBold,
    color: rgb(0.08, 0.08, 0.08),
  });
  page.drawText(dateStr, {
    x: 55 + fontBold.widthOfTextAtSize('Date: ', 14),
    y: height - 142,
    size: 14,
    font: fontRegular,
    color: rgb(0.08, 0.08, 0.08),
  });

  // 4. Acknowledgement subtext
  const ackText = 'Your payment for the IEEE Membership has been successfully received and your details are as mentioned below.';
  page.drawText(ackText, {
    x: 55,
    y: height - 176,
    size: 13.5,
    font: fontRegular,
    color: rgb(0.15, 0.15, 0.15),
  });

  // 5. Details Section
  let curY = height - 216;
  const lineSpacing = 30;

  // Name
  const studentName = (data.studentName || 'MEMBER').toUpperCase();
  page.drawText('Name: ', { x: 55, y: curY, size: 14, font: fontBold, color: rgb(0.08, 0.08, 0.08) });
  page.drawText(studentName, {
    x: 55 + fontBold.widthOfTextAtSize('Name: ', 14),
    y: curY,
    size: 14,
    font: fontRegular,
    color: rgb(0.08, 0.08, 0.08),
  });

  // Amount
  curY -= lineSpacing;
  page.drawText('Amount: ', { x: 55, y: curY, size: 14, font: fontBold, color: rgb(0.08, 0.08, 0.08) });
  const amtX = 55 + fontBold.widthOfTextAtSize('Amount: ', 14);

  // Draw Indian Rupee SVG Path symbol (vector-crisp)
  const rupeePath = 'M 0 10.5 L 9 10.5 M 0 7 L 8 7 M 1.6 10.5 L 1.6 3.5 C 6 3.5 6 10.5 1.6 10.5 M 3.5 5.5 L 8.5 0';
  page.drawSvgPath(rupeePath, {
    x: amtX,
    y: curY + 1.5,
    borderWidth: 1.25,
    borderColor: rgb(0.08, 0.08, 0.08),
  });

  const numericAmt = typeof data.amount === 'number' ? data.amount : Number(String(data.amount).replace(/[^0-9.]/g, ''));
  const formattedAmt = `${Number.isFinite(numericAmt) ? numericAmt.toLocaleString('en-IN') : data.amount}.00/-`;
  page.drawText(formattedAmt, {
    x: amtX + 13,
    y: curY,
    size: 14,
    font: fontRegular,
    color: rgb(0.08, 0.08, 0.08),
  });

  // Receipt Number
  curY -= lineSpacing;
  page.drawText('Receipt Number : ', { x: 55, y: curY, size: 14, font: fontBold, color: rgb(0.08, 0.08, 0.08) });
  page.drawText(data.receiptNumber, {
    x: 55 + fontBold.widthOfTextAtSize('Receipt Number : ', 14),
    y: curY,
    size: 14,
    font: fontRegular,
    color: rgb(0.08, 0.08, 0.08),
  });

  // Combination
  curY -= lineSpacing;
  const comboLabel = 'Combination: ';
  page.drawText(comboLabel, { x: 55, y: curY, size: 14, font: fontBold, color: rgb(0.08, 0.08, 0.08) });

  const chapters = data.chapters && data.chapters.length > 0 ? data.chapters : [];
  const comboText = chapters.length > 0
    ? `IEEE Base Membership + ${chapters.join(' + ')}`
    : 'IEEE Base Membership';

  // Wrap combination text across lines if needed (max width ~500 to leave room for signature block)
  const maxComboWidth = 475;
  const words = comboText.split(' ');
  let currentLine = '';
  let lineY = curY;
  const labelWidth = fontBold.widthOfTextAtSize(comboLabel, 14);

  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
    const testWidth = fontRegular.widthOfTextAtSize(testLine, 13);
    const startX = lineY === curY ? 55 + labelWidth : 55;

    if (startX + testWidth > 55 + maxComboWidth && currentLine) {
      page.drawText(currentLine, { x: startX, y: lineY, size: 13, font: fontRegular, color: rgb(0.08, 0.08, 0.08) });
      lineY -= 20;
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    const startX = lineY === curY ? 55 + labelWidth : 55;
    page.drawText(currentLine, { x: startX, y: lineY, size: 13, font: fontRegular, color: rgb(0.08, 0.08, 0.08) });
  }

  // 6. Signature & Sign-off Block (Bottom Right)
  const sigX = 590;
  let sigY = 160;

  let sigDrawn = false;
  try {
    const sigBytes = fs.readFileSync(path.join(process.cwd(), 'public/brand/signature.png'));
    const sigImg = await doc.embedPng(sigBytes);
    const maxSigW = 140;
    const maxSigH = 50;
    const scale = Math.min(maxSigW / sigImg.width, maxSigH / sigImg.height, 0.5);
    const sW = sigImg.width * scale;
    const sH = sigImg.height * scale;
    page.drawImage(sigImg, {
      x: sigX + (180 - sW) / 2,
      y: sigY - sH + 15,
      width: sW,
      height: sH,
    });
    sigDrawn = true;
  } catch {
    // A signed image is optional at build time; no user-controlled path is read.
  }

  if (!sigDrawn) {
    // Leave clean space for physical or future digital stamp
    sigY -= 15;
  }

  const treasurerName = data.treasurerName || 'Neha Ramiah';
  const treasurerRole = data.treasurerRole || 'Treasurer and MDC';
  const branchName = 'BMSCE IEEE SB';
  const treasurerPhone = data.treasurerPhone || '+91 6385525264';

  const tNameW = fontRegular.widthOfTextAtSize(treasurerName, 14);
  const tRoleW = fontBold.widthOfTextAtSize(treasurerRole, 12);
  const tBranchW = fontBold.widthOfTextAtSize(branchName, 12);
  const tPhoneW = fontBold.widthOfTextAtSize(`Phone: ${treasurerPhone}`, 12);

  const blockCenterX = sigX + 90;

  page.drawText(treasurerName, {
    x: blockCenterX - tNameW / 2,
    y: sigY - 24,
    size: 14,
    font: fontRegular,
    color: rgb(0.08, 0.08, 0.08),
  });

  page.drawText(treasurerRole, {
    x: blockCenterX - tRoleW / 2,
    y: sigY - 42,
    size: 12,
    font: fontBold,
    color: rgb(0.08, 0.08, 0.08),
  });

  page.drawText(branchName, {
    x: blockCenterX - tBranchW / 2,
    y: sigY - 58,
    size: 12,
    font: fontBold,
    color: rgb(0.08, 0.08, 0.08),
  });

  page.drawText(`Phone: ${treasurerPhone}`, {
    x: blockCenterX - tPhoneW / 2,
    y: sigY - 74,
    size: 12,
    font: fontBold,
    color: rgb(0.08, 0.08, 0.08),
  });

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}
