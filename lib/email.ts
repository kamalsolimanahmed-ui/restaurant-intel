import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(email: string, restaurantName: string, trialEndsAt: Date) {
  try {
    const trialEndDate = trialEndsAt.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    await resend.emails.send({
      from: 'Restaurant Intel <onboarding@restaurantintel.app>',
      to: email,
      subject: 'Welcome to Restaurant Intel! Your 14-day trial starts now',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #16a34a; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Restaurant Intel!</h1>
            </div>
            <div class="content">
              <h2>Hi there,</h2>
              <p>Welcome to Restaurant Intel! Your 14-day free trial for <strong>${restaurantName}</strong> has started.</p>
              
              <h3>🎯 What you can do during your trial:</h3>
              <ul>
                <li>Upload sales, labor, and expense data</li>
                <li>Get your restaurant's health score</li>
                <li>Receive actionable insights to save money</li>
                <li>Generate detailed PDF reports</li>
              </ul>
              
              <p><strong>Your trial ends on: ${trialEndDate}</strong></p>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">
                  Start Analyzing Your Restaurant
                </a>
              </p>
              
              <p>Need help getting started? Check out our <a href="${process.env.NEXT_PUBLIC_APP_URL}/help">getting started guide</a>.</p>
              
              <div class="footer">
                <p>Best regards,<br>The Restaurant Intel Team</p>
                <p>Questions? Reply to this email or contact support@restaurantintel.app</p>
                <p>© ${new Date().getFullYear()} Restaurant Intel. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Welcome to Restaurant Intel!

Your 14-day free trial for ${restaurantName} has started.

What you can do during your trial:
- Upload sales, labor, and expense data
- Get your restaurant's health score
- Receive actionable insights to save money
- Generate detailed PDF reports

Your trial ends on: ${trialEndDate}

Start analyzing your restaurant: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

Need help getting started? Check out our getting started guide: ${process.env.NEXT_PUBLIC_APP_URL}/help

Best regards,
The Restaurant Intel Team

Questions? Reply to this email or contact support@restaurantintel.app
© ${new Date().getFullYear()} Restaurant Intel. All rights reserved.`,
    });

    console.log(`✅ Welcome email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    return { success: false, error };
  }
}

export async function sendTrialReminderEmail(email: string, restaurantName: string, trialEndsAt: Date) {
  try {
    const trialEndDate = trialEndsAt.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    await resend.emails.send({
      from: 'Restaurant Intel <onboarding@restaurantintel.app>',
      to: email,
      subject: 'Your Restaurant Intel trial ends in 1 day',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Trial Ending Soon</h1>
            </div>
            <div class="content">
              <div class="warning">
                <p><strong>Your Restaurant Intel trial for ${restaurantName} ends tomorrow!</strong></p>
              </div>
              
              <p>Hi there,</p>
              <p>This is a friendly reminder that your free trial for <strong>${restaurantName}</strong> ends on <strong>${trialEndDate}</strong>.</p>
              
              <h3>🔒 What happens after your trial ends:</h3>
              <ul>
                <li>You won't be able to access your dashboard</li>
                <li>You won't be able to upload new files</li>
                <li>You won't be able to generate new reports</li>
              </ul>
              
              <h3>💡 Continue using Restaurant Intel:</h3>
              <p>Upgrade to Pro for just <strong>$15/month</strong> and keep:</p>
              <ul>
                <li>Unlimited file uploads</li>
                <li>Monthly health score tracking</li>
                <li>Detailed PDF reports</li>
                <li>Priority support</li>
              </ul>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/upgrade" class="button">
                  Upgrade to Pro - $15/month
                </a>
              </p>
              
              <p>Questions about pricing? <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing">View our pricing page</a>.</p>
              
              <div class="footer">
                <p>Best regards,<br>The Restaurant Intel Team</p>
                <p>© ${new Date().getFullYear()} Restaurant Intel. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `⏰ Trial Ending Soon

Your Restaurant Intel trial for ${restaurantName} ends tomorrow!

Hi there,
This is a friendly reminder that your free trial for ${restaurantName} ends on ${trialEndDate}.

🔒 What happens after your trial ends:
- You won't be able to access your dashboard
- You won't be able to upload new files
- You won't be able to generate new reports

💡 Continue using Restaurant Intel:
Upgrade to Pro for just $15/month and keep:
- Unlimited file uploads
- Monthly health score tracking
- Detailed PDF reports
- Priority support

Upgrade now: ${process.env.NEXT_PUBLIC_APP_URL}/upgrade

Questions about pricing? View our pricing page: ${process.env.NEXT_PUBLIC_APP_URL}/pricing

Best regards,
The Restaurant Intel Team
© ${new Date().getFullYear()} Restaurant Intel. All rights reserved.`,
    });

    console.log(`✅ Trial reminder email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send trial reminder email:', error);
    return { success: false, error };
  }
}

export async function sendTrialExpiredEmail(email: string, restaurantName: string) {
  try {
    await resend.emails.send({
      from: 'Restaurant Intel <onboarding@restaurantintel.app>',
      to: email,
      subject: 'Your Restaurant Intel trial has ended',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ef4444; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
            .warning { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔒 Trial Ended</h1>
            </div>
            <div class="content">
              <div class="warning">
                <p><strong>Your Restaurant Intel trial for ${restaurantName} has ended.</strong></p>
              </div>
              
              <p>Hi there,</p>
              <p>Your free trial for <strong>${restaurantName}</strong> has now ended. You no longer have access to your dashboard and reports.</p>
              
              <h3>🚫 What you've lost access to:</h3>
              <ul>
                <li>Dashboard and health score</li>
                <li>File uploads and analysis</li>
                <li>PDF report generation</li>
                <li>Actionable insights</li>
              </ul>
              
              <h3>🎯 Get back your access:</h3>
              <p>Upgrade to Pro for just <strong>$15/month</strong> and immediately regain access to:</p>
              <ul>
                <li>All your previous data and reports</li>
                <li>Unlimited monthly uploads</li>
                <li>Continuous health monitoring</li>
                <li>Priority email support</li>
              </ul>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/upgrade" class="button">
                  Upgrade Now - $15/month
                </a>
              </p>
              
              <p><strong>Special offer:</strong> Upgrade within 7 days and get your first month for $10!</p>
              
              <div class="footer">
                <p>Best regards,<br>The Restaurant Intel Team</p>
                <p>Questions? Reply to this email or contact support@restaurantintel.app</p>
                <p>© ${new Date().getFullYear()} Restaurant Intel. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `🔒 Trial Ended

Your Restaurant Intel trial for ${restaurantName} has ended.

Hi there,
Your free trial for ${restaurantName} has now ended. You no longer have access to your dashboard and reports.

🚫 What you've lost access to:
- Dashboard and health score
- File uploads and analysis
- PDF report generation
- Actionable insights

🎯 Get back your access:
Upgrade to Pro for just $15/month and immediately regain access to:
- All your previous data and reports
- Unlimited monthly uploads
- Continuous health monitoring
- Priority email support

Upgrade now: ${process.env.NEXT_PUBLIC_APP_URL}/upgrade

Special offer: Upgrade within 7 days and get your first month for $10!

Best regards,
The Restaurant Intel Team

Questions? Reply to this email or contact support@restaurantintel.app
© ${new Date().getFullYear()} Restaurant Intel. All rights reserved.`,
    });

    console.log(`✅ Trial expired email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send trial expired email:', error);
    return { success: false, error };
  }
}

// Test email function
export async function sendTestEmail(email: string) {
  try {
    await resend.emails.send({
      from: 'Restaurant Intel <onboarding@restaurantintel.app>',
      to: email,
      subject: 'Test Email from Restaurant Intel',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Test Email Successful</h1>
            </div>
            <div class="content">
              <p>This is a test email from Restaurant Intel.</p>
              <p>If you're receiving this, your email configuration is working correctly!</p>
              <p>Timestamp: ${new Date().toISOString()}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Test Email Successful

This is a test email from Restaurant Intel.

If you're receiving this, your email configuration is working correctly!

Timestamp: ${new Date().toISOString()}`,
    });

    console.log(`✅ Test email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send test email:', error);
    return { success: false, error };
  }
}