const BrightspaceStrategy = require('../lib/strategy');
const { expect } = require('chai');

describe('Strategy#userProfile', function() {
  var strategy =  new BrightspaceStrategy({
      host: 'https://api.brightspace.im',
      clientID: 'ABC123',
      clientSecret: 'secret'
    },
    function() {});

  // mock
  strategy._oauth2.get = function(url, accessToken, callback) {
      var testcases = {
        'https://api.brightspace.im/d2l/api/lp/1.31/users/whoami': '{ "Identifier": "1", "FirstName": "monalisa", "LastName": "octocat" }'
      };

      var body = testcases[url] || null;
      if (!body) {
        return callback(new Error('wrong url argument'));
      }

      if (accessToken != 'token') { return callback(new Error('wrong token argument')); }

    callback(null, body, undefined);
  };

  describe('loading profile', function() {
    var profile;

    before(function(done) {
      strategy.userProfile('token', function(err, p) {
        if (err) { return done(err); }
        profile = p;
        done();
      });
    });

    it('should parse profile', function() {
      expect(profile.provider).to.equal('brightspace');

      expect(profile.id).to.equal('1');
      expect(profile.displayName).to.equal('monalisa octocat');
    });

    it('should set raw property', function() {
      expect(profile._raw).to.be.a('string');
    });

    it('should set json property', function() {
      expect(profile._json).to.be.an('object');
    });
  });

  describe('encountering an error', function() {
    var err, profile;

    before(function(done) {
      strategy.userProfile('wrong-token', function(e, p) {
        err = e;
        profile = p;
        done();
      });
    });

    it('should error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.constructor.name).to.equal('InternalOAuthError');
      expect(err.message).to.equal('Failed to fetch user profile');
    });

    it('should not load profile', function() {
      expect(profile).to.be.undefined;
    });
  });
});
