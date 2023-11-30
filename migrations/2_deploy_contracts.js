const Vote = artifacts.require('Vote')

module.exports = function (deployer) {
  deployer.deploy(Vote, '주제 예시 ')
}
