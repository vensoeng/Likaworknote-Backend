class User {
  constructor({
    id,
    username,
    firstName,
    lastName,
    pr_img,
    gender,
    birthday,
    email,
    password,
    role,
    opt = null,
    telgram_id = null,
    created_at = new Date(),
    updated_at = new Date()
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
    this.telgram_id = telgram_id;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = User;