const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name) ? describe.skip : describe("Raffle", async function() {
    let raffle, vrfCoordinatorV2Mock, entranceFee, deployer, interval

    beforeEach(async function() {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"])
        raffle = await ethers.getContract("Raffle", deployer)
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
        entranceFee = await raffle.getEntranceFee()
        interval = await raffle.getInterval()
    })

    describe("constructor", async function () {
        it("Initializes the Raffle Correctly", async function () {
            const raffleState = await raffle.getRaffleState();
            assert.equal(raffleState.toString(), "0")
        })
    })

    describe("Enter Raffle", async function() {
        it("reverts when you donot pay enough", async function() {
            await expect(raffle.enterRaffle()).to.be.revertedWith("Raffle__NotEnoughETHEntered")
        })

        it ("records player when they enter", async function() {
          await raffle.enterRaffle({ value: entranceFee })
          const playerFromContract = await raffle.getPlayers(0)
          assert.equal(playerFromContract, deployer)  
        })

        it ("Emits event on enter", async function() {
            await expect(raffle.enterRaffle({ value: entranceFee })).to.emit(raffle, "RaffleEnter")
        })

        it ("Does not allows entrance when raffle is calculating", async function() {
            await raffle.enterRaffle({value: entranceFee})
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1 ])
            await network.provider.send("evm_mine", [])
            await raffle.performUpkeep([])
            await expect(raffle.enterRaffle({ value: entranceFee })).to.be.revertedWith("Raffle__NotOpen")
        })

    })

    describe("Upkeep", async function () {
        it ("returns false if people haven't send eth", async function() {
            await network.provider.send("evm_increaseTime",  [interval.toNumber() + 1])
            await network.provider.send("evm_mine", [])
            const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
            assert(!upkeepNeeded)
        })
        
        it("returns false if raffle isn't open", async function (){
            await raffle.enterRaffle({value: entranceFee})
            await network.provider.send("evm_increaseTime",  [interval.toNumber() + 1])
            await network.provider.send("evm_mine", [])
            await raffle.performUpkeep([])
            const raffleState = await raffle.getRaffleState()
            const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
            assert.equal(raffleState.toString(), "1")
            assert.equal(upkeepNeeded, false )
        })

    })

     describe("performUpkeep", function() {
        it("Can automatically run if checkUpkeep is true", async function() {
            await raffle.enterRaffle({value: entranceFee})
            await network.provider.send("evm_increaseTime",  [interval.toNumber() + 1])
            await network.provider.send("evm_mine", [])
            const tx = await raffle.performUpkeep([])
            assert(tx)
        })

        it("reverts when checkupkeep is false", async function() {
            await expect(raffle.performUpkeep([])).to.be.revertedWith("Raffle__UpkeepNotNeeded")
        })

        it("updates the raffle state, emits an event, and calls the vrf coordinator", async function() {
            await raffle.enterRaffle({value: entranceFee})
            await network.provider.send("evm_increaseTime",  [interval.toNumber() + 1])
            await network.provider.send("evm_mine", [])
            const txResponse = await raffle.performUpkeep([])
            const txReceipt = await txResponse.wait(1)
            const requestId = txReceipt.events[1].args.requestId
            const raffleState = await raffle.getRaffleState()
            assert(requestId.toNumber() > 0)
            assert(raffleState.toString() == "1" ) 
        })

     })

     describe("fullfilRandomWords", function(){
        beforeEach(async function(){
            await raffle.enterRaffle({ value: entranceFee })
            await network.provider.send("evm_increaseTime",  [interval.toNumber() + 1])
            await network.provider.send("evm_mine", [])
        })
        it("can only be called after perform upkeep", async function() {
            await expect(vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)).to.be.revertedWith("nonexistent request")
        })

        it("picks a winner, resets and sends money", async function() {
            const additionalEntrants = 3
            const startingAccountIndex = 1; // deployer = 0
            const accounts = await ethers.getSigners()
            for(i = startingAccountIndex, i<additionalEntrants + startingAccountIndex; i++) {
                const accountConnectedRaffle = raffle.connect(accounts[i])
                await accountConnectedRaffle.enterRaffle({ value: entranceFee })
            }
            const startingTimeStamp = await raffle.getLastTimeStamp()
            await new Promise(async (resolve, reject) => {
                raffle.once("WinnerPicked", () => {
                    
                })
            })
        })

     })

})