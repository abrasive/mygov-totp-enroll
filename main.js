const { app, protocol, BrowserWindow, ipcMain } = require('electron');
const url = require('url');
const request = require('request');
const qrcode = require('qrcode');
const { base32, base64 } = require('rfc4648');
const prompt = require('electron-prompt');

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
            return;
        }
        if (body == null) {    // lol
            setStatus("Enrollment complete! DON'T LOSE THE CODE");
            showCodeForm(false);
            return;
        } else if (body.error) {
            setError("Code verification failed, try again", body.error + ' - ' + body.error_description);
            return;
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
        protocol.unregisterProtocol('au.gov.my');   // otherwise background requests can trigger this again!

        code = url.parse(req.url, true).query.code
        callback({ path: `${__dirname}/ui.html` })

        requestToken(code)
    }, (error) => {
        if (error) console.error('Failed to register protocol')
    })

    win = new BrowserWindow({ width: 800, height: 600 })

    win.loadURL(`file://${__dirname}/instructions.html`)

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
