const fs = require('fs');
const path = require('path');
const algosdk = require('algosdk');
const crypto = require('crypto');
const bs58 = require("bs58");
const config = require("./config")
const algoAddress = config.algodClientUrl;
const algodClientPort = config.algodClientPort;
const algoToken = config.algodClientToken;
const pinataApiKey = config.pinataApiKey;
const pinataApiSecret = config.pinataApiSecret;
const pinataSDK = require('@pinata/sdk');
const pinata = pinataSDK(pinataApiKey, pinataApiSecret);
const nftWorkspacePath = __dirname + '/workspace';
const { create, CID } = require('ipfs-http-client')

const algodClient = new algosdk.Algodv2(
  algoToken,
  algoAddress,
  algodClientPort
);
const keypress = async () => {
  process.stdin.setRawMode(true)
  return new Promise(resolve => process.stdin.once('data', () => {
    process.stdin.setRawMode(false)
    resolve()
  }))
}
const waitForConfirmation = async function (txId) {
  let response = await algodClient.status().do();
  let lastround = response["last-round"];
  while (true) {
    const pendingInfo = await algodClient
      .pendingTransactionInformation(txId)
      .do();
    if (
      pendingInfo["confirmed-round"] !== null &&
      pendingInfo["confirmed-round"] > 0
    ) {
      console.log(
        "Transaction " +
          txId +
          " confirmed in round " +
          pendingInfo["confirmed-round"]
      );
      break;
    }
    lastround++;
    await algodClient.statusAfterBlock(lastround).do();
  }
}


const createAccount = function () {
  try {
    const myaccount = algosdk.generateAccount();
    console.log("Account Address = " + myaccount.addr);
    let account_mnemonic = algosdk.secretKeyToMnemonic(myaccount.sk);
    console.log("Account Mnemonic = " + account_mnemonic);
    console.log("Account created. Save off Mnemonic and address");
    console.log("Add funds to account using the TestNet Dispenser: ");
    console.log("https://dispenser.testnet.aws.algodev.network/?account=" + myaccount.addr);

    return myaccount;
  }
  catch (err) {
    console.log("err", err);
  }
};

const convertIpfsCidV0ToByte32 = (cid) => {
  let hex = `${bs58.decode(cid).slice(2).toString('hex')}`
  let base64 = `${bs58.decode(cid).slice(2).toString('base64')}`
  console.log('CID Hash Converted to hex: ', hex)

  const buffer = Buffer.from(bs58.decode(cid).slice(2).toString('base64'), 'base64');
  console.log('CID Hash Converted to Base64: ', base64)
  const volBytes = buffer.length;
  console.log('CID Hash Bytes volume is: ', `${volBytes} bytes, OK for ASA MetaDataHash field!`)

  return { base64, hex, buffer };
};

const convertByte32ToIpfsCidV0 = (str) => {
  if (str.indexOf('0x') === 0) {
    str = str.slice(2);
  }
  return bs58.encode(bs58.Buffer.from(`1220${str}`, 'hex'));
};

const scenario1 = async (nftFile, nftFileName, assetName, assetDesc) => {
  let nftFileStats = fs.statSync(`${nftWorkspacePath}/${nftFileName}`)
  let fileCat = 'image';

  let nftFileNameSplit = nftFileName.split('.')
  let fileExt = nftFileNameSplit[1];



  let kvProperties = {
    "url": nftFileNameSplit[0],
    "mimetype": `image/${fileExt}`,

  };
  let properties = {
    "file_url": nftFileNameSplit[0],
    "file_url_integrity": "",
    "file_url_mimetype": `image/${fileExt}`,

  };
  const pinataMetadata = {
    name: assetName,
    keyvalues: kvProperties
  };

  const pinataOptions = {
    cidVersion: 0,
  };

  const options = {
    pinataMetadata: pinataMetadata,
    pinataOptions: pinataOptions
  };

  const resultFile = await pinata.pinFileToIPFS(nftFile, options);
  console.log('Algorand NFT::ARC3::IPFS scenario 1: The NFT original digital asset pinned to IPFS via Pinata: ', resultFile);

  let metadata = config.arc3MetadataJSON;

  let integrity = convertIpfsCidV0ToByte32(resultFile.IpfsHash)
  metadata.properties = properties;
  metadata.properties.file_url = `https://ipfs.io/ipfs/${resultFile.IpfsHash}`;
  metadata.properties.file_url_integrity = `sha256-${integrity.base64}`;
  metadata.name = `${assetName}@arc3`;
  metadata.description = assetDesc;
  metadata.image = `ipfs://${resultFile.IpfsHash}`;
  metadata.image_integrity = `sha256-${integrity.base64}`;;
  metadata.image_mimetype = `${fileCat}/${fileExt}`;

  console.log('Algorand NFT::ARC3::IPFS scenario 1: The NFT prepared metadata: ', metadata);

  const resultMeta = await pinata.pinJSONToIPFS(metadata, options);
  let jsonIntegrity = convertIpfsCidV0ToByte32(resultMeta.IpfsHash)
  console.log('Algorand NFT::ARC3::IPFS scenario 1: The NFT metadata JSON file pinned to IPFS via Pinata: ', resultMeta);
  return {
    name: `${assetName}@arc3`,
    url: `ipfs://${resultMeta.IpfsHash}`,
    metadata: jsonIntegrity.buffer,
    integrity: jsonIntegrity.base64,
  }

};

