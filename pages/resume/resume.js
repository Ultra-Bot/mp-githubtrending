const cloudclient = require('../../utils/cloudclient.js')
const util = require('../../utils/util.js')
Page({
  data: {
    owner: '',
    view: {},
    info: '',
    spinning: false,
  },

  genProfile: function genProfile() {
    var v = this.data.view;
    var info = '## GitHub Profile\n' + v.userStatus + '\n\n';
    info += 'On GitHub'
    if (v.earlyAdopter) {
      info += ' as an early adopter'
    }
    info += ' since ' +  v.since + ', ' + v.name + ' is a developer'
    if (v.location) {
      info += ' based in ' + v.location
    }
    if (v.repos) {
      info += ' with ' + util.mdLink(v.repos + ' public ' + v.reposLabel, 'https://github.com/' + v.username)
    } else {
      info += ' without any public repository for now'
    }
    if (v.followers) {
      info += ' and ' + util.mdLink(v.followers + ' ' + v.followersLabel, 'https://github.com/' + v.username + '/followers');
    }
    info += '.'
    this.setData({info, spinning: false})
  },

  onLoad: function (options) {
    var self = this;
    this.setData({spinning: true, owner: options.name})
    this.getUser(options.name, function callback(data) {
      self.getView(options.name, data);
    })
  },

  getView: function getView(username, data) {
    var sinceDate = new Date(data.created_at);
    var sinceMonth = sinceDate.getMonth();
    var since = sinceDate.getFullYear();
    var sinceMonth = sinceDate.getMonth();
    var currentYear = (new Date).getFullYear();
    switch (since) {
      case currentYear - 1:
        since = 'last year';
        break;
      case currentYear:
        since = 'this year';
        break;
    }

    var addHttp = '';
    if (data.blog && data.blog.indexOf('http') < 0) {
      addHttp = 'http://';
    }

    // set view.name to the "friendly" name e.g. "John Doe". If not defined
    // (in which case data.name is empty), fall back to the login
    // name e.g. "johndoe"
    var name = username;
    if (data.name !== null && data.name !== undefined && data.name.length) {
      name = data.name;
    }

    var avatar = '';
    if (data.type == 'Organization') {
      avatar = data.avatar_url.match(/https:\/\/secure.gravatar.com\/avatar\/[0-9a-z]+/)[0];
      avatar += '?s=140&amp;d=https://github.com/images/gravatars/gravatar-140.png';
    }

    var view = {
      name: name,
      type: data.type,
      email: data.email,
      created_at: data.created_at,
      earlyAdopter: 0,
      location: data.location || '',
      gravatar_id: data.gravatar_id,
      avatar_url: avatar,
      repos: data.public_repos,
      reposLabel: data.public_repos > 1 ? 'repositories' : 'repository',
      followers: data.followers,
      followersLabel: data.followers > 1 ? 'followers' : 'follower',
      username: username,
      userStatus: 'GitHub user',
      since: since,
      resume_url: '',
    };

    // We consider a limit of 4 months since the GitHub opening (Feb 2008) to be considered as an early adopter
    if ((since == '2008' && sinceMonth <= 5) || since <= '2007') {
      view.earlyAdopter = 1;
    }

    view.userStatus = this.getUserStatus(view, data);
    this.setData({view: view});
    this.genProfile()
  },

  getUser: function getUser(owner, callback) {
    cloudclient.callFunction({ type: 'get', path: '/users/' + owner }, function (c) {
      console.log(c)
      callback(c)
    })
  },

  getUserStatus: function getUserStatus(view, data) {
    var COEF_REPOS = 2;
    var COEF_GISTS = 0.25;
    var COEF_FOLLOWERS = 0.5;
    var COEF_FOLLOWING = 0.25;
    var FIRST_STEP = 0;
    var SECOND_STEP = 5;
    var THIRD_STEP = 20;
    var FOURTH_STEP = 50;
    var FIFTH_STEP = 150;
    var EXTRA_POINT_GAIN = 1;

    var statusScore = data.public_repos * COEF_REPOS
      + data.public_gists * COEF_GISTS
      + data.followers * COEF_FOLLOWERS
      + data.following * COEF_FOLLOWING;

    // Extra points
    // - Early adopter
    if(view.earlyAdopter == 1) {
      statusScore += EXTRA_POINT_GAIN;
    }
    // - Blog & Email & Location
    if (view.location && view.location != '' && view.email && view.email != '' && data.blog && data.blog != '') {
      statusScore += EXTRA_POINT_GAIN;
    }

    if (statusScore == FIRST_STEP) {
      return 'Inactive GitHub user';
    } else if (statusScore > FIRST_STEP && statusScore <= SECOND_STEP) {
      return 'Newbie GitHub user';
    } else if (statusScore > SECOND_STEP && statusScore <= THIRD_STEP) {
      return 'Regular GitHub user';
    } else if (statusScore > THIRD_STEP && statusScore <= FOURTH_STEP) {
      return 'Advanced GitHub user';
    } else if (statusScore > FOURTH_STEP && statusScore <= FIFTH_STEP) {
      return 'Enthusiastic GitHub user';
    } else if (statusScore > FIFTH_STEP) {
      return 'Passionate GitHub user';
    }
  },

  onShareAppMessage: function () {

  }
})