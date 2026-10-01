const mongoose = require('mongoose');

const housekeepingTaskSchema = new mongoose.Schema({
  room_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  task_type: {
    type: String,
    enum: ['cleaning', 'maintenance', 'inspection', 'deep_clean'],
    default: 'cleaning',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'skipped'],
    default: 'pending',
  },
  scheduled_date: {
    type: Date,
  },
  completed_at: {
    type: Date,
  },
  notes: {
    type: String,
    trim: true,
  },
  guest_name: {
    type: String,
    trim: true,
  },
  departure_time: {
    type: Date,
  },
}, {
  timestamps: true,
  collection: 'housekeeping_tasks',
});

housekeepingTaskSchema.index({ room_id: 1 });
housekeepingTaskSchema.index({ assigned_to: 1 });
housekeepingTaskSchema.index({ status: 1 });
housekeepingTaskSchema.index({ scheduled_date: 1 });

const HousekeepingTask = mongoose.model('HousekeepingTask', housekeepingTaskSchema);

module.exports = HousekeepingTask;
