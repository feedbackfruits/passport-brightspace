const BrightspaceStrategy = require('../dist/strategy').default;
const { expect, assert } = require('chai');

describe('Strategy#userProfile', function () {
  var strategy = new BrightspaceStrategy({
    host: 'https://api.brightspace.im',
    clientID: 'ABC123',
    clientSecret: 'secret'
  },
    function () { }
  );

  strategy._oauth2.get = function (url, accessToken, callback) {
    var testcases = {
      'https://api.brightspace.im/d2l/api/lp/1.31/users/whoami': '{ "Identifier": "1", "FirstName": "monalisa", "LastName": "octocat", "Email": "monalisa@github.com" }'
    };

    var body = testcases[url] || null;

    if (!body) {
      return callback(new Error('wrong url argument'));
    }

    if (accessToken != 'token') { return callback(new Error('wrong token argument')); }

    callback(null, body, undefined);
  };

  describe('successful profile retrieval', function () {
    describe('loading profile', function () {
      let profile;

      before(function (done) {
        strategy.userProfile('token', function (err, p) {
          if (err) { return done(err); }
          profile = p;
          done();
        });
      });

      it('should parse profile', function () {
        expect(profile.provider).to.equal('brightspace');
        expect(profile.id).to.equal('1');
        expect(profile.displayName).to.equal('monalisa octocat');
      });

      it('should include email in profile', function () {
        expect(profile.emails).to.deep.equal([{ value: 'monalisa@github.com' }]);
      });

      it('should set raw property', function () {
        expect(profile._raw).to.be.a('string');
      });

      it('should set json property', function () {
        expect(profile._json).to.be.an('object');
      });
    });
  });

  describe('profile with custom userProfileURL', function () {
    var customStrategy = new BrightspaceStrategy({
      host: 'https://api.brightspace.im',
      clientID: 'ABC123',
      clientSecret: 'secret',
      userProfileURL: 'https://custom.brightspace.im/api/user/me'
    },
      function () { }
    );

    it('should use custom userProfileURL', function (done) {
      customStrategy._oauth2.get = function (url, accessToken, callback) {
        expect(url).to.equal('https://custom.brightspace.im/api/user/me');
        callback(null, '{ "Identifier": "2", "FirstName": "custom", "LastName": "user" }', undefined);
      };

      customStrategy.userProfile('token', function (err, profile) {
        if (err) { return done(err); }
        expect(profile.id).to.equal('2');
        expect(profile.displayName).to.equal('custom user');
        done();
      });
    });
  });

  describe('error handling', function () {
    beforeEach(function () {
      strategy._oauth2.get = function (url, accessToken, callback) {
        if (accessToken === 'network-error') {
          return callback(new Error('Network connection failed'));
        }
        if (accessToken === 'invalid-json') {
          return callback(null, 'invalid json response', undefined);
        }
        if (accessToken === 'wrong-token') {
          return callback(new Error('wrong token argument'));
        }

        callback(null, '{ "Identifier": "1", "FirstName": "test", "LastName": "user" }', undefined);
      };
    });

    describe('encountering a network error', function () {
      var err, profile;

      before(function (done) {
        strategy.userProfile('network-error', function (e, p) {
          err = e;
          profile = p;
          done();
        });
      });

      it('should error', function () {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.constructor.name).to.equal('InternalOAuthError');
        expect(err.message).to.equal('Failed to fetch user profile');
      });

      it('should not load profile', function () {
        expect(profile).to.be.undefined;
      });
    });

    describe('encountering invalid JSON', function () {
      var err, profile;

      before(function (done) {
        strategy.userProfile('invalid-json', function (e, p) {
          err = e;
          profile = p;
          done();
        });
      });

      it('should error', function () {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('Failed to parse user profile');
      });

      it('should not load profile', function () {
        expect(profile).to.be.undefined;
      });
    });

    describe('encountering authentication error', function () {
      var err, profile;

      before(function (done) {
        strategy.userProfile('wrong-token', function (e, p) {
          err = e;
          profile = p;
          done();
        });
      });

      it('should error', function () {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.constructor.name).to.equal('InternalOAuthError');
        expect(err.message).to.equal('Failed to fetch user profile');
      });

      it('should not load profile', function () {
        expect(profile).to.be.undefined;
      });
    });
  });

  describe('profile data variations', function () {
    describe('profile without email', function () {
      it('should handle profile without email field', function (done) {
        strategy._oauth2.get = function (url, accessToken, callback) {
          callback(null, '{ "Identifier": "3", "FirstName": "no", "LastName": "email" }', undefined);
        };

        strategy.userProfile('token', function (err, profile) {
          if (err) { return done(err); }
          expect(profile.id).to.equal('3');
          expect(profile.displayName).to.equal('no email');
          expect(profile.emails).to.be.undefined;
          done();
        });
      });
    });

    describe('profile with empty email', function () {
      it('should handle profile with empty email', function (done) {
        strategy._oauth2.get = function (url, accessToken, callback) {
          callback(null, '{ "Identifier": "4", "FirstName": "empty", "LastName": "email", "Email": "" }', undefined);
        };

        strategy.userProfile('token', function (err, profile) {
          if (err) { return done(err); }
          expect(profile.id).to.equal('4');
          expect(profile.displayName).to.equal('empty email');
          expect(profile.emails).to.be.undefined;
          done();
        });
      });
    });

    describe('array response', function () {
      it('should handle array response from API', function (done) {
        strategy._oauth2.get = function (url, accessToken, callback) {
          callback(null, '[{ "Identifier": "5", "FirstName": "array", "LastName": "response", "Email": "array@test.com" }]', undefined);
        };

        strategy.userProfile('token', function (err, profile) {
          if (err) { return done(err); }
          expect(profile.id).to.equal('5');
          expect(profile.displayName).to.equal('array response');
          expect(profile.emails).to.deep.equal([{ value: 'array@test.com' }]);
          done();
        });
      });
    });
  });
});