const scenario2 = async (nftFile, nftFileName, assetName, assetDesc) => {
  const ipfs = create(config.ipfsNode)

  let nftFileStats = fs.statSync(`${nftWorkspacePath}/${nftFileName}`);

  let fileCat = 'image';
  let nftFileNameSplit = nftFileName.split('.');
  let fileExt = nftFileNameSplit[1];

  let kvProperties = {
    "url": nftFileNameSplit[0],
    "mimetype": `image/${fileExt}`,

  };
  let properties = {
    "file_url": nftFileNameSplit[0],
    "file_url_integrity": "",
    "file_url_mimetype": `image/${fileExt}`,

  };
  let metadata = config.arc3MetadataJSON;
  /* let metadata = {
    ...config.arc3MetadataJSON,
    properties: properties,
    name: assetName,
    description: assetDesc,

  } */
  const pinataMetadata = {
    name: assetName,
    keyvalues: kvProperties
  };

  const pinataOptions = {
    cidVersion: 0,
  };

  const options = {
    pinataMetadata: pinataMetadata,
    pinataOptions: pinataOptions
  };

  let resultFile = await pinata.pinFileToIPFS(nftFile, options)
  console.log('Algorand NFT::ARC3::IPFS scenario 2: The NFT original digital asset pinned to IPFS via Pinata: ', resultFile);
  let integrity = convertIpfsCidV0ToByte32(resultFile.IpfsHash)
  metadata.properties = properties;
  metadata.properties.file_url = `https://ipfs.io/ipfs/${resultFile.IpfsHash}`;
  metadata.properties.file_url_integrity = `sha256-${integrity.base64}`;
  metadata.name = `${assetName}@arc3`;
  metadata.description = assetDesc;
  metadata.image = `ipfs://${resultFile.IpfsHash}`;
  metadata.image_integrity = `sha256-${integrity.base64}`;;
  metadata.image_mimetype = `${fileCat}/${fileExt}`;

  console.log('Algorand NFT::ARC3::IPFS scenario 2: The NFT prepared metadata: ', metadata);

  let resultMeta = await pinata.pinJSONToIPFS(metadata, options);
  console.log('Algorand NFT::ARC3::IPFS scenario 2: The NFT metadata pinned to IPFS via Pinata: ', resultMeta);

  const folderCid = await ipfs.object.new({ template: 'unixfs-dir' });
  console.log('Algorand NFT::ARC3::IPFS scenario 2: The NFT folder CID: ', folderCid);

  const finResJson = await ipfs.object.patch.addLink(folderCid, {
    name: `${nftFileNameSplit[0]}.json`,
    size: resultMeta.size,
    cid: resultMeta.IpfsHash,
  });
  console.log('Algorand NFT::ARC3::IPFS scenario 2: The NFT folder CID after added metadata JSON link: ', finResJson);

  const finResNft = await ipfs.object.patch.addLink(finResJson, {
    name: `${nftFileNameSplit[0]}.${fileExt}`,
    size: resultFile.size,
    cid: resultFile.IpfsHash,
  });
  console.log('Algorand NFT::ARC3::IPFS scenario 2: The NFT folder CID after added original NFT file link: ', finResNft);

  let finPin = await ipfs.pin.add(finResNft);
  console.log('Algorand NFT::ARC3::IPFS scenario 2: The NFT folder CID pinned locally on IPFS: ', finPin);

  const finPinataPin = await pinata.pinByHash(finPin.toString());
  console.log('Algorand NFT::ARC3::IPFS scenario 2: The NFT folder CID pinned to Pinata: ', finPinataPin);
}

