import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const VALID_SUBJECTS = ["bug", "suggestion", "question", "partnership", "other"] as const;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const { name, email, subject, message } = await req.json();

  if (!name || !email || !subject || !message) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (typeof name !== "string" || name.trim().length < 2 || name.length > 100) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }
  if (typeof email !== "string" || !EMAIL_REGEX.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (!VALID_SUBJECTS.includes(subject)) {
    return NextResponse.json({ error: "Invalid subject" }, { status: 400 });
  }
  if (typeof message !== "string" || message.trim().length < 10 || message.length > 5000) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
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

  const safeName    = escapeHtml(name.trim());
  const safeEmail   = escapeHtml(email.trim());
  const safeMessage = escapeHtml(message.trim());
  const safeSubject = subjectLabels[subject];

  await transporter.sendMail({
    from: `"Ultimate Playground Contact" <${process.env.GMAIL_USER}>`,
    to: process.env.GMAIL_USER,
    replyTo: email.trim(),
    subject: `[Contact] ${safeSubject} — ${name.trim()}`,
    text: `Name: ${name.trim()}\nEmail: ${email.trim()}\nSubject: ${safeSubject}\n\n${message.trim()}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#7c3aed">New message — Ultimate Playground</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          <tr><td style="padding:6px 0;color:#888;width:80px">Name</td><td style="padding:6px 0;font-weight:600">${safeName}</td></tr>
          <tr><td style="padding:6px 0;color:#888">Email</td><td style="padding:6px 0"><a href="mailto:${safeEmail}">${safeEmail}</a></td></tr>
          <tr><td style="padding:6px 0;color:#888">Subject</td><td style="padding:6px 0">${safeSubject}</td></tr>
        </table>
        <div style="background:#f5f5f5;border-radius:8px;padding:16px;white-space:pre-wrap;line-height:1.6">${safeMessage}</div>
        <p style="margin-top:24px;color:#aaa;font-size:12px">Reply directly to this email to respond to ${safeName}.</p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
