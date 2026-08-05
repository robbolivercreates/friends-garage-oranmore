/**
 * Friends Garage — transactional email module.
 *
 * Two modes:
 *  1. SMTP configured (see .env.example) → real emails are sent via nodemailer.
 *  2. No SMTP configured → "outbox mode": every email that WOULD be sent is
 *     appended to data/outbox.json and logged to the server console, so the
 *     full flow works and is inspectable before credentials are set up.
 *
 * Nothing is ever silently dropped.
 */
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

const OUTBOX_FILE = path.join(process.cwd(), 'data', 'outbox.json');

const GARAGE_NAME = 'Friends Garage';
const GARAGE_PHONE = '+353 (0) 91 388 596';
const GARAGE_MOBILE = '+353 85 869 0104';
const GARAGE_EMAIL = 'info@friendsgarage.net';
const GARAGE_ADDRESS = 'Deerpark Industrial Estate, Oranmore, Co. Galway — Eircode H91 H31C';

interface MailPayload {
  to: string;
  subject: string;
  html: string;
  ics?: { filename: string; content: string };
}

function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function logToOutbox(payload: MailPayload) {
  try {
    let box: any[] = [];
    if (fs.existsSync(OUTBOX_FILE)) {
      box = JSON.parse(fs.readFileSync(OUTBOX_FILE, 'utf-8'));
    }
    box.unshift({
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      ics: payload.ics ? payload.ics.filename : null,
      createdAt: new Date().toISOString(),
      note: 'Not sent — SMTP not configured. Set SMTP_HOST/SMTP_USER/SMTP_PASS to enable real email.'
    });
    fs.writeFileSync(OUTBOX_FILE, JSON.stringify(box.slice(0, 200), null, 2), 'utf-8');
    console.log(`[mailer:outbox] "${payload.subject}" → ${payload.to}`);
  } catch (err) {
    console.error('[mailer] failed to write outbox', err);
  }
}

export async function sendMail(payload: MailPayload): Promise<void> {
  if (!smtpConfigured()) {
    logToOutbox(payload);
    return;
  }
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
    await transporter.sendMail({
      from: process.env.MAIL_FROM || `"${GARAGE_NAME}" <${process.env.SMTP_USER}>`,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      attachments: payload.ics
        ? [{ filename: payload.ics.filename, content: payload.ics.content, contentType: 'text/calendar' }]
        : []
    });
    console.log(`[mailer] sent "${payload.subject}" → ${payload.to}`);
  } catch (err) {
    // Never let a mail failure break a booking — fall back to the outbox.
    console.error('[mailer] SMTP send failed, falling back to outbox', err);
    logToOutbox(payload);
  }
}

/* ------------------------------------------------------------------ */
/*  Templates                                                          */
/* ------------------------------------------------------------------ */

function layout(title: string, body: string): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#F6F6F3;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:#0A0B0E;border-radius:16px 16px 0 0;padding:24px 28px;">
      <span style="color:#ffffff;font-size:18px;font-weight:800;letter-spacing:-0.5px;">
        FRIENDS<span style="color:#D5004F;">.</span>GARAGE
      </span>
      <div style="color:#8B919C;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-top:2px;">
        Oranmore • Galway
      </div>
    </div>
    <div style="background:#ffffff;padding:28px;border:1px solid #E5E5E0;border-top:none;">
      <h1 style="font-size:20px;color:#0A0B0E;margin:0 0 16px;">${title}</h1>
      ${body}
    </div>
    <div style="background:#0A0B0E;border-radius:0 0 16px 16px;padding:20px 28px;color:#8B919C;font-size:12px;line-height:1.7;">
      ${GARAGE_ADDRESS}<br/>
      ${GARAGE_PHONE} &nbsp;•&nbsp; ${GARAGE_MOBILE} &nbsp;•&nbsp; ${GARAGE_EMAIL}
    </div>
  </div>
</body></html>`;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;color:#8B919C;font-size:13px;width:130px;vertical-align:top;">${label}</td>
    <td style="padding:8px 0;color:#0A0B0E;font-size:14px;font-weight:600;">${value}</td>
  </tr>`;
}

function refChip(ref: string): string {
  return `<div style="background:#0A0B0E;border-radius:12px;padding:18px;text-align:center;margin:20px 0;">
    <div style="color:#8B919C;font-size:11px;text-transform:uppercase;letter-spacing:2px;">Reference Number</div>
    <div style="color:#D5004F;font-size:26px;font-weight:800;font-family:'Courier New',monospace;letter-spacing:3px;margin-top:4px;">${ref}</div>
  </div>`;
}

function esc(s: any): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function niceDate(d: string): string {
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-IE', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  } catch {
    return d;
  }
}

