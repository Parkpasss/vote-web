App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasVoted: false,

  init: function () {
    return App.initWeb3()
  },

  initWeb3: function () {
    if (typeof window.ethereum !== 'undefined') {
      App.web3Provider = window.ethereum
      web3 = new Web3(window.ethereum)
      window.ethereum
        .request({ method: 'eth_requestAccounts' })
        .then(function (accounts) {
          App.account = accounts[0]
          App.initContract()
        })
        .catch(function (error) {
          console.error(error)
        })
    } else {
      App.web3Provider = new Web3.providers.HttpProvider(
        'http://localhost:7545'
      )
      web3 = new Web3(App.web3Provider)
      App.initContract()
    }
    return App.initContract()
  },

  initContract: function () {
    $.getJSON('Vote.json', function (vote) {
      App.contracts.vote = TruffleContract(vote)
      App.contracts.vote.setProvider(App.web3Provider)
      App.contracts.vote
        .deployed()
        .then(function (instance) {
          App.contracts.voteInstance = instance
          return App.render()
        })
        .catch(function (error) {
          console.warn(error)
        })
    })

    $('#voteTopicForm').submit(function (event) {
      event.preventDefault()
      var newVoteTopic = $('#voteTopic').val()
      App.contracts.voteInstance
        .setVoteTopic(newVoteTopic, { from: App.account })
        .then(function (result) {
          if (result.receipt.status === '0x01') {
            return App.render()
          } else {
            console.error('Failed to set the vote topic')
          }
        })
        .catch(function (error) {
          console.error(error)
        })
    })
  },

  render: function () {
    var loader = $('#loader')
    var content = $('#content')
    loader.show()
    content.hide()

    web3.eth.getCoinbase(function (err, account) {
      if (err === null) {
        App.account = account
        $('#accountAddress').html(
          "<span id='accountTag'>Your Account :</span> <span id='myAccount'>" +
            account +
            '</span>'
        )
      }
    })

    App.contracts.voteInstance
      .voteTopic()
      .then(function (topic) {
        $('#tag').text(topic)
        return App.contracts.voteInstance.candidatesCount()
      })
      .then(function (candidatesCount) {
        var candidatesResults = $('#candidatesResults')
        // Clear existing content
        candidatesResults.empty()
        var candidatesSelect = $('#candidatesSelect')
        // Clear existing content
        candidatesSelect.empty()

        var promises = []
        for (var i = 1; i <= candidatesCount; i++) {
          promises.push(App.contracts.voteInstance.candidates(i))
        }

        return Promise.all(promises)
      })
      .then(function (candidates) {
        candidates.forEach(function (candidate) {
          var id = candidate[0]
          var name = candidate[1]
          var voteCount = candidate[2]

          var candidateTemplate =
            '<tr><td>' +
            id +
            '</td><td>' +
            name +
            '</td><td>' +
            voteCount +
            '</td></tr>'
          $('#candidatesResults').append(candidateTemplate)

          var candidateOption =
            "<option value='" + id + "' >" + name + '</option>'
          $('#candidatesSelect').append(candidateOption)
        })

        return App.contracts.voteInstance.voters(App.account)
      })
      .then(function (hasVoted) {
        if (hasVoted) {
          $('form').hide()
          $('#voteStatus').show()
        }
        loader.hide()
        content.show()
      })
      .catch(function (error) {
        console.warn(error)
      })
  },

  addNewCandidate: function () {
    var newCandidateName = $('#newCandidateName').val()
    App.contracts.voteInstance
      .addNewCandidate(newCandidateName, { from: App.account })
      .then(function (result) {
        return App.render()
      })
      .catch(function (err) {
        console.error(err)
      })
  },

  castVote: function () {
    var candidateId = $('#candidatesSelect').val()
    App.contracts.voteInstance
      .vote(candidateId, { from: App.account })
      .then(function (result) {
        $('#content').hide()
        $('#loader').show()
      })
      .catch(function (err) {
        console.error(err)
      })
  },
}

$(function () {
  $('#addCandidateForm').submit(function (event) {
    event.preventDefault()
    App.addNewCandidate()
  })

  $('#voteForm').submit(function (event) {
    event.preventDefault()
    App.castVote()
  })

  $(document).ready(function () {
    App.init()
  })
})
