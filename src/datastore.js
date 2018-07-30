const fs = require('fs')
const path = require('path');

function mkdir(dir, mode){
    try{
        fs.mkdirSync(dir, mode);
    }
    catch(e){
        //if(e.errno === 34){ //found this code on https://gist.github.com/progrape/bbccda9adc8845c94a6f, but getting -4058 on windows
            mkdir(path.dirname(dir), mode);
            mkdir(dir, mode);
        //}
    }
}

function getPath(id) {
    return "./blobs/"+id.slice(0,2)+"/"+id.slice(2,6)+"/"+id.slice(6,14)+"/"+id;;
}

function storeDocument(id, path) {
    return new Promise((accept, reject) => {
        let newPath = getPath(id)
        mkdir(path.dirname(newPath));
        fs.rename(path, newPath, (error, result) => {
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

exports.storeDocument = storeDocument;