class TaskCategory {
  constructor({
    id = Date.now(),
    status = true,
    user_id = null,
    type_id = null,
    category_id = null,
    schedule = null,
    statuses_id = null,
    // reminder_id = null,
    // telegram_id = null,
    title = "",
    des = "",
    rate = null,
    created_at = new Date(),
    updated_at = new Date()
  } = {}) {
    this.id = id;
    this.status = status;
    this.user_id = user_id;
    this.type_id = type_id,
    this.category_id = category_id,
    this.schedule = schedule,
    this.statuses_id = statuses_id,
    // this.reminder_id = reminder_id,
    // this.telegram_id = telegram_id,
    this.title = title;
    this.des = des;
    this.rate = rate,
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = TaskCategory;