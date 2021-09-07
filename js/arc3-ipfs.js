const fs = require('fs');
const bs58 = require("bs58");
const config = require("./config")
const pinataSDK = require('@pinata/sdk');
const pinataApiKey = config.pinataApiKey;
const pinataSecretApiKey = config.pinataSecretApiKey;
const pinata = pinataSDK(pinataApiKey, pinataSecretApiKey);
const readableStreamForFile = fs.createReadStream('./yourfile.png');

pinata.testAuthentication().then((result) => {
  console.log(result);
}).catch((err) => {
  console.log(err);
});

const convertIpfsCidV0ToByte32 = (cid) => {
  return `${bs58.decode(cid).slice(2).toString('hex')}`;
};

const convertByte32ToIpfsCidV0 = (str) => {
  if (str.indexOf('0x') === 0) {
    str = str.slice(2);
  }
  return bs58.encode(bs58.Buffer.from(`1220${str}`, 'hex'));
};

const scenario1 = (fileBlob, fileName, assetName, assetDesc) => {
  const readableStreamForFile = fs.createReadStream('./images/ASA_IPFS scenarios');
  let fileCat = 'image';


  let fileNameSplit = fileName.split('.')
  let ext = fileNameSplit[1];
  if (ext === 'txt') {
    fileCat = 'text'
  } else if (ext === 'mp4') {
    fileCat = 'video'
  } else if (ext === 'mp3' || ext === 'wav') {
    fileCat = 'audio'
  }
  let properties = {
    "file_name": fileNameSplit[0],
    "file_extension": ext,
    "file_size": fileBlob.size,
    "file_category": fileCat
  }

  const pinataMetadata = {
    name: assetName,
    keyvalues: properties
  };



  const pinataOptions = {
    cidVersion: 0,
  };

  const options = {
    pinataMetadata: pinataMetadata,
    pinataOptions: pinataOptions
  };
  return pinata.pinFileToIPFS(fileBlob, options).then((resultFile) => {
    console.log(resultFile);
    let metadata = config.arc3MetadataJson

    metadata.properties = properties;
    metadata.name = assetName;
    metadata.description = assetDesc;
    metadata.image = 'ipfs://' + resultFile.IpfsHash;
    metadata.image_integrity = resultFile.IpfsHash;
    return pinata.pinJSONToIPFS(metadata, options).then((resultMeta) => {
      console.log(resultMeta);

    }).catch((err) => {
      return console.log(err);
    });
  }).catch((err) => {
    return console.log(err);
  });


};

const scenario2 = (fileBlob, fileName, assetName, assetDesc) => {
  let metadata = config.arc3MetadataJson
  metadata.properties = properties;
  metadata.name = assetName;
  metadata.description = assetDesc;
  metadata.image = "";
  metadata.image_integrity = "";

  let fileNameSplit = fileName.split('.');

  let properties = {
    "file_name": fileNameSplit[0],
    "file_extension": fileNameSplit[1],
    "file_size": fileBlob.size,
    "file_category": "image"
  };

  const pinataMetadata = {
    name: assetName,
    keyvalues: properties
  };



  const pinataOptions = {
    cidVersion: 0,
  };

  const options = {
    pinataMetadata: pinataMetadata,
    pinataOptions: pinataOptions
  };
  let data = JSON.stringify(student);
  fs.writeFileSync('student-2.json', data);
  fs.writeFileSync(fileName, fileBlob);
  return fs.mkdir(`./${assetName}`, function (err) {
    if (err) {
      return console.log(err)
    } else {
      return pinata.pinFromFS(`./${assetName}`, options).then((result) => {
        return console.log(result);
      }).catch((err) => {
        return console.log(err);
      });
    }
  })



};
module.exports = {
  scenario2,
  scenario1,
  convertByte32ToIpfsCidV0,
  convertIpfsCidV0ToByte32,
}