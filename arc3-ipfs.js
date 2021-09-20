const fs = require('fs');
const path = require('path');
const bs58 = require("bs58");
const config = require("./config")
const pinataApiKey = config.pinataApiKey;
const pinataApiSecret = config.pinataApiSecret;
const pinataSDK = require('@pinata/sdk');

const pinata = pinataSDK(pinataApiKey, pinataApiSecret);
const nftWorkspacePath = __dirname+'/workspace';
/* Use these two if you have a running IPFS node and want to connect to it for IPFS operations. */

//const { create, CID } = require('ipfs-http-client')


/* Use this instance for temporary lightweight IPFS instance inside your Node application process */
const IPFS = require('ipfs-core');


const convertIpfsCidV0ToByte32 = (cid) => {
  return `${bs58.decode(cid).slice(2).toString('hex')}`;
};

const convertByte32ToIpfsCidV0 = (str) => {
  if (str.indexOf('0x') === 0) {
    str = str.slice(2);
  }
  return bs58.encode(bs58.Buffer.from(`1220${str}`, 'hex'));
};

const scenario1 = async(nftFile, nftFileName, assetName, assetDesc) => {
  let nftFileStats = fs.statSync(`${nftWorkspacePath}/${nftFileName}`)
  let fileCat = 'image';


  let nftFileNameSplit = nftFileName.split('.')
  let ext = nftFileNameSplit[1];
  switch(ext) {
    case 'txt':
      fileCat = 'text'
      break;
    case 'pdf':
      fileCat = 'pdf'
      break;
    case 'mp4':
      fileCat = 'video'
      break;
    case 'wav':
      fileCat = 'audio'
      break;
    case 'zip':
    case 'rar':
    case '7z':
      fileCat = 'archive'
      break;
    case 'png':
    case 'jpg':
    case 'svg':
      fileCat = 'image'
      break;
    default:
      fileCat = 'file'
  }
  const properties = {
    "file_name": nftFileNameSplit[0],
    "file_extension": ext,
    "file_size": nftFileStats.size,
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
  const resultFile = await pinata.pinFileToIPFS(nftFile, options)
  console.log('The NFT original digital asset file: ', resultFile);
  let metadata = config.arc3MetadataJSON

  metadata.properties = properties;
  metadata.name = assetName;
  metadata.description = assetDesc;
  metadata.image = 'ipfs://' + resultFile.IpfsHash;
  metadata.image_integrity = resultFile.IpfsHash;
  const resultMeta = await pinata.pinJSONToIPFS(metadata, options)
  console.log('The NFT metadata JSON file: ',resultMeta);
 


};

const scenario2 = async (nftFile, nftFileName, assetName, assetDesc) => {
  /* This is ipfs http client instance in case you have used ('ipfs-http-client') */
  //const ipfs = create(config.ipfsNode)

  /* This is lightweight ipfs application instance based on ('ipfs-core'), without the need for any external node */
  const ipfs = await IPFS.create();
  let nftFileStats = fs.statSync(`${nftWorkspacePath}/${nftFileName}`)
  let fileCat = 'image';
  let nftFileNameSplit = nftFileName.split('.')
  let ext = nftFileNameSplit[1];
  switch(ext) {
    case 'txt':
      fileCat = 'text'
      break;
    case 'pdf':
      fileCat = 'pdf'
      break;
    case 'mp4':
      fileCat = 'video'
      break;
    case 'wav':
      fileCat = 'audio'
      break;
    case 'zip':
    case 'rar':
    case '7z':
      fileCat = 'archive'
      break;
    case 'png':
    case 'jpg':
    case 'svg':
      fileCat = 'image'
      break;
    default:
      fileCat = 'file'
  }
  


  let properties = {
    "file_name": nftFileNameSplit[0],
    "file_extension": nftFileNameSplit[1],
    "file_size": nftFileStats.size,
    "file_category": fileCat
  };
  let metadata = {
    ...config.arc3MetadataJSON,
    properties: properties,
    name: assetName,
    description: assetDesc,

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

 

  let result = await pinata.pinFileToIPFS(nftFile, options)
  console.log('The NFT original digital asset file: ',result);

  metadata.image = 'ipfs://' + result.IpfsHash;
  metadata.image_integrity = result.IpfsHash;
 
  console.log('The NFT original prepared metadata: ',metadata)
  let resultMeta = await pinata.pinJSONToIPFS(metadata, options)
  console.log('The NFT metadata pinned to Pinata: ',resultMeta)

  const folderCid = await ipfs.object.new({ template: 'unixfs-dir' })
  console.log('The NFT folder CID: ',folderCid)
  const finResJson = await ipfs.object.patch.addLink(folderCid, {
    name: `${nftFileNameSplit[0]}.json`,
    size: resultMeta.size,
    cid: resultMeta.IpfsHash,
  })
  console.log('The NFT folder CID after added metadata JSON link: ', finResJson)
  const finResNft = await ipfs.object.patch.addLink(finResJson, {
    name: nftFileName,
    size: result.size,
    cid: result.IpfsHash,
  })
 
  console.log('The NFT folder CID after added original NFT file link: ',finResNft)
  let finPin = await ipfs.pin.add(finResNft);
  console.log('The NFT folder CID pinned locally on IPFS: ',finPin);
  const finPinataPin = await pinata.pinByHash(finPin.toString())
  console.log('The NFT folder CID pinned to Pinata: ', finPinataPin)
}

const testScenario1 = () => {
  pinata.testAuthentication().then((result) => {
    console.log(result);
    let nftFileName = 'asa_ipfs.png'
    const sampleNftFile = fs.createReadStream(`${nftWorkspacePath}/${nftFileName}`);
    scenario1(sampleNftFile, nftFileName, 'Algorand ASA ARC3 IPFS SC1', 'This is a Scenario1 NFT created with metadata JSON in ARC3 compliance and using IPFS via Pinata API')

  }).catch((err) => {
    console.log(err);
  });
}

const testScenario2 = () => {
  pinata.testAuthentication().then((result) => {
    console.log(result);
    let nftFileName = 'asa_ipfs.png'
    const sampleNftFile = fs.createReadStream(`${nftWorkspacePath}/${nftFileName}`);
    scenario2(sampleNftFile, nftFileName, 'Algorand ASA ARC3 IPFS SC2', 'This is a Scenario2 NFT created with metadata JSON in ARC3 compliance and using IPFS via Pinata API')

  }).catch((err) => {
    console.log(err);
  });
}


//testScenario1()
//testScenario2();


module.exports = {
  scenario2,
  scenario1,
  testScenario2,
  testScenario1,
  convertByte32ToIpfsCidV0,
  convertIpfsCidV0ToByte32,
}