export function buildIcs(b: any): string {
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Friends Garage Oranmore//NONSGML v1.0//EN
BEGIN:VEVENT
SUMMARY:Car Service at Friends Garage (${b.serviceName})
DESCRIPTION:Appointment at Friends Garage for vehicle ${b.vehicleRegistration}. Ref: ${b.referenceNumber}
LOCATION:Deerpark Industrial Estate, Oranmore, Galway H91 H31C
DTSTART:${String(b.bookingDate).replace(/-/g, '')}T${String(b.bookingTime).replace(':', '')}00
DURATION:PT${b.durationMinutes || 60}M
END:VEVENT
END:VCALENDAR`;
}

/* ------------------------- Booking emails ------------------------- */

export async function emailBookingReceivedCustomer(b: any): Promise<void> {
  const html = layout(
    `Booking request received`,
    `<p style="font-size:14px;color:#2F333A;line-height:1.6;">Hi ${esc(b.customerName)},</p>
     <p style="font-size:14px;color:#2F333A;line-height:1.6;">
       Thank you for booking with ${GARAGE_NAME}. Your request has been received and our
       workshop team will confirm your appointment shortly — we confirm every booking personally
       during business hours (Mon–Fri, 9:00–19:00).
     </p>
     ${refChip(b.referenceNumber)}
     <table style="width:100%;border-collapse:collapse;">
       ${row('Service', esc(b.serviceName))}
       ${row('Date', niceDate(b.bookingDate))}
       ${row('Time', esc(b.bookingTime))}
       ${row('Vehicle', esc(`${b.vehicleMake} ${b.vehicleModel}`).trim() || '—')}
       ${row('Registration', esc(b.vehicleRegistration))}
     </table>
     <p style="font-size:13px;color:#8B919C;line-height:1.6;margin-top:20px;">
       Need to change something? Call us on ${GARAGE_PHONE} and quote your reference number.
     </p>`
  );
  await sendMail({
    to: b.email,
    subject: `Booking received — ${b.referenceNumber} | ${GARAGE_NAME}`,
    html,
    ics: { filename: `FriendsGarage-${b.referenceNumber}.ics`, content: buildIcs(b) }
  });
}

export async function emailBookingReceivedGarage(b: any): Promise<void> {
  const to = process.env.GARAGE_NOTIFY_EMAIL || GARAGE_EMAIL;
  const html = layout(
    `New booking request — action needed`,
    `<p style="font-size:14px;color:#2F333A;line-height:1.6;">
       A new booking is waiting for confirmation in the staff portal.
     </p>
     ${refChip(b.referenceNumber)}
     <table style="width:100%;border-collapse:collapse;">
       ${row('Customer', esc(b.customerName))}
       ${row('Phone', esc(b.phone))}
       ${row('Email', esc(b.email))}
       ${row('Prefers', esc(b.preferredContact))}
       ${row('Service', esc(b.serviceName))}
       ${row('Date / Time', `${niceDate(b.bookingDate)} at ${esc(b.bookingTime)}`)}
       ${row('Vehicle', esc(`${b.vehicleMake} ${b.vehicleModel} ${b.vehicleYear}`).trim() || '—')}
       ${row('Registration', esc(b.vehicleRegistration))}
       ${row('Notes', esc(b.problemDescription || b.customerNotes || '—'))}
     </table>`
  );
  await sendMail({
    to,
    subject: `🔧 New booking ${b.referenceNumber} — ${b.customerName} (${b.bookingDate} ${b.bookingTime})`,
    html,
    // Staff can add the job to the garage Google/Outlook calendar with one tap
    ics: { filename: `FriendsGarage-${b.referenceNumber}.ics`, content: buildIcs(b) }
  });
}

export async function emailBookingStatusCustomer(b: any): Promise<void> {
  const statusLines: Record<string, { title: string; message: string }> = {
    confirmed: {
      title: 'Your appointment is confirmed ✅',
      message: `Great news — your appointment is confirmed. Please drop your vehicle to us at the time below. A calendar invite is attached.`
    },
    rescheduled: {
      title: 'Your appointment was rescheduled',
      message: `Your appointment has been rescheduled. Please check the updated date and time below — call us if it doesn't suit.`
    },
    cancelled: {
      title: 'Your booking was cancelled',
      message: `Your booking has been cancelled. If this wasn't expected, please call us on ${GARAGE_PHONE} and we'll sort it out.`
    },
    completed: {
      title: 'Your vehicle is ready',
      message: `Your service is complete. Thank you for choosing ${GARAGE_NAME} — we appreciate your trust.`
    }
  };
  const s = statusLines[b.status] || {
    title: `Booking update: ${b.status}`,
    message: 'There is an update on your booking. Details below.'
  };
  const html = layout(
    s.title,
    `<p style="font-size:14px;color:#2F333A;line-height:1.6;">Hi ${esc(b.customerName)},</p>
     <p style="font-size:14px;color:#2F333A;line-height:1.6;">${s.message}</p>
     ${refChip(b.referenceNumber)}
     <table style="width:100%;border-collapse:collapse;">
       ${row('Service', esc(b.serviceName))}
       ${row('Date', niceDate(b.bookingDate))}
       ${row('Time', esc(b.bookingTime))}
       ${row('Status', esc(b.status).toUpperCase())}
     </table>`
  );
  await sendMail({
    to: b.email,
    subject: `${s.title.replace(/[✅]/gu, '').trim()} — ${b.referenceNumber} | ${GARAGE_NAME}`,
    html,
    ics: b.status === 'confirmed'
      ? { filename: `FriendsGarage-${b.referenceNumber}.ics`, content: buildIcs(b) }
      : undefined
  });
}

