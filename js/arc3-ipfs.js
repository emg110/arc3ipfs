const bs58 = require("bs58");
const config = require("./config")
const pinataSDK = require('@pinata/sdk');
const pinataApiKey = config.pinataApiKey;
const pinataSecretApiKey = config.pinataSecretApiKey;
const pinata = pinataSDK(pinataApiKey,pinataSecretApiKey);

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


  
  let fileNameSplit = fileName.split('.')
  
  let properties = {
    "file_name": fileNameSplit[0],
    "file_extension": fileNameSplit[1],
    "file_size": fileBlob.size,
    "file_category": "image"
  }

  const pinataMetadata = {
    name: assetName,
    keyvalues: properties
  };

  let metadata = config.arc3MetadataJson

  metadata.properties = properties;
  metadata.name = assetName;
  metadata.description = assetDesc;
  metadata.image = "";
  metadata.image_integrity = "";

  const pinataOptions = {
    cidVersion: 0,
  };
  
  const options = {
    pinataMetadata: pinataMetadata,
    pinataOptions: pinataOptions
  };

  return pinata.pinFileToIPFS(fileBlob, options).then((result) => {
      console.log(result);
  }).catch((err) => {
      console.log(err);
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

  const body = metadata;

  const pinataOptions = {
    cidVersion: 0,
  };

  const options = {
      pinataMetadata: pinataMetadata,
      pinataOptions: pinataOptions
  };

  return pinata.pinJSONToIPFS(body, options).then((result) => {
      console.log(result);
  }).catch((err) => {
      console.log(err);
  });

};
module.exports = {
  scenario2,
  scenario1,
  convertByte32ToIpfsCidV0,
  convertIpfsCidV0ToByte32,
}