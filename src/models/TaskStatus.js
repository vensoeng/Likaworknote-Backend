class TaskStatus {
  constructor({
    id = Date.now(),
    user_id = null,
    title,
    des = "",
    value = "",
    created_at = new Date(),
    updated_at = new Date()
  } = {}) {
    this.id = id;
    this.user_id = user_id;
    this.title = title;
    this.des = des;
    this.value = value;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = TaskStatus;