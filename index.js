const arc3ipfs = require('./arc3-ipfs.js')
async function demoArc3Ipfs() {
    await arc3ipfs.createNftScenario1();
    console.log('======================End of Scenario 1 Demo =======================')
    await arc3ipfs.createNftScenario2();
    console.log('======================End of Scenario 2 Demo =======================')
    arc3ipfs.createNFT();
    console.log('======================End of Create NFT Demo =======================')
}

demoArc3Ipfs();

