
export function generatedOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getOtpHtml(otp: string) { //email boilerplate
    return (
        `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Courier New', Courier, monospace; background-color: #ffffff; color: #000000;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                    <td align="center" style="padding: 50px 0;">
                        <table width="380" border="0" cellspacing="0" cellpadding="0" style="border: 2px solid #000;">
                            <tr>
                                <td style="padding: 40px 30px; text-align: left;">
                                    <h1 style="margin: 0; font-size: 22px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">
                                        Verification
                                    </h1>
                                    
                                    <p style="font-size: 14px; line-height: 1.6; margin: 20px 0; color: #333;">
                                        Please use the following One-Time Password (OTP) to complete your authentication. This code is valid for 10 minutes.
                                    </p>
                                    
                                    <!-- OTP BOX -->
                                    <div style="background-color: #000; padding: 25px; text-align: center; margin: 30px 0;">
                                        <span style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #ffffff;">
                                            ${otp}
                                        </span>
                                    </div>
                                    
                                    <p style="font-size: 11px; color: #888; margin-bottom: 5px;">
                                        If you did not request this, please ignore this email.
                                    </p>
                                    
                                    <div style="margin-top: 30px; border-top: 1px solid #000; pt: 15px;">
                                        <p style="font-size: 13px; font-weight: bold; margin: 10px 0 0 0;">
                                            Aman Karn Dev Team
                                        </p>
                                        <p style="font-size: 11px; color: #555; margin: 5px 0;">
                                            secure • automated • access
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>`
    )
}