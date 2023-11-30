// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Vote {
    string public voteTopic;
    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    mapping(uint256 => Candidate) public candidates;
    mapping(address => bool) public voters;
    uint256 public candidatesCount;

    constructor(string memory _topic) {
        voteTopic = _topic;
        addCandidate("Kim");
        addCandidate("Lee");
        addCandidate("Park");
    }

    function addCandidate(string memory _name) private {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
    }

    function addNewCandidate(string memory _name) public {
        require(!voters[msg.sender], "Voter cannot add a new candidate after voting.");
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
    }

    function vote(uint256 _candidateId) public {
        require(!voters[msg.sender], "You have already voted.");
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate ID.");

        voters[msg.sender] = true;
        candidates[_candidateId].voteCount++;
    }

    function setVoteTopic(string memory _topic) public {
        require(!voters[msg.sender], "Voter cannot set the vote topic after voting.");
        voteTopic = _topic;
    }
}