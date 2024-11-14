# passport-brightspace

[![codecov](https://codecov.io/gh/feedbackfruits/passport-brightspace/branch/master/graph/badge.svg)](https://codecov.io/gh/feedbackfruits/passport-brightspace)

> [!IMPORTANT]
> Media now require yarn v4+, make sure to upgrade your local yarn by running `corepack enable`

[Passport](http://passportjs.org/) strategy for authenticating with [Brightspace](http://docs.valence.desire2learn.com/reference.html)
using the OAuth 2.0 API.

This module lets you authenticate using Brightspace in your Node.js applications.
By plugging into Passport, Brightspace authentication can be easily and
unobtrusively integrated into any application or framework that supports
[Connect](http://www.senchalabs.org/connect/)-style middleware, including
[Express](http://expressjs.com/).

## Install
```sh
npm install passport-brightspace
# or
yarn add passport-brightspace
```

## Usage

#### Configure Strategy

The Brightspace authentication strategy authenticates users using a Brightspace account
and OAuth 2.0 tokens.  The strategy requires a `verify` callback, which accepts
these credentials and calls `done` providing a user, as well as `options`
specifying a client ID, client secret, and callback URL.

```js
passport.use(new BrightspaceStrategy({
  host: BRIGHTSPACE_HOST,
  clientID: BRIGHTSPACE_CLIENT_ID,
  clientSecret: BRIGHTSPACE_CLIENT_SECRET,
  callbackURL: "http://127.0.0.1:3000/auth/brightspace/callback"
},
function(accessToken, refreshToken, profile, done) {
  User.findOrCreate({ brightspaceId: profile.id }, function (err, user) {
    return done(err, user);
  });
}
));
```

#### Authenticate Requests

Use `passport.authenticate()`, specifying the `'brightspace'` strategy, to
authenticate requests.

For example, as route middleware in an [Express](http://expressjs.com/)
application:

```js
    app.get('/auth/brightspace',
      passport.authenticate('brightspace', { }));

    app.get('/auth/brightspace/callback',
      passport.authenticate('brightspace', { failureRedirect: '/login' }),
      function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/');
      });
```

## Tests

```sh
yarn
yarn test
```

## License

[The MIT License](http://opensource.org/licenses/MIT)
