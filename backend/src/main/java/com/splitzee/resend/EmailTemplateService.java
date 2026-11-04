package com.splitzee.resend;

import org.springframework.stereotype.Service;

@Service
public class EmailTemplateService {

    /**
     * Builds a responsive, beautifully styled HTML email for account activation.
     */
    public String buildActivationEmail(String name, String verifyUrl) {
        String greetingName = (name != null && !name.trim().isEmpty()) ? escapeHtml(name.trim()) : "there";
        String safeVerifyUrl = escapeHtml(verifyUrl);

        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Activate Your Splitzee Account</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1f2937;">
              <table role="presentation" width="100%%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; padding: 40px 16px;">
                <tr>
                  <td align="center">
                    <table role="presentation" width="100%%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06); border: 1px solid #e5e7eb;">
                      <!-- Header -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #f59e0b 0%%, #ea580c 100%%); background-color: #ea580c; padding: 32px 30px; text-align: center;">
                          <h1 style="margin: 0; font-size: 30px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Splitzee</h1>
                          <p style="margin: 6px 0 0; font-size: 14px; color: #fef3c7; font-weight: 500;">Effortless Group Expense Sharing</p>
                        </td>
                      </tr>

                      <!-- Body Content -->
                      <tr>
                        <td style="padding: 36px 32px 28px;">
                          <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #111827;">Verify Your Email Address</h2>
                          <p style="margin: 0 0 18px; font-size: 15px; line-height: 1.6; color: #4b5563;">
                            Hi <strong>%s</strong>,
                          </p>
                          <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #4b5563;">
                            Thank you for joining Splitzee! We're excited to help you and your friends easily split expenses, calculate balances, and settle up smoothly.
                          </p>
                          <p style="margin: 0 0 28px; font-size: 15px; line-height: 1.6; color: #4b5563;">
                            Please confirm your email address by clicking the button below:
                          </p>

                          <!-- CTA Button -->
                          <div style="text-align: center; margin: 30px 0;">
                            <a href="%s" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%%, #ea580c 100%%); background-color: #ea580c; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 8px rgba(234, 88, 12, 0.25);">
                              Verify &amp; Activate Account
                            </a>
                          </div>

                          <!-- Callout Box -->
                          <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 6px; margin: 28px 0 20px;">
                            <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #92400e;">
                              <strong>Note:</strong> This activation link will expire in <strong>24 hours</strong>. If you did not create a Splitzee account, you can safely ignore this email.
                            </p>
                          </div>

                          <!-- Fallback Link -->
                          <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #f3f4f6;">
                            <p style="margin: 0 0 6px; font-size: 12px; color: #9ca3af;">
                              Button not working? Copy and paste this URL into your web browser:
                            </p>
                            <p style="margin: 0; font-size: 12px; line-height: 1.5; word-break: break-all;">
                              <a href="%s" style="color: #ea580c; text-decoration: underline;">%s</a>
                            </p>
                          </div>
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td style="background-color: #fafafa; border-top: 1px solid #e5e7eb; padding: 22px 30px; text-align: center;">
                          <p style="margin: 0 0 6px; font-size: 13px; font-weight: 600; color: #6b7280;">Splitzee</p>
                          <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                            &copy; 2026 Splitzee. All rights reserved.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(greetingName, safeVerifyUrl, safeVerifyUrl, safeVerifyUrl);
    }

    /**
     * Builds a responsive, beautifully styled HTML email for group invitations.
     */
    public String buildInvitationEmail(String inviterEmail, String groupTitle, String joinUrl) {
        String safeInviterEmail = escapeHtml(inviterEmail != null ? inviterEmail : "Someone");
        String safeGroupTitle = escapeHtml(groupTitle != null ? groupTitle : "a group");
        String safeJoinUrl = escapeHtml(joinUrl);

        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Group Invitation - Splitzee</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1f2937;">
              <table role="presentation" width="100%%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; padding: 40px 16px;">
                <tr>
                  <td align="center">
                    <table role="presentation" width="100%%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06); border: 1px solid #e5e7eb;">
                      <!-- Header -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #f59e0b 0%%, #ea580c 100%%); background-color: #ea580c; padding: 32px 30px; text-align: center;">
                          <h1 style="margin: 0; font-size: 30px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Splitzee</h1>
                          <p style="margin: 6px 0 0; font-size: 14px; color: #fef3c7; font-weight: 500;">Effortless Group Expense Sharing</p>
                        </td>
                      </tr>

                      <!-- Body Content -->
                      <tr>
                        <td style="padding: 36px 32px 28px;">
                          <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #111827;">You're Invited to Join a Group!</h2>
                          <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #4b5563;">
                            <strong>%s</strong> has invited you to join their group on Splitzee.
                          </p>

                          <!-- Group Highlight Card -->
                          <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;">
                            <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #c2410c; letter-spacing: 0.8px;">Group Name</div>
                            <div style="font-size: 22px; font-weight: 800; color: #9a3412; margin-top: 6px;">%s</div>
                          </div>

                          <p style="margin: 0 0 28px; font-size: 15px; line-height: 1.6; color: #4b5563;">
                            Join the group to view shared expenses, see your updated net balances, and settle payments effortlessly.
                          </p>

                          <!-- CTA Button -->
                          <div style="text-align: center; margin: 30px 0;">
                            <a href="%s" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%%, #ea580c 100%%); background-color: #ea580c; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 8px rgba(234, 88, 12, 0.25);">
                              Accept Invitation &amp; Join Group
                            </a>
                          </div>

                          <!-- Callout Box -->
                          <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 6px; margin: 28px 0 20px;">
                            <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #92400e;">
                              <strong>Note:</strong> This invitation link will expire in <strong>24 hours</strong>. If you did not expect this invitation, you can simply ignore this email.
                            </p>
                          </div>

                          <!-- Fallback Link -->
                          <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #f3f4f6;">
                            <p style="margin: 0 0 6px; font-size: 12px; color: #9ca3af;">
                              Button not working? Copy and paste this URL into your web browser:
                            </p>
                            <p style="margin: 0; font-size: 12px; line-height: 1.5; word-break: break-all;">
                              <a href="%s" style="color: #ea580c; text-decoration: underline;">%s</a>
                            </p>
                          </div>
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td style="background-color: #fafafa; border-top: 1px solid #e5e7eb; padding: 22px 30px; text-align: center;">
                          <p style="margin: 0 0 6px; font-size: 13px; font-weight: 600; color: #6b7280;">Splitzee</p>
                          <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                            &copy; 2026 Splitzee. All rights reserved.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(safeInviterEmail, safeGroupTitle, safeJoinUrl, safeJoinUrl, safeJoinUrl);
    }

    private String escapeHtml(String text) {
        if (text == null) {
            return "";
        }
        return text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;")
                   .replace("\"", "&quot;")
                   .replace("'", "&#39;");
    }
}
