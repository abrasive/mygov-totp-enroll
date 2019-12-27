# mygov-totp-enroll

This tool lets you enroll a TOTP authenticator (eg. andOTP) to access myGov.

You can't have more than one authenticator set up, so if you want multiple copies or backups, better do them all at once.

It shouldn't be possible to fuck up your myGov account using this tool,
because you have to enter a correct code from your newly configured authenticator
for the TOTP login requirement to be activated.
However, if you do screw up somehow, there's no way to recover a myGov account,
and you have to make a new one.  Consequently I make no guarantees about this
code, and if it flattens your cat or makes your lollies taste funny, well, you
were warned.

This is an Electron app because you absolutely have to
install a handler for full custom URL schemes,
as the myGov OAuth endpoint insists on returning you to <au.gov.my://app>,
which is pretty reasonable for them from a security point of view and
atrocious for us from a reasonable software point of view.
So sorry for the bloat, but there you go.

# Instructions for use

1. `npm install`
2. `npm start`
3. pray
4. follow the instructions

# Or if you have docker installed

1. `docker build -t mygov .`
2. `docker run -e DISPLAY --net=host -it mygov npm start`
