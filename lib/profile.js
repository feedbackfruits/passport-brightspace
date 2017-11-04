/**
 * Parse profile.
 *
 * @param {Object|String} json
 * @return {Object}
 * @api private
 */
exports.parse = function(json) {
  if ('string' === typeof json) {
    json = JSON.parse(json);
  }
  if (json instanceof Array) {
    json = json[0];
  }

  var profile = {};

  profile.id = json.ProfileIdentifier;
  profile.displayName = json.Nickname;

  if (json.Email && json.Email.length) {
    profile.emails = [ { value: json.Email } ];
  }

  return profile;
};
