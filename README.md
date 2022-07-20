# Resume Scraper

Simple application for a friend who needed to be able to take multiple PDFs of resumes, and have a CSV generated with the name, email address, and phone number of each applicant. The resumes come from a single source and are all almost identically formatted, making this possible.

## Set-up
```
git clone git@github.com:pgmccullough/resume_scrape.git
```

```
npm i
```

Remove **.sample** from apikey.json.sample and set value of OCR_API as the API key you have received from [Free OCR API](https://ocr.space/ocrapi).

```
npm run deploy
```

Three executable files will be created in the repo directory for each major OS:

- index-linux
- index-win.exe
- index-macos

## Usage
Move executable of current OS into a directory on the desktop called **resumes**, which also contains all resumes to be scraped.

Run the executable. After running, a .csv file will be generated in the **resumes** directory containing a row for each resume's name, email, and phone.