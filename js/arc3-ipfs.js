const bs58 = require("bs58");
const config = require("./config")
const pinataSDK = require('@pinata/sdk');
const pinata = pinataSDK(config.pinataApiKey, config.pinataSecretApiKey);
pinata.testAuthentication().then((result) => {
  //handle successful authentication here
  console.log(result);
}).catch((err) => {
  //handle error here
  console.log(err);
});
const convertIpfsCidV0ToByte32 = (cid) => {
  return `${bs58.decode(cid).slice(2).toString('hex')}`;
}
const convertByte32ToIpfsCidV0 = (str) => {
  if (str.indexOf('0x') === 0) {
    str = str.slice(2);
  }
  return bs58.encode(bs58.Buffer.from(`1220${str}`, 'hex'));
}

const scenario1 = (fileBlob, fileName, assetName) => {
  const url = config.pinataFileUrl;
  const pinataApiKey = config.pinataApiKey;
  const pinataSecretApiKey = config.pinataSecretApiKey;
  let data = new FormData();
  let fileNameSplit = fileName.split('.')
  data.append(assetName, fileBlob, fileName);
  let properties = {
    "file_name": fileNameSplit[0],
    "file_extension": fileNameSplit[1],
    "file_size": fileBlob.size,
    "file_category": "image"
  }

  const metadataPinata = JSON.stringify({
    name: assetName,
    keyvalues: properties
  });
  data.append('pinataMetadata', metadataPinata);
  let metadata = config.arc3MetadataJson

  metadata.properties = properties;
  //pinataOptions are optional
  const pinataOptions = JSON.stringify({
    cidVersion: 0,
  });
  data.append('pinataOptions', pinataOptions);

  return axios
    .post(url, data, {
      maxBodyLength: 'Infinity', //this is needed to prevent axios from erroring out with large files
      headers: {
        'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretApiKey
      }
    })
    .then(function (response) {
      //handle response here
    })
    .catch(function (error) {
      //handle error here
    });
};

const scenario2 = (fileBlob, fileName, assetName) => {
  const url = config.pinataJSONUrl;
  const pinataApiKey = config.pinataApiKey;
  const pinataSecretApiKey = config.pinataSecretApiKey;
  let metadata = config.arc3MetadataJson
  metadata.properties = properties;
  metadata.name = properties;
  metadata.description = properties;
  metadata.image = properties;
  metadata.image_integrity = properties;
  return axios
    .post(url, metadata, {
      headers: {
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretApiKey
      }
    })
    .then(function (response) {
      //handle response here
    })
    .catch(function (error) {
      //handle error here
    });
};
module.exports = {
  scenario2,
  scenario1,
  convertByte32ToIpfsCidV0,
  convertIpfsCidV0ToByte32,
}