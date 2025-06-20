// @ts-nocheck
import BrightspaceStrategy from '../src';
import fs from 'fs';
import { expect } from 'chai';

describe('Strategy', function() {
  describe('constructor', function() {
    it('should create strategy without host (for backward compatibility)', function() {
      expect(() => {
        new BrightspaceStrategy({
          clientID: 'ABC123',
          clientSecret: 'secret'
        }, function() {});
      }).to.not.throw();
    });

    it('should set default authorizationURL', function() {
      const strategy = new BrightspaceStrategy({
        host: 'https://example.brightspace.com',
        clientID: 'ABC123',
        clientSecret: 'secret'
      }, function() {});

      expect(strategy.options.authorizationURL).to.equal('https://auth.brightspace.com/oauth2/auth');
    });

    it('should set default tokenURL', function() {
      const strategy = new BrightspaceStrategy({
        host: 'https://example.brightspace.com',
        clientID: 'ABC123',
        clientSecret: 'secret'
      }, function() {});

      expect(strategy.options.tokenURL).to.equal('https://auth.brightspace.com/core/connect/token');
    });

    it('should allow custom authorizationURL', function() {
      const customAuthURL = 'https://custom.brightspace.com/oauth2/auth';
      const strategy = new BrightspaceStrategy({
        host: 'https://example.brightspace.com',
        clientID: 'ABC123',
        clientSecret: 'secret',
        authorizationURL: customAuthURL
      }, function() {});

      expect(strategy.options.authorizationURL).to.equal(customAuthURL);
    });

    it('should allow custom tokenURL', function() {
      const customTokenURL = 'https://custom.brightspace.com/token';
      const strategy = new BrightspaceStrategy({
        host: 'https://example.brightspace.com',
        clientID: 'ABC123',
        clientSecret: 'secret',
        tokenURL: customTokenURL
      }, function() {});

      expect(strategy.options.tokenURL).to.equal(customTokenURL);
    });

    it('should set default scopeSeparator to space', function() {
      const strategy = new BrightspaceStrategy({
        host: 'https://example.brightspace.com',
        clientID: 'ABC123',
        clientSecret: 'secret'
      }, function() {});

      expect(strategy.options.scopeSeparator).to.equal(' ');
    });

    it('should set default userProfileURL based on host', function() {
      const host = 'https://example.brightspace.com';
      const strategy = new BrightspaceStrategy({
        host: host,
        clientID: 'ABC123',
        clientSecret: 'secret'
      }, function() {});

      expect(strategy._userProfileURL).to.equal(`${host}/d2l/api/lp/1.31/users/whoami`);
    });

    it('should allow custom userProfileURL', function() {
      const customProfileURL = 'https://custom.brightspace.com/api/profile';
      const strategy = new BrightspaceStrategy({
        host: 'https://example.brightspace.com',
        clientID: 'ABC123',
        clientSecret: 'secret',
        userProfileURL: customProfileURL
      }, function() {});

      expect(strategy._userProfileURL).to.equal(customProfileURL);
    });

    it('should configure OAuth2 to use authorization header for GET', function() {
      const strategy = new BrightspaceStrategy({
        host: 'https://example.brightspace.com',
        clientID: 'ABC123',
        clientSecret: 'secret'
      }, function() {});

      expect(strategy._oauth2._useAuthorizationHeaderForGET).to.be.true;
    });
  });

  describe('strategy name', function() {
    const strategy = new BrightspaceStrategy({
        host: 'https://example.brightspace.com',
        clientID: 'ABC123',
        clientSecret: 'brightspace'
      },
      function() {}
    );

    it('should be named brightspace', function() {
      expect(strategy.name).to.equal('brightspace');
    });
  });

  describe('profile.parse', function() {
    const strategy = new BrightspaceStrategy({
        host: 'https://example.brightspace.com',
        clientID: 'ABC123',
        clientSecret: 'secret'
      },
      function() {}
    );

    describe('example profile', function() {
      let profile;

      before(function(done) {
        fs.readFile('test/data/example.json', 'utf8', function(err, data) {
          if (err) { return done(err); }
          profile = strategy.parse(data);
          done();
        });
      });

      it('should parse profile', function() {
        expect(profile.id).to.equal('1');
        expect(profile.displayName).to.equal('monalisa octocat');
      });
    });

    describe('profile with email', function() {
      it('should parse profile with email', function() {
        const json = {
          Identifier: '123',
          FirstName: 'John',
          LastName: 'Doe',
          Email: 'john.doe@example.com'
        };

        const profile = strategy.parse(json);

        expect(profile.id).to.equal('123');
        expect(profile.displayName).to.equal('John Doe');
        expect(profile.emails).to.deep.equal([{ value: 'john.doe@example.com' }]);
      });
    });

    describe('profile with empty email', function() {
      it('should not include emails if email is empty', function() {
        const json = {
          Identifier: '123',
          FirstName: 'John',
          LastName: 'Doe',
          Email: ''
        };

        const profile = strategy.parse(json);

        expect(profile.id).to.equal('123');
        expect(profile.displayName).to.equal('John Doe');
        expect(profile.emails).to.be.undefined;
      });
    });

    describe('profile without email', function() {
      it('should not include emails if email is missing', function() {
        const json = {
          Identifier: '123',
          FirstName: 'John',
          LastName: 'Doe'
        };

        const profile = strategy.parse(json);

        expect(profile.id).to.equal('123');
        expect(profile.displayName).to.equal('John Doe');
        expect(profile.emails).to.be.undefined;
      });
    });

    describe('array response', function() {
      it('should parse first element of array response', function() {
        const jsonArray = [
          {
            Identifier: '456',
            FirstName: 'Jane',
            LastName: 'Smith',
            Email: 'jane.smith@example.com'
          },
          {
            Identifier: '789',
            FirstName: 'Bob',
            LastName: 'Johnson'
          }
        ];

        const profile = strategy.parse(jsonArray);

        expect(profile.id).to.equal('456');
        expect(profile.displayName).to.equal('Jane Smith');
        expect(profile.emails).to.deep.equal([{ value: 'jane.smith@example.com' }]);
      });
    });

    describe('string input', function() {
      it('should parse JSON string input', function() {
        const jsonString = JSON.stringify({
          Identifier: '789',
          FirstName: 'Alice',
          LastName: 'Brown'
        });

        const profile = strategy.parse(jsonString);

        expect(profile.id).to.equal('789');
        expect(profile.displayName).to.equal('Alice Brown');
      });
    });
  });
});
