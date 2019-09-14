const fs = require('fs');
var archiver = require('archiver');
const path = require('path');

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
    return "./blobs/"+id.slice(0,2)+"/"+id.slice(2,6)+"/"+id.slice(6,14)+"/"+id;;
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

function archive(data = [{data: "string cheese!", name: 'file.txt'}]) {
    const archive = new archiver('tar', { gzip:true });
    data.forEach(file => {
        archive.append(file.data, { name: file.name });
    });
    archive.finalize();
    console.log("archived")
    return archive;
}

exports.storeDocument = storeDocument;
exports.getDocument = getDocument;
exports.archive = archive;