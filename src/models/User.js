
class User {
  constructor({
    id,
    username,
    firstName,
    lastName,
    pr_img = null,
    gender = "",
    birthday = "",
    email,
    password,
    role = 2,
    opt = null,
    telegram_id = null,
    must_change_password = false,
    created_at = new Date().toISOString(),
    updated_at = new Date().toISOString()
  }) {
    this.id = id;
    this.username = username;
    this.firstName = firstName;
    this.lastName = lastName;
    this.pr_img = pr_img;
    this.gender = gender;
    this.birthday = birthday;
    this.email = email;
    this.password = password;
    this.role = role;
    this.opt = opt;
    this.telegram_id = telegram_id;
    this.must_change_password = must_change_password;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = User;
