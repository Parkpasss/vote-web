var Vote = artifacts.require('./Vote.sol')
var truffleAssert = require('truffle-assertions')

contract('Vote', function (accounts) {
  var voteInstance

  it('initializes with two candidates', function () {
    return Vote.deployed()
      .then(function (instance) {
        return instance.candidatesCount()
      })
      .then(function (count) {
        assert.equal(count, 3)
      })
  })

  it('it initializes the candidates with the correct values', function () {
    return Vote.deployed()
      .then(function (instance) {
        voteInstance = instance
        return voteInstance.candidates(1)
      })
      .then(function (candidate) {
        assert.equal(candidate[0], 1, 'contains the correct id')
        assert.equal(candidate[1], 'John Wick', 'contains the correct name')
        assert.equal(candidate[2], 0, 'contains the correct votes count')
        return voteInstance.candidates(2)
      })
      .then(function (candidate) {
        assert.equal(candidate[0], 2, 'contains the correct id')
        assert.equal(candidate[1], 'Browney Jr', 'contains the correct name')
        assert.equal(candidate[2], 0, 'contains the correct votes count')
        return voteInstance.candidates(3)
      })
      .then(function (candidate) {
        assert.equal(candidate[0], 3, 'contains the correct id')
        assert.equal(
          candidate[1],
          'Helena Williams',
          'contains the correct name'
        )
        assert.equal(candidate[2], 0, 'contains the correct votes count')
      })
  })

  it('allows a voter to cast a vote', function () {
    return vote
      .deployed()
      .then(function (instance) {
        voteInstance = instance
        candidateId = 1
        return voteInstance.vote(candidateId, { from: accounts[0] })
      })
      .then(function (receipt) {
        //assert.equal(receipt.logs.length, 1, "an event was triggered");
        //assert.equal(receipt.logs[0].event, "votedEvent", "the event type is correct");
        //assert.equal(receipt.logs[0].args._candidateId.toNumber(), candidateId, "the candidate id is correct");
        return voteInstance.voters(accounts[0])
      })
      .then(function (voted) {
        assert(voted, 'the voter was marked as voted')
        return voteInstance.candidates(candidateId)
      })
      .then(function (candidate) {
        var voteCount = candidate[2]
        assert.equal(voteCount, 1, "increments the candidate's vote count")
      })
  })

  it('throws an exception for invalid candiates', function () {
    return Vote.deployed()
      .then(function (instance) {
        voteInstance = instance
        return voteInstance.vote(99, { from: accounts[1] })
      })
      .then(assert.fail)
      .catch(function (error) {
        assert(
          error.message.indexOf('revert') >= 0,
          'error message must contain revert'
        )
        return voteInstance.candidates(1)
      })
      .then(function (candidate1) {
        var voteCount = candidate1[2]
        assert.equal(voteCount, 1, 'candidate 1 did not receive any votes')
        return voteInstance.candidates(2)
      })
      .then(function (candidate2) {
        var voteCount = candidate2[2]
        assert.equal(voteCount, 0, 'candidate 2 did not receive any votes')
      })
  })

  it('throws an exception for double voting', async function () {
    const instance = await Vote.deployed()
    const candidateId = 2

    // First vote
    await instance.vote(candidateId, { from: accounts[1] })

    // Try to vote again and assert that it reverts
    await truffleAssert.reverts(
      instance.vote(candidateId, { from: accounts[1] }),
      'revert'
    )

    // Check the vote count for the candidates
    const candidate1 = await instance.candidates(1)
    const voteCount1 = candidate1[2]
    assert.equal(voteCount1, 1, 'candidate 1 did not receive any votes')

    const candidate2 = await instance.candidates(2)
    const voteCount2 = candidate2[2]
    assert.equal(voteCount2, 1, 'candidate 2 did not receive any votes')
  })

  it('allows adding a new candidate', async function () {
    const instance = await Vote.deployed()
    const newCandidateName = 'New Candidate'

    // Add a new candidate
    await instance.addNewCandidate(newCandidateName, { from: accounts[1] }) // 변경: 계정을 바꿔보세요.

    // Check the candidates count
    const candidatesCount = await instance.candidatesCount()
    assert.equal(candidatesCount, 4, 'increments the candidates count')

    // Check the details of the new candidate
    const newCandidate = await instance.candidates(4)
    assert.equal(newCandidate[0], 4, 'contains the correct id')
    assert.equal(newCandidate[1], newCandidateName, 'contains the correct name')
    assert.equal(newCandidate[2], 0, 'contains the correct votes count')
  })
})
