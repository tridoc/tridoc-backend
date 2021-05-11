const PDFJS = require('pdfjs-dist');
const Canvas = require("canvas");
const fs = require("fs");

function getText(pdfUrl) {
    var pdf = PDFJS.getDocument(pdfUrl);
    return pdf.then(function (pdf) { // get all pages text
        var maxPages = pdf.pdfInfo.numPages;
        var countPromises = []; // collecting all page promises
        for (var j = 1; j <= maxPages; j++) {
            var page = pdf.getPage(j);

            var txt = "";
            countPromises.push(page.then(function (page) { // add page promise
                var textContent = page.getTextContent();
                return textContent.then(function (text) { // return content promise
                    return text.items.map(function (s) {
                        return s.str;
                    }).join(''); // value page text 

                });
            }));
        }
        // Wait for all pages and join text
        return Promise.all(countPromises).then(function (texts) {
            return texts.join('');
        });
    });
}

function createThumbnail(pdfUrl) {
    return PDFJS.getDocument(pdfUrl).then(pdf => {
        pdf.getPage(1).then(page => {
            // Render the page on a Node canvas with 100% scale.
            const viewport = page.getViewport({ scale: 1.0 })
            const canvas = Canvas.createCanvas(viewport.width, viewport.height)
            const canvasContext = canvas.getContext('2d')
            page.render({ canvasContext, viewport }).promise.then(() => {
                console.log('RENDERED PAGE', pdfUrl)
                const image = canvasAndContext.canvas.toBuffer();
            /* fs.writeFile("output.png", image, function (error) {
                if (error) {
                    console.error('Error: ' + error);
                } else {
                    console.log('Finished converting first page of PDF file to a PNG image.')
                }
            }) */
        })
    })
}

exports.getText = getText;