const createNftScenario1 = async () => {
  return await pinata.testAuthentication().then((res) => {
    console.log('Algorand NFT::ARC3::IPFS scenario 1 test connection to Pinata: ', res);
    let nftFileName = 'asa_ipfs.png'
    const sampleNftFile = fs.createReadStream(`${nftWorkspacePath}/${nftFileName}`);
    return scenario1(sampleNftFile, nftFileName, 'NFT::ARC3::IPFS::1', 'This is a Scenario1 NFT created with metadata JSON in ARC3 compliance and using IPFS via Pinata API')

  }).catch((err) => {
    return console.log(err);
  });
}

const createNftScenario2 = async () => {
  return pinata.testAuthentication().then((res) => {
    console.log('Algorand NFT::ARC3::IPFS scenario 2 connection to Pinata: ', res);
    let nftFileName = 'asa_ipfs.png'
    const sampleNftFile = fs.createReadStream(`${nftWorkspacePath}/${nftFileName}`);
    scenario2(sampleNftFile, nftFileName, 'NFT::ARC3::IPFS::2', 'This is a Scenario2 NFT created with metadata JSON in ARC3 compliance and using IPFS via Pinata API')

  }).catch((err) => {
    console.log(err);
  });
}

async function createAsset(asset, account) {
  console.log("");
  console.log("==> CREATE NFT");
  const accountInfo = await algodClient.accountInformation(account.addr).do();
  const startingAmount = accountInfo.amount;
  console.log("Created account balance: %d microAlgos", startingAmount);

  const params = await algodClient.getTransactionParams().do();

  const defaultFrozen = false;
  const unitName = 'nft';
  const assetName = asset.name;
  const url = asset.url;

  const managerAddr = account.addr;
  const reserveAddr = undefined;
  const freezeAddr = undefined;
  const clawbackAddr = undefined;
  const decimals = 0;
  const total = 1;
  const metadata = asset.metadata;
  const metadataUint8Array = new Uint8Array(metadata);
  const length = metadataUint8Array.length;
  const integrity = asset.integrity;
  console.log('ASA MetaDataHash: ', metadataUint8Array)
  console.log('ASA MetaDataHash Length: ', length)
  console.log("nft_integrity : " + integrity);

  const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    from: account.addr,
    total,
    decimals,
    assetName,
    unitName,
    assetURL: url,
    assetMetadataHash: metadataUint8Array,
    defaultFrozen,
    freeze: freezeAddr,
    manager: managerAddr,
    clawback: clawbackAddr,
    reserve: reserveAddr,
    suggestedParams: params,
  });

  const rawSignedTxn = txn.signTxn(account.sk);
  const tx = await algodClient.sendRawTransaction(rawSignedTxn).do();
  let assetID = null;
  const confirmedTxn = await waitForConfirmation(tx.txId);

  
  const ptx = await algodClient.pendingTransactionInformation(tx.txId).do();
  assetID = ptx["asset-index"];

  console.log('Account: ',account.addr,' Has created ASA with ID: ', assetID);


  return { assetID };

}

async function createNFT() {
  const asset = await createNftScenario1()
  console.log(asset)
  try {
    let account = createAccount();
    console.log("Press any key when the account is funded...");
    await keypress();

    const { assetID } = await createAsset(asset, account);
    console.log("Congratulations! You created your IPFS supporting, ARC3 complying NFT on Algorand! Check it by link below:");
    console.log(`https://testnet.algoexplorer.io/asset/${assetID}`);


  }
  catch (err) {
    console.log("err", err);
  }
  process.exit();
};


module.exports = {
  scenario2,
  scenario1,
  createNftScenario2,
  createNftScenario1,
  convertByte32ToIpfsCidV0,
  convertIpfsCidV0ToByte32,
  createAsset,
  createAccount,
  createNFT,
}