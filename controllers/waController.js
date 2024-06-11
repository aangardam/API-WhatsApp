const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');
const QRCode = require('qrcode');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-gpu'],
    },
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
    },
});

var isGenerate = false;
client.once('ready', () => {
    isGenerate = true;
    console.log('Client is ready!');
});

client.on('qr', (qr) => {
    generateQRCodeImage(qr);
    console.log('Ready scan qr code');
});

client.on('disconnected', (reason) => {
    isGenerate = false;
    console.log('Client was logged out', reason);
});


client.initialize();
const generateQRCodeImage = async (data) => {
    try {
        const url = await QRCode.toDataURL(data);
        const base64Data = url.replace(/^data:image\/png;base64,/, '');
        fs.writeFileSync('qr-code.png', base64Data, 'base64');
    } catch (err) {
        console.error('Error generating QR code image:', err);
    }
};

const scan = async (req, res) => {
    if(isGenerate == false){
        if (fs.existsSync('qr-code.png')) {
            res.sendFile('qr-code.png', { root: '.' });
        } else {
            res.status(404).json({ message: 'QR code not available' });
        }
    }else{
        let checkQr = await client.info;
        const nomor = checkQr.me.user
        const nohp = '0' + nomor.slice(2);
        const msg = `QR Code has been linked to number ${checkQr.pushname} ( ${nohp} )`
        res.status(404).json({ message: msg });
    }
    
    
};

const sendMessage = async (req, res) => {
    let nohp = req.body.phone;
    const pesan = req.body.message;

    try {
        if (nohp.startsWith('0')) {
            nohp = '62' + nohp.slice(1) + '@c.us';
        } else if (nohp.startsWith('62')) {
            nohp = nohp + '@c.us';
        } else {
            nohp = '62' + nohp + '@c.us';
        }

        const user = await client.isRegisteredUser(nohp);
        if (user) {
            client.sendMessage(nohp, pesan);
            res.json({
                status: '200',
                message: 'Message sent successfully',
            });
        } else {
            res.json({
                status: '500',
                message: 'Message failed to send',
            });
        }
    } catch (error) {
        console.log('error', error);
        res.status(500).json({
            status: '500',
            message: 'An error occurred while sending the message',
            error: error.message,
        });
    }
};

const bulkMessage = async (req, res) => {
    let nohps = req.body.phone;
    const pesan = req.body.message;

    try {
        let results = [];

        for (let nohp of nohps) {
            if (nohp.startsWith('0')) {
                nohp = '62' + nohp.slice(1) + '@c.us';
            } else if (nohp.startsWith('62')) {
                nohp = nohp + '@c.us';
            } else {
                nohp = '62' + nohp + '@c.us';
            }

            const user = await client.isRegisteredUser(nohp);
            if (user) {
                await client.sendMessage(nohp, pesan);
                results.push({ nohp, status: '200', message: 'Message sent successfully' });
            } else {
                results.push({ nohp, status: '500', message: 'Message failed to send' });
            }
        }

        res.json({
            status: '200',
            results,
            message: 'The message sending process is complete',
        });

    } catch (error) {
        console.log('error', error);
        res.status(500).json({
            status: '500',
            message: 'An error occurred while sending the message',
            error: error.message,
        });
    }
};

const status = async(req, res) =>{
    if (isGenerate) {
        res.json({ message: 'Client is connected' });
    } else {
        res.json({ message: 'Client was logged out'});
    }
}


module.exports = {
    sendMessage,
    scan,
    bulkMessage,
    status
};
