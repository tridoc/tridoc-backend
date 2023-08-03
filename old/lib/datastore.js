const fs = require('fs');
const archiver = require('archiver');
const AdmZip = require('adm-zip');
const path = require('path');

const metaFinder = require('./metafinder.js');
const metaStorer = require('./metastorer.js');
const { spawn, spawnSync } = require( 'child_process' );

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
                spawn('convert', ['-thumbnail', '300x', '-alpha', 'remove', `${newPath}[0]`, `${newPath}.png`])
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

function getThumbnail(id) {
    const path = getPath(id)
    return new Promise((accept, reject) => {
        fs.readFile(path + '.png', (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    console.log(spawnSync('convert', ['-thumbnail', '300x', '-alpha', 'remove', `${path}[0]`, `${path}.png`]).output[2].toString())
                    fs.readFile(path + '.png', (err, data) => {
                        if (err) {
                            reject(err);
                        } else {
                            accept(data);
                        }
                    });
                } else {
                    reject(err);
                }
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

function createZipArchive() {
    const zip = new AdmZip();


    return metaFinder.dump("text/turtle").then((response) => response.text())
        .then(data => {
            zip.addFile('rdf.ttl', Buffer.from(data));
            zip.addLocalFolder('./blobs/', 'blobs');
            console.log("zipped")
            return zip;
        })
}

function putData(file) {
  const zip = new AdmZip(file);
  var zipEntries = zip.getEntries();
   
  zipEntries.forEach(function(zipEntry) {
      if (zipEntry.entryName === 'rdf.ttl') {
           metaStorer.restore(zipEntry.getData().toString('utf8'))
      }
      if (zipEntry.entryName.startsWith('blobs')) {
        zip.extractEntryTo(zipEntry.entryName,'./', true, true)
      }
  });
  
}

/*
return metaFinder.dump("text/turtle").then((response) => response.text())
                .then(data => h.response(dataStore.archive([{ data: data, name: "rdf.ttl" }]))
                    .type('application/gzip')
                    .header("content-disposition", `attachment; filename="tridoc_backup_${Date.now()}.tar.gz"`));
*/

exports.storeDocument = storeDocument;
exports.getDocument = getDocument;
exports.getThumbnail = getThumbnail;
exports.createArchive = createArchive;
exports.createZipArchive = createZipArchive;
exports.putData = putData;