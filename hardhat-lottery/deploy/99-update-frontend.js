const { ethers, network } = require("hardhat")
const fs = require("fs")
const FRONT_END_ADDRESS_FILE = "../nextjs-smartcontract-lottery-fcc/constants/contractAddress.json"
const FRONT_END_ABI = "../nextjs-smartcontract-lottery-fcc/constants/abi.json"

module.exports=async function(){
    if (process.env.UPDATE_FRONTEND) {
        updateContractAddresses()
        updateAbi()
    }
}

async function updateAbi() {
    const raffle = await ethers.getContract("Raffle")
    fs.writeFileSync(FRONT_END_ABI, raffle.interface.format(ethers.utils.FormatTypes.json))
}

async function updateContractAddresses() {
    const raffle = await ethers.getContract("Raffle")
    const chainId = network.config.chainId.toString();
    const currentAddresses = JSON.parse(fs.readFileSync(FRONT_END_ADDRESS_FILE, "utf8"))
    if (chainId in currentAddresses) {
        if (!currentAddresses[chainId].includes(raffle.address)) {
            currentAddresses[chainId].push(raffle.address)
        }
    } {
        currentAddresses[chainId] = [raffle.address]
    }
    fs.writeFileSync(FRONT_END_ADDRESS_FILE, JSON.stringify(currentAddresses))
}

module.exports.tags = ["all", "frontend"]