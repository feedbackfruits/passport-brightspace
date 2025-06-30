import OAuth2Strategy, { InternalOAuthError, StrategyOptions, VerifyFunction } from 'passport-oauth2';
import { type oauth2tokenCallback } from 'oauth';

type BrightspaceStrategyOptions = StrategyOptions & {
  host: string;
  userProfileURL?: string;
}

/**
 * `Strategy` constructor.
 *
 * The Brightspace authentication strategy authenticates requests by delegating to
 * Brightspace using the OAuth 2.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `done`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occured, `err` should be set.
 *
 * Options:
 *   - `host`          your Brightspace application's host
 *   - `clientID`      your Brightspace application's Client ID
 *   - `clientSecret`  your Brightspace application's Client Secret
 *   - `callbackURL`   URL to which Brightspace will redirect the user after granting authorization
 *
 * Examples:
 *
 *     passport.use(new BrightspaceStrategy({
 *         host: 'http://brightspace.example.net/',
 *         clientID: '123-456-789',
 *         clientSecret: 'shhh-its-a-secret',
 *         callbackURL: 'https://www.example.net/auth/brightspace/callback',
 *       },
 *       function(accessToken, refreshToken, profile, done) {
 *         User.findOrCreate(..., function (err, user) {
 *           done(err, user);
 *         });
 *       }
 *     ));
 *
 * @api public
 */
export default class Strategy extends OAuth2Strategy {
  options: BrightspaceStrategyOptions;
  _userProfileURL: string;

  constructor(options: BrightspaceStrategyOptions, verify: VerifyFunction) {
    options.authorizationURL = options.authorizationURL || 'https://auth.brightspace.com/oauth2/auth';
    options.tokenURL = options.tokenURL|| 'https://auth.brightspace.com/core/connect/token';
    options.scopeSeparator = options.scopeSeparator || ' ';
    options.customHeaders = options.customHeaders || {};
    super(options, verify);

    this.options = options;

    console.log('Configuring strategy with options:', this.options);

    this.name = 'brightspace';
    this._userProfileURL = options.userProfileURL || `${this.options.host}/d2l/api/lp/1.31/users/whoami`;
    this._oauth2.useAuthorizationHeaderforGET(true);
    this._oauth2.getOAuthAccessToken = (code: string, params: any | oauth2tokenCallback, callback?: oauth2tokenCallback): void => {
      // Handle overload where params is actually the callback
      if (typeof params === 'function') {
        callback = params;
        params = {};
      }

      const actualParams = params as any;
      const actualCallback = callback as oauth2tokenCallback;

      const codeParam = (actualParams.grant_type === 'refresh_token') ? 'refresh_token' : 'code';
      actualParams[codeParam] = code;

      const post_data = new URLSearchParams(actualParams).toString();
      const post_headers= {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${this.options.clientID}:${this.options.clientSecret}`).toString('base64')
      };

      // @ts-expect-error The JS version of this class accessed protected members directly,
      // we can't easily rewrite that so we're using `@ts-expect-error` to ignore the type error for now.
      this._oauth2._request('POST', this._oauth2._getAccessTokenUrl(), post_headers, post_data, null, function(error, data, response) {
        if (error) {
          actualCallback(error);
        } else {
          let results;
          try {
            // As of http://tools.ietf.org/html/draft-ietf-oauth-v2-07
            // responses should be in JSON
            results = JSON.parse(data as string);
          }
          catch(e) {
            // .... However both Facebook + Github currently use rev05 of the spec
            // and neither seem to specify a content-type correctly in their response headers :(
            // clients of these services will suffer a *minor* performance cost of the exception
            // being thrown
            results= Object.fromEntries(new URLSearchParams(data.toString()));
          }

          const access_token= results['access_token'];
          const refresh_token= results['refresh_token'];
          delete results['refresh_token'];
          callback(null, access_token, refresh_token, results); // callback results =-=
        }
      });
    }
  }

  /**
   * Retrieve user profile from Brightspace.
   *
   * This function constructs a normalized profile, with the following properties:
   *
   *   - `provider`         always set to `brightspace`
   *   - `id`               the user's Brightspace ID
   *   - `username`         the user's Brightspace username
   *   - `displayName`      the user's full name
   *   - `profileUrl`       the URL of the profile for the user on Brightspace
   *
   * @param {String} accessToken
   * @param {Function} done
   * @api protected
   */
  override userProfile(accessToken: string, done: (error: any, profile?: any) => void) {
    this._oauth2.get(this._userProfileURL, accessToken, (err, body, res) => {
      let json: Record<string, unknown>;

      if (err) {
        return done(new InternalOAuthError('Failed to fetch user profile', err));
      }

      try {
        json = JSON.parse(body as string);
      } catch (ex) {
        return done(new Error('Failed to parse user profile'));
      }

      const profile = this.parse(json);
      profile.provider  = 'brightspace';
      profile._raw = body;
      profile._json = json;

      done(null, profile);
    });
  };

  public parse(json: string | Record<string, unknown>) {
    if (typeof json === 'string') {
      json = JSON.parse(json);
    }

    if (json instanceof Array) {
      json = json[0];
    }

    const profile: Record<string, unknown> = {};
    const assertedJson = json as Record<string, unknown>;

    profile.id = assertedJson.Identifier;
    profile.displayName = `${assertedJson.FirstName} ${assertedJson.LastName}`;

    if (assertedJson.Email && (assertedJson.Email as string).length) {
      profile.emails = [ { value: assertedJson.Email } ];
    }

    return profile;
  };
}
