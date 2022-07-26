const fs = require('fs');
const {OCR_API: ocrKey} = require('./apikey.json');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const { ocrSpace } = require('ocr-space-api-wrapper');
const { kill } = require('process');
//const path = (process.pkg) ? process.cwd()+'/desktop/resumes' : __dirname+'/desktop/resumes';
const path = (process.pkg) ? process.cwd() : __dirname;

let files = fs.readdirSync(path);

const safeExt = ['pdf','jpg','png','jpeg','bmp','gif','tif','tiff','webp'];
let output = [];
let myConsole;
let killSwitch = [];

const titleMsg = () => {
    console.log("Resume Scraper v1.0");
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
    let fileName = path+'/resume_autogen_'+Date.now()+'.csv';
    clearInterval(myConsole);
    console.clear();
    console.log("Generating "+fileName+". [**********]");
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
            if(killSwitch.kill) console.log("Critical error at resume "+killSwitch.kill+" of "+resumes.length+". Generated CSV will contain details of prior resumes. This error is likely related to overuse of the API, blocking future requests for the next hour.");
            console.log(fileName+' generated. [**********]');
        });
}

const processResume = (i) => {
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
processResume(0);