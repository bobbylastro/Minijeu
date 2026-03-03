import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  const { name, email, subject, message } = await req.json();

  if (!name || !email || !subject || !message) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const subjectLabels: Record<string, string> = {
    bug: "Bug report",
    suggestion: "Suggestion",
    question: "Question",
    partnership: "Partnership",
    other: "Other",
  };

  await transporter.sendMail({
    from: `"Ultimate Playground Contact" <${process.env.GMAIL_USER}>`,
    to: process.env.GMAIL_USER,
    replyTo: email,
    subject: `[Contact] ${subjectLabels[subject] ?? subject} — ${name}`,
    text: `Name: ${name}\nEmail: ${email}\nSubject: ${subjectLabels[subject] ?? subject}\n\n${message}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#7c3aed">New message — Ultimate Playground</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          <tr><td style="padding:6px 0;color:#888;width:80px">Name</td><td style="padding:6px 0;font-weight:600">${name}</td></tr>
          <tr><td style="padding:6px 0;color:#888">Email</td><td style="padding:6px 0"><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding:6px 0;color:#888">Subject</td><td style="padding:6px 0">${subjectLabels[subject] ?? subject}</td></tr>
        </table>
        <div style="background:#f5f5f5;border-radius:8px;padding:16px;white-space:pre-wrap;line-height:1.6">${message}</div>
        <p style="margin-top:24px;color:#aaa;font-size:12px">Reply directly to this email to respond to ${name}.</p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
