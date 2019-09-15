const fs = require('fs');
const archiver = require('archiver');
const jaguar = require('jaguar');
const path = require('path');

const metaFinder = require('./metafinder.js');

function mkdir(dir, mode){
    console.log(dir);
    try{
        fs.mkdirSync(dir, mode);
    }
    catch(e){
        //console.log(e);
        if (e.code === 'EEXIST') {
            return
        }
        if (e.code === 'EACCES') {
            throw(e);
        }
        console.error("mkdir ERROR: " + e.errno + ": " + e.code);
        //if(e.errno === 34){ //found this code on https://gist.github.com/progrape/bbccda9adc8845c94a6f, but getting -4058 on windows
            mkdir(path.dirname(dir), mode);
            mkdir(dir, mode);
        //}
    }
}

function getPath(id) {
    return "./blobs/"+id.slice(0,2)+"/"+id.slice(2,6)+"/"+id.slice(6,14)+"/"+id;
}

function storeDocument(id,oldpath) {
    return new Promise((accept, reject) => {
        let newPath = getPath(id)
        mkdir(path.dirname(newPath));
        fs.copyFile(oldpath, newPath, (error, result) => {
            if  (error) {
                reject(error);
            } else {
                accept(result);
            }
        });
    });
}

function getDocument(id) {
    return new Promise((accept, reject) => {
        fs.readFile(getPath(id), (err, data) => {
            if (err) {
                reject(err);
            } else {
                accept(data);
            }
          });
    });
}

function createArchive() {
    const archive = new archiver('tar', { gzip: true });

    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', function (err) {
        if (err.code === 'ENOENT') {
            // log warning
            console.log(err);
        } else {
            // throw error
            throw err;
        }
    });

    // good practice to catch this error explicitly
    archive.on('error', function (err) {
        throw err;
    });

    return metaFinder.dump("text/turtle").then((response) => response.text())
        .then(data => {
            archive.append(data, { name: "rdf.ttl" });
            archive.directory('./blobs/', 'blobs');
            archive.finalize();
            console.log("archived")
            return archive;
        })
}

function importArchive(from)  {
    return new Promise((resolve,reject) => {
        const extract = jaguar.extract(from, path.join(from+"-expanded"));
        extract.on('error', (error) => {
            reject(error)
        });
        extract.on('end', () => {
            fs.del
            resolve();
        });
    });
}

exports.storeDocument = storeDocument;
exports.getDocument = getDocument;
exports.createArchive = createArchive;
exports.importArchive = importArchive;