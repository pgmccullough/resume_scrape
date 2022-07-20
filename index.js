const fs = require('fs');
const {OCR_API: ocrKey} = require('./apikey.json');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const { ocrSpace } = require('ocr-space-api-wrapper');
const path = (process.pkg) ? process.cwd()+'/desktop/resumes' : __dirname+'/desktop/resumes';

let files = fs.readdirSync(path);

const safeExt = ['pdf','jpg','png','jpeg','bmp','gif','tif','tiff','webp'];
let promises = [];
let output = [];

const phoneFormat = (phone) => {
    phone = phone.replaceAll(" ","");
    phone = phone.replaceAll("-","");
    phone = phone.replaceAll("+1","");
    phone = phone.slice(0,3)+"-"+phone.slice(3,6)+"-"+phone.slice(7,10)
    return phone;
} 

console.log("Reading resumes, please wait. This may take several seconds.");

files.map(file => {
    let extCheck = file.split(".").at(-1);
    if(!safeExt.includes(extCheck)) return;
    let promise = ocrSpace(path+"/"+file, { apiKey: ocrKey })
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
    });
    promises.push(promise);
})

Promise.all(promises)
.then(_res => {
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
    .then(()=> console.log(fileName+' written successfully.'));
})