class TaskType {
  constructor({
    id = Date.now(),
    user_id = null,
    title,
    des = "",
    created_at = new Date(),
    updated_at = new Date()
  } = {}) {
    this.id = id;
    this.user_id = user_id;
    this.title = title;
    this.des = des;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = TaskType;