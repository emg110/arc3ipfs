const fs = require('fs');
const path = require('path');
const bs58 = require("bs58");
const { create, CID } = require('ipfs-http-client')
const config = require("./config")
const pinataSDK = require('@pinata/sdk');
const pinataApiKey = config.pinataApiKey;
const pinataSecretApiKey = config.pinataSecretApiKey;
const pinata = pinataSDK(pinataApiKey, pinataSecretApiKey);
const nftWorkspacePath = __dirname+'/workspace'

const ipfs = create(config.ipfsNode)


const convertIpfsCidV0ToByte32 = (cid) => {
  return `${bs58.decode(cid).slice(2).toString('hex')}`;
};

const convertByte32ToIpfsCidV0 = (str) => {
  if (str.indexOf('0x') === 0) {
    str = str.slice(2);
  }
  return bs58.encode(bs58.Buffer.from(`1220${str}`, 'hex'));
};

const scenario1 = (nftFile, nftFileName, assetName, assetDesc) => {
  let nftFileStats = fs.statSync(`${nftWorkspacePath}/${nftFileName}`)
  let fileCat = 'image';


  let nftFileNameSplit = nftFileName.split('.')
  let ext = nftFileNameSplit[1];
  if (ext === 'txt') {
    fileCat = 'text'
  } else if (ext === 'mp4') {
    fileCat = 'video'
  } else if (ext === 'mp3' || ext === 'wav') {
    fileCat = 'audio'
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
  return pinata.pinFileToIPFS(nftFile, options).then((resultFile) => {
    console.log('The NFT original digital asset file: ', resultFile);
    let metadata = config.arc3MetadataJSON

    metadata.properties = properties;
    metadata.name = assetName;
    metadata.description = assetDesc;
    metadata.image = 'ipfs://' + resultFile.IpfsHash;
    metadata.image_integrity = resultFile.IpfsHash;
    console.log('The NFT original digital asset file CID: ', CID.parse(resultFile.IpfsHash))
    return pinata.pinJSONToIPFS(metadata, options).then((resultMeta) => {

      console.log('The NFT metadata JSON file: ',resultMeta);

    }).catch((err) => {
      return console.log(err);
    });
  }).catch((err) => {
    return console.log(err);
  });


};

const scenario2 = async (nftFile, nftFileName, assetName, assetDesc) => {
  let nftFileStats = fs.statSync(`${nftWorkspacePath}/${nftFileName}`)
  let fileCat = 'image';
  let nftFileNameSplit = nftFileName.split('.')
  let ext = nftFileNameSplit[1];
  if (ext === 'txt') {
    fileCat = 'text'
  } else if (ext === 'mp4') {
    fileCat = 'video'
  } else if (ext === 'mp3' || ext === 'wav') {
    fileCat = 'audio'
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

  const folderCid = await ipfs.object.new()
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
    scenario1(sampleNftFile, nftFileName, 'Algorand ASA ARC3 IPFS', 'This is a sample NFT created with metadata JSON in ARC3 compliance and using IPFS via Pinata API')

  }).catch((err) => {
    console.log(err);
  });
}

const testScenario2 = () => {
  pinata.testAuthentication().then((result) => {
    console.log(result);
    let nftFileName = 'asa_ipfs.png'
    const sampleNftFile = fs.createReadStream(`${nftWorkspacePath}/${nftFileName}`);
    scenario2(sampleNftFile, nftFileName, 'Algorand ASA ARC3 IPFS', 'This is a sample NFT created with metadata JSON in ARC3 compliance and using IPFS via Pinata API')

  }).catch((err) => {
    console.log(err);
  });
}

//testScenario1()
testScenario2();

module.exports = {
  scenario2,
  scenario1,
  convertByte32ToIpfsCidV0,
  convertIpfsCidV0ToByte32,
}