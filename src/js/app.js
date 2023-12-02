App = {
  // Web3 프로바이더, 스마트 계약 등의 정보를 담을 객체
  web3Provider: null,
  contracts: {},
  // 사용자의 계정 주소
  account: '0x0',
  // 투표 여부 플래그
  hasVoted: false,

  // 초기화 함수
  init: function () {
    return App.initWeb3()
  },

  // Web3 초기화 함수
  initWeb3: function () {
    if (typeof window.ethereum !== 'undefined') {
      // MetaMask와 같은 웹3 지원 브라우저가 있을 경우
      App.web3Provider = window.ethereum
      web3 = new Web3(window.ethereum)
      window.ethereum
        .request({ method: 'eth_requestAccounts' })
        .then(function (accounts) {
          App.account = accounts[0]
          App.initContract()
        })
    } else {
      // 웹3 지원 브라우저가 없을 경우 로컬 테스트 네트워크에 연결
      App.web3Provider = new Web3.providers.HttpProvider(
        'http://localhost:7545'
      )
      web3 = new Web3(App.web3Provider)
      App.initContract()
    }
    return App.initContract()
  },

  // 스마트 계약 초기화 함수
  initContract: function () {
    // Vote.json 파일을 불러와 스마트 계약 객체 초기화
    $.getJSON('Vote.json', function (vote) {
      App.contracts.vote = TruffleContract(vote)
      App.contracts.vote.setProvider(App.web3Provider)
      App.contracts.vote.deployed().then(function (instance) {
        // 스마트 계약 인스턴스 설정 후 UI 렌더링
        App.contracts.voteInstance = instance
        return App.render()
      })
    })

    // 투표 주제 설정 폼 이벤트 핸들러
    $('#voteTopicForm').submit(function (event) {
      event.preventDefault()
      var newVoteTopic = $('#voteTopic').val()
      App.contracts.voteInstance
        .setVoteTopic(newVoteTopic, { from: App.account })
        .then(function (result) {
          // 투표 주제 설정 성공 시 UI 렌더링
          if (result.receipt.status === '0x01') {
            return App.render()
          } else {
            console.error('Failed to set the vote topic')
          }
        })
    })
  },

  // UI 렌더링 함수
  render: function () {
    var loader = $('#loader')
    var content = $('#content')
    loader.show()
    content.hide()

    // 사용자 계정 주소 표시
    web3.eth.getCoinbase(function (err, account) {
      if (err === null) {
        App.account = account
        $('#accountAddress').html(
          "<span id='accountTag'>계정:</span> <span id='myAccount'>" +
            account +
            '</span>'
        )
      }
    })

    // 투표 주제 및 후보자 정보 가져오기
    App.contracts.voteInstance
      .voteTopic()
      .then(function (topic) {
        $('#tag').text(topic)
        return App.contracts.voteInstance.candidatesCount()
      })
      .then(function (candidatesCount) {
        var candidatesResults = $('#candidatesResults')
        var candidatesSelect = $('#candidatesSelect')

        // candidatesResults와 candidatesSelect가 비어있을 때만 기존 내용 지우기
        if (candidatesResults.is(':empty') && candidatesSelect.is(':empty')) {
          candidatesResults.empty()
          candidatesSelect.empty()

          // 모든 후보자 정보 가져오기
          var promises = []
          for (var i = 1; i <= candidatesCount; i++) {
            promises.push(App.contracts.voteInstance.candidates(i))
          }

          return Promise.all(promises)
        }
      })
      .then(function (candidates) {
        // 가져온 후보자 정보를 UI에 추가
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

        // 사용자의 투표 여부 확인 후 UI 갱신
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
  },

  // 새로운 후보자 추가 함수
  addNewCandidate: function () {
    var newCandidateName = $('#newCandidateName').val()
    App.contracts.voteInstance
      .addNewCandidate(newCandidateName, { from: App.account })
      .then(function (result) {
        return App.render()
      })
  },

  // 투표 함수
  castVote: function () {
    var candidateId = $('#candidatesSelect').val()
    App.contracts.voteInstance
      .vote(candidateId, { from: App.account })
      .then(function (result) {
        $('#content').hide()
        $('#loader').show()
      })
  },
}

// 페이지 로딩 시 초기화 함수 호출
$(function () {
  // 후보자 추가 폼 이벤트 핸들러
  $('#addCandidateForm').submit(function (event) {
    event.preventDefault()
    App.addNewCandidate()
  })

  // 투표 폼 이벤트 핸들러
  $('#voteForm').submit(function (event) {
    event.preventDefault()
    App.castVote()
  })

  // 페이지 로딩 시 초기화 함수 호출
  $(document).ready(function () {
    App.init()
  })
})
