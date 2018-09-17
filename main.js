const {
    app,
    BrowserWindow,
    Tray,
    nativeImage,
    Menu
} = require('electron')

const whois = require('whois-ux')

const fast = require('fast-cli/api')
const publicIp = require('public-ip')

const path = require('path')

const amntArr = [0, 14, 28, 42, 57, 85, 100]

const speeds = [0, 1, 25, 75, 100, 200, 699, 700]
const names = ['No service', '', 'B', 'B+', '100+', 'Q+', 'Q+', 'G+']
const subtext = ['No service', 'Sub-broadband', 'Broadband', 'Broadband+', 'Broadband+', 'Quantum', 'Quantum', 'Gigabit']


let win
let tray
let contextMenu

let UNREAD = 0

async function createWindow() {
    tray = new Tray(__dirname + '/clear.png')
    tray.setTitle('')
    
    //   tray.setContextMenu(contextMenu)
    update({})

    setTimeout(runNetworkUpdate, 1000 * 60 * 2)
    runNetworkUpdate().catch(e => console.error(e))

}

async function runNetworkUpdate() {
    let total = 0
    let amount = 0
    await fast().forEach(result => { 
        total += result.speed
        amount++
    })
    let isp = await findISPInfo()
    let ip = await publicIp.v4()
    // real
    const mbps = Math.floor(total / amount)

    // display
    const speed = amntArr[roundToNearest(amntArr, mbps)]
        const text = roundToNearest(speeds, mbps)
        update({ip, type: names[text], carrier: isp, strength: speed, mbps: mbps, typeLong: subtext[text]})

}

function findISPInfo() {
    return new Promise((resolve, reject) => {
        publicIp.v4().then(ip =>
            whois.whois(ip, (err, data) => {
                console.log(data)
                if(data && data['OrgTechName'])
                    resolve(data['OrgName'] || data['OrgTechName'])
                else resolve('Unknown')
            })
        ).catch(e => console.error(e))
    })

}

function roundToNearest(arr, num) {
    let i = 0;
    let minDiff = 1000;
    let ind
    let ans;
    for (i in arr) {
        var m = Math.abs(num - arr[i])
        if (m < minDiff) {
            minDiff = m
            ans = arr[i]
            ind = i
        }
    }
    return parseInt(ind)
}

function update({
    type = "",
    typeLong = "",
    color = "white",
    carrier = "Unknown",
    strength = 0,
    mbps = 0,
    ip = "Unknown"
}) {
    if(typeLong == "")
        typeLong = type
    tray.setTitle(type)
    tray.setImage(__dirname + `/${color}_${strength}.png`)

    try {
        tray.setContextMenu(Menu.buildFromTemplate([
            {label: 'netmenu (v0.01)', enabled: false},
            {label: '', enabled: false},
            {label: 'Network information:', enabled: false},
            {label: `${typeLong} (${mbps} Mbps)`, enabled: false},
            {label: `${carrier}`, enabled: false},
            {label: `${ip}`, enabled: false},
            {label: '', enabled: false},
            {label: 'Nearby devices:', enabled: false},
            {label: `Justin's Pixel 2 XL`, type: 'radio', checked: true},
            {label: `JO-Hotspot`},
            {label: `Justin's iPad`},
            {label: '', enabled: false},
            {label: 'Options...'},
            {label: 'About...'},
            {label: 'Quit'},
          ]))
    }catch(e) {
        console.log(e)
    }
    

}

app.on('ready', createWindow)