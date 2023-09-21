const { app, protocol, BrowserWindow, ipcMain, dialog } = require('electron');
const url = require('url');
const request = require('request');
const qrcode = require('qrcode');
const { base32, base64 } = require('rfc4648');
const path = require("node:path");

let win
let client_id='g2c2pjLUThOaBumECqbf'
let token

function setStatus(stat) {
    win.webContents.send("status", stat);
}
function setDetail(detail) {
    win.webContents.send("detail", detail);
}
function setError(headline, detail) {
    setStatus("ERROR: " + headline);
    setDetail(detail);
}
function showCodeForm(on) {
    if (on) {
        win.webContents.send("showform", "block");
    } else {
        win.webContents.send("showform", "none");
    }
}

function verifyCode(code) {
    const options = {
        method: 'POST',
        url: 'https://api.my.gov.au/authbiz-ext-sec/api/v1/authclients/g2c2pjLUThOaBumECqbf/totpverify.json',
        headers: {
            'content-type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: {
            password: code,
        },
        json: true,
    };

    request(options, function (error, response, body) {
        if (error) {
            setError("Code verification failed, try again", error);
            console.log("error: " + error)
            return;
        }
        if (body == null) {    // lol
            setStatus("Enrolment complete! DON'T LOSE THE CODE");
            showCodeForm(false);
            return;
        } else if (body.error) {
            setError("Code verification failed, try again", body.error + ' - ' + body.error_description);
            console.log("body error: " + body.error)
            return;
        } else {
            console.log("body?? " + body)
            console.dir(body)
            msg = "myGov error: " + body.info[0].code + " " + body.info[0].message
            msg += "\n Make sure you're using an OTP tool that supports SHA1 keys!"
            dialog.showMessageBox({
                        "type": "error",
                        "title": "myGov error",
                        "message": msg,
                        "buttons": ["OK"],
                    })
        }
    });
}

function makeQR(secret) {
    secret32 = base32.stringify(base64.parse(secret))
    secret32 = secret32.replace(/=+$/, "")
    totp_uri = 'otpauth://totp/myGov?secret=' + secret32 + '&algorithm=SHA512'

    qrcode.toDataURL(totp_uri)
        .then(url => {
            setStatus("Enroll this secret in your TOTP client and enter the current code");
            setDetail(totp_uri + '<p><img src="' + url + '"/>');
            showCodeForm(true);
        })
        .catch(err => {
            setError("QR encoding error", err);
        })
}

function requestSecret(token) {
    setStatus("Requesting OAuth secret...");
    const options = {
        method: 'POST',
        url: 'https://api.my.gov.au/authbiz-ext-sec/api/v1/authclients/g2c2pjLUThOaBumECqbf/totpcredential.json',
        headers: {'Authorization': 'Bearer ' + token},
    };
    request(options, function (error, response, body) {
        if (error) {
            setError("Secret request failed", error);
            return;
        }
        body = JSON.parse(body)
        if (body.error) {
            setError("Secret request failed",
                     body.error + ' - ' + body.error_description);
            return;
        }

        secret = body.secret;
        makeQR(secret);
    });
}

function requestToken(code) {
    setStatus("Requesting OAuth token...");

    const options = {
      method: 'POST',
      url: 'https://auth.my.gov.au/mga/sps/oauth/oauth20/token',
      form: {
        client_id: client_id,
        redirect_uri: 'au.gov.my://app',
        grant_type: 'authorization_code',
        code: code,
      },
    };

    request(options, function (error, response, body) {
        if (error) {
            setError("Token request failed", error);
            return;
        }
        body = JSON.parse(body)
        if (body.error) {
            setError("Token request failed",
                     body.error + ' - ' + body.error_description);
            return;
        }

        token = body.access_token;

        requestSecret(token);
    });
}

function createWindow () {
    protocol.registerFileProtocol('au.gov.my', (req, callback) => {
        console.log(req.url)
        query = url.parse(req.url, true).query
        if ("code" in query) {
            callback({ path: `${__dirname}/ui.html` })

            requestToken(query.code)
        } else {
            if ("error_code" in query) {
                console.log("set error")
                callback({ path: `${__dirname}/instructions.html` })

                dialog.showMessageBox({
                            "type": "error",
                            "title": "myGov error",
                            "message": "myGov error: " + query.error_code,
                            "buttons": ["OK"],
                        })
            }
        }
    }, (error) => {
        if (error) console.error('Failed to register protocol')
    })

    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            enableRemoteModule: true,
            preload: path.join(__dirname, "preload.js")
        }
    })

    win.loadFile(path.join(__dirname, "instructions.html"));

    ipcMain.on('code', (event, arg) => {
        verifyCode(arg);
    });

    win.on('closed', () => {
        win = null
    })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (win === null) {
        createWindow()
    }
})
