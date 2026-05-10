import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, payload } = body;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'madjes2519@gmail.com',
        pass: 'ahon yrkv ujob udtz'
      }
    });

    let subject = "FinTrack Alert";
    let text = "You have a new alert.";

    if (type === 'transaction_scanned') {
      subject = "New Transaction Scanned - FinTrack";
      text = `A new transaction has been recorded via scanner.\n\nDetails:\nMerchant/Description: ${payload.description}\nAmount: ₹${payload.amount}\nCategory: ${payload.category}`;
    } else if (type === 'high_spending') {
      subject = "High Spending Alert - FinTrack";
      text = `Alert: High spending detected.\n\nDetails:\n${payload.description} for ₹${payload.amount}.`;
    }

    await transporter.sendMail({
      from: '"FinTrack Alerts" <madjes2519@gmail.com>',
      to: "madjes2519@gmail.com",
      subject: subject,
      text: text,
      html: `<h3>${subject}</h3><p>${text.replace(/\n/g, '<br/>')}</p>`
    });

    return NextResponse.json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json({ success: false, error: "Failed to send email" }, { status: 500 });
  }
}
