const fs = require('fs');
const {OCR_API: ocrKey} = require('./apikey.json');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const { ocrSpace } = require('ocr-space-api-wrapper');
//const path = (process.pkg) ? process.cwd()+'/desktop/resumes' : __dirname+'/desktop/resumes';
const path = (process.pkg) ? process.cwd()+"/desktop/resumes" : __dirname;

let files = fs.readdirSync(path);

const safeExt = ['pdf','jpg','png','jpeg','bmp','gif','tif','tiff','webp'];
let output = [];
let myConsole;
let killSwitch = [];
let storeI = 0;

const titleMsg = () => {
    console.log("Resume Scraper v1.0");
}

const timeOutKeeper = () => {
    let timeout;
    if(fs.existsSync("timeout.json")) {
        timeout = JSON.parse(fs.readFileSync("timeout.json")).timeout;
        if(!((Number(timeout)-Math.floor(Date.now()/1000)) >= 0)) {
            timeout = Math.floor(Date.now()/1000)+3600;
            fs.writeFileSync("timeout.json",JSON.stringify({timeout,pickup:killSwitch.kill}));
        }
    } else {
        const whiteList = Math.floor(Date.now()/1000)+3600;
        fs.writeFileSync("timeout.json",JSON.stringify({timeout:whiteList,pickup:killSwitch.kill}));
    }
    if(killSwitch.kill>1) console.log("Critical error at resume "+killSwitch.kill+" of "+resumes.length+". Generated CSV will contain details of prior resumes. This error is likely related to overuse of the API, blocking future requests for the next hour.");
    console.log("Please try again in "+(Number(timeout)-Math.floor(Date.now()/1000))+" seconds");
}

const sysPrint = (msg, perc) => {
    perc = Math.floor(perc/10);
    let x = 0;
    let stars = ""
    while (x<10) {
        if(x<perc) {
            stars = stars+"*";
        } else {
            stars = stars+" "
        }
        x++;
    }
    stars = "["+stars+"]";
    clearInterval(myConsole);
    myConsole = setInterval(
        () => {
            console.clear();
            msg = msg+" . ";
            titleMsg();
            console.log("Processing resumes: "+stars);
            console.log(msg);
        }
    ,500)
}

const phoneFormat = (phone) => {
    if(phone) {
    phone = phone.replaceAll(" ","");
    phone = phone.replaceAll("-","");
    phone = phone.replaceAll("+1","");
    phone = phone.slice(0,3)+"-"+phone.slice(3,6)+"-"+phone.slice(6,10)
    return phone;
    } else {
        return "NA";
    }
} 

const writeCSV = () => {
    if(killSwitch.kill&&killSwitch.kill<=1) {
        clearInterval(myConsole);
        console.clear();
        titleMsg();
        timeOutKeeper();
    } else {
        if(output.length) {
            let fileName = path+'/resume_autogen_'+Date.now()+'.csv';
            const csvWriter = createCsvWriter({
                path: fileName,
                header: [
                {id: 'name', title: 'Name'},
                {id: 'phone', title: 'Phone'},
                {id: 'email', title: 'Email'}
                ]
            });
            csvWriter
            .writeRecords(output)
            .then(() => {
                clearInterval(myConsole);
                console.clear();
                titleMsg();
                if(killSwitch.kill) {
                    timeOutKeeper();
                } else {
                    fs.writeFileSync("timeout.json",JSON.stringify({timeout:0,pickup:0}));
                }
                console.log(fileName+' generated. [**********]');
                process.exit();
            });
        } else {
            clearInterval(myConsole);
            console.clear();
            titleMsg();
            timeOutKeeper();
            process.exit();
        }
    }
}

const processResume = (i) => {
    storeI = i;
    sysPrint("Reading "+resumes[i]+". "+(i+1)+"/"+resumes.length,(i+1)/(resumes.length)*100);
    ocrSpace(path+"/"+resumes[i], { apiKey: ocrKey })
    .then(response => {
        let lines = response.ParsedResults[0].ParsedText.split(/\r?\n|\r|\n/g);
        let name = lines[0];
        let email;
        let phone;
        let emailOk = 0;
        let emailCheck;
        let iter = 2;
        while(emailOk===0&&iter<10) {
            emailCheck = lines[iter].split("");
            if(emailCheck.includes("@")) {
                email = lines[iter];
                phone = lines[iter+1];
                emailOk = 1;
            }
            iter++;
        }
        phone = phoneFormat(phone);
        output.push({email,name,phone});
    }).catch(_response => {
        killSwitch = {kill: i}
    }).finally(_response => {
        if(killSwitch.kill) return writeCSV();
        if(i<resumes.length-1) {
            processResume(i+1);
        } else {
            writeCSV();
        }
    })
}

const resumes = files.filter(file => safeExt.includes(file.split(".").at(-1)));
sysPrint("Processing "+resumes.length+" resumes.",0);
let startI = 0;
if(fs.existsSync("timeout.json")) {
    startI = JSON.parse(fs.readFileSync("timeout.json")).pickup;
}
if(startI>resumes.length) startI = 0;
processResume(startI||0);




process.stdin.resume();//so the program will not close instantly

function exitHandler(options, exitCode) {
    killSwitch = {kill: storeI}
    writeCSV();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));