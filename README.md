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

Prerequisite: 
npm

**Windows**

1. Download the repository and unzip onto the desktop.
2. Open a new Command Prompt window and navigate to the unzipped folder e.g  ![image](https://user-images.githubusercontent.com/24822223/125901263-a2368895-c0e4-4100-ac70-3ffea6772dbd.png)
3. `npm install`
4. `npm start`
5. follow the instructions in the screen that opens

**Docker**

1. `docker build -t mygov .`
2. `docker run -e DISPLAY --net=host -it mygov npm start`