/* ------------------------- Estimate emails ------------------------ */

export async function emailEstimateReceivedCustomer(e: any): Promise<void> {
  const html = layout(
    'Estimate request received',
    `<p style="font-size:14px;color:#2F333A;line-height:1.6;">Hi ${esc(e.name)},</p>
     <p style="font-size:14px;color:#2F333A;line-height:1.6;">
       We've received your estimate request for <strong>${esc(e.serviceRequired)}</strong>.
       Our technicians will review it and come back to you with a transparent quote —
       usually within one business day.
     </p>
     ${refChip(e.referenceNumber)}
     <table style="width:100%;border-collapse:collapse;">
       ${row('Service', esc(e.serviceRequired))}
       ${row('Vehicle', esc(`${e.vehicleMake} ${e.vehicleModel}`).trim() || '—')}
       ${row('Registration', esc(e.vehicleRegistration))}
     </table>`
  );
  await sendMail({ to: e.email, subject: `Estimate request received — ${e.referenceNumber} | ${GARAGE_NAME}`, html });
}

export async function emailEstimateReceivedGarage(e: any): Promise<void> {
  const to = process.env.GARAGE_NOTIFY_EMAIL || GARAGE_EMAIL;
  const html = layout(
    'New estimate request',
    `${refChip(e.referenceNumber)}
     <table style="width:100%;border-collapse:collapse;">
       ${row('Customer', esc(e.name))}
       ${row('Phone', esc(e.phone))}
       ${row('Email', esc(e.email))}
       ${row('Service', esc(e.serviceRequired))}
       ${row('Vehicle', esc(`${e.vehicleMake} ${e.vehicleModel} ${e.vehicleYear}`).trim() || '—')}
       ${row('Registration', esc(e.vehicleRegistration))}
       ${row('Description', esc(e.problemDescription || '—'))}
     </table>`
  );
  await sendMail({ to, subject: `📋 New estimate ${e.referenceNumber} — ${e.name} (${e.serviceRequired})`, html });
}

/* --------------------- Callback & roadside ------------------------ */

export async function emailCallbackGarage(c: any): Promise<void> {
  const to = process.env.GARAGE_NOTIFY_EMAIL || GARAGE_EMAIL;
  const html = layout(
    'Callback requested',
    `<table style="width:100%;border-collapse:collapse;">
       ${row('Customer', esc(c.name))}
       ${row('Phone', esc(c.phone))}
       ${row('Best time', esc(c.preferredContactTime))}
       ${row('Service', esc(c.serviceNeeded))}
       ${row('Registration', esc(c.vehicleRegistration || '—'))}
       ${row('Message', esc(c.message || '—'))}
     </table>`
  );
  await sendMail({ to, subject: `📞 Callback request — ${c.name} (${c.phone})`, html });
}

export async function emailRoadsideGarage(r: any): Promise<void> {
  const to = process.env.GARAGE_NOTIFY_EMAIL || GARAGE_EMAIL;
  const html = layout(
    '🚨 EMERGENCY roadside dispatch',
    `${refChip(r.referenceNumber)}
     <table style="width:100%;border-collapse:collapse;">
       ${row('Customer', esc(r.name))}
       ${row('Phone', esc(r.phone))}
       ${row('Location', esc(r.currentLocation))}
       ${row('Problem', esc(r.problemType))}
       ${row('Vehicle', esc(r.vehicleMakeModel || '—'))}
       ${row('Registration', esc(r.vehicleRegistration))}
       ${row('Can move?', r.vehicleCanMove ? 'Yes' : 'No — immobilised')}
       ${row('Notes', esc(r.notes || '—'))}
     </table>`
  );
  await sendMail({ to, subject: `🚨 ROADSIDE ${r.referenceNumber} — ${r.name} at ${r.currentLocation}`, html });
}

export async function emailRoadsideCustomer(r: any): Promise<void> {
  if (!r.email) return;
  const html = layout(
    'Help is on the way',
    `<p style="font-size:14px;color:#2F333A;line-height:1.6;">Hi ${esc(r.name)},</p>
     <p style="font-size:14px;color:#2F333A;line-height:1.6;">
       Your roadside request has been dispatched. If your situation changes,
       call us immediately on <strong>${GARAGE_MOBILE}</strong>.
     </p>
     ${refChip(r.referenceNumber)}`
  );
  await sendMail({ to: r.email, subject: `Roadside dispatch ${r.referenceNumber} | ${GARAGE_NAME}`, html });
}